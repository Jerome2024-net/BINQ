import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { appliquerPenalite, saisirCaution, calculerScore } from "@/lib/contraintes";

const CRON_SECRET = process.env.CRON_SECRET || "";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const now = new Date();
  const resultats = {
    rappelsEnvoyes: 0,
    prelevementsEffectues: 0,
    penalitesAppliquees: 0,
    exclusions: 0,
    erreurs: [] as string[],
  };

  try {
    // Tours en cours avec leur tontine
    const { data: toursActifs } = await supabase
      .from("tours")
      .select("*, tontines(*)")
      .eq("statut", "en_cours");

    if (!toursActifs?.length) {
      return NextResponse.json({ message: "Aucun tour actif", resultats });
    }

    for (const tour of toursActifs) {
      const tontine = tour.tontines;
      const dateLimite = new Date(tour.date_prevue);
      const diffMs = dateLimite.getTime() - now.getTime();
      const joursRestants = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const joursRetard = Math.ceil(-diffMs / (1000 * 60 * 60 * 24));

      // Trouver les membres qui n'ont pas payé ce tour
      const { data: membresActifs } = await supabase
        .from("membres")
        .select("user_id")
        .eq("tontine_id", tour.tontine_id)
        .eq("statut", "actif");

      if (!membresActifs?.length) continue;

      // Paiements confirmés pour ce tour
      const { data: paiementsConfirmes } = await supabase
        .from("paiements")
        .select("membre_id")
        .eq("tour_id", tour.id)
        .eq("statut", "confirme");

      const payeSet = new Set((paiementsConfirmes || []).map((p: { membre_id: string }) => p.membre_id));

      // Exclure le bénéficiaire (il ne paie pas ce tour)
      const nonPayeurs = membresActifs.filter(
        (m: { user_id: string }) => !payeSet.has(m.user_id) && m.user_id !== tour.beneficiaire_id
      );

      for (const membre of nonPayeurs) {
        const userId = membre.user_id;

        // Récupérer le profil
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, telephone, prenom, stripe_customer_id")
          .eq("id", userId)
          .single();

        if (!profile) continue;

        const tontineNom = tontine?.nom || "Tontine";
        const montant = tontine?.montant_cotisation || 0;

        try {
          // ===== J-3 : Premier rappel =====
          if (joursRestants === 3) {
            await envoyerNotif(profile, "payment-reminder",
              `Rappel : votre cotisation de ${montant}€ pour "${tontineNom}" est due dans 3 jours.`);
            await creerNotifInApp(supabase, userId, "Rappel de cotisation",
              `Votre cotisation de ${montant}€ pour "${tontineNom}" est due dans 3 jours.`);
            resultats.rappelsEnvoyes++;
          }

          // ===== J-1 : Rappel urgent =====
          if (joursRestants === 1) {
            await envoyerNotif(profile, "echeance-reminder",
              `URGENT : votre cotisation de ${montant}€ pour "${tontineNom}" est due demain !`);
            await creerNotifInApp(supabase, userId, "Cotisation due demain",
              `Votre cotisation de ${montant}€ pour "${tontineNom}" est due demain.`);
            resultats.rappelsEnvoyes++;
          }

          // ===== J0 : Prélèvement automatique =====
          if (joursRestants === 0 || (joursRestants < 0 && joursRetard === 0)) {
            const prelevementOk = await tenterPrelevement(
              profile.stripe_customer_id,
              montant,
              userId,
              tour.tontine_id,
              tontineNom,
              tour.id,
              tour.numero
            );

            if (prelevementOk) {
              // Marquer comme payé
              await supabase.from("paiements").insert({
                tour_id: tour.id,
                tontine_id: tour.tontine_id,
                membre_id: userId,
                montant,
                methode: "stripe",
                statut: "confirme",
                reference: `AUTO-${Date.now().toString(36).toUpperCase()}`,
                date_paiement: now.toISOString(),
              });
              resultats.prelevementsEffectues++;

              await envoyerNotif(profile, "payment-confirmation",
                `Votre cotisation de ${montant}€ pour "${tontineNom}" a été prélevée automatiquement.`);
            } else {
              await envoyerNotif(profile, "payment-late",
                `Le prélèvement de ${montant}€ a échoué. Payez manuellement pour éviter les pénalités.`);
            }
          }

          // ===== J+1 : Avertissement pénalité =====
          if (joursRetard === 1) {
            await envoyerNotif(profile, "payment-late",
              `RETARD : cotisation de ${montant}€ pour "${tontineNom}" non payée. Pénalité de 8€ dans 2 jours.`);
            await creerNotifInApp(supabase, userId, "Cotisation en retard",
              `Votre cotisation pour "${tontineNom}" est en retard. Pénalité dans 2 jours.`);
            resultats.rappelsEnvoyes++;
          }

          // ===== J+3 : Pénalité + blocage =====
          if (joursRetard === 3) {
            await appliquerPenalite(userId, tour.tontine_id, tour.id, 8,
              `Retard de paiement - Tour ${tour.numero} de "${tontineNom}"`);

            // Bloquer
            await supabase
              .from("membres")
              .update({ statut: "suspendu" })
              .eq("user_id", userId)
              .eq("tontine_id", tour.tontine_id);

            await envoyerNotif(profile, "payment-late",
              `PÉNALITÉ : 8€ pour retard. Participation bloquée. Montant dû : ${montant + 8}€.`);
            await creerNotifInApp(supabase, userId, "Pénalité appliquée",
              `Pénalité de 8€ pour retard sur "${tontineNom}". Votre participation est suspendue.`);
            resultats.penalitesAppliquees++;
          }

          // ===== J+7 : Mise en demeure =====
          if (joursRetard === 7) {
            await envoyerNotif(profile, "payment-late",
              `MISE EN DEMEURE : cotisation de ${montant}€ + pénalité 8€ impayée depuis 7 jours. Exclusion dans 7 jours.`);
            await creerNotifInApp(supabase, userId, "Mise en demeure",
              `Dernière chance : payez ${montant + 8}€ ou vous serez exclu de "${tontineNom}" dans 7 jours.`);
            resultats.rappelsEnvoyes++;
          }

          // ===== J+14 : Exclusion + saisie caution =====
          if (joursRetard >= 14) {
            await saisirCaution(userId, tour.tontine_id,
              `Non-paiement Tour ${tour.numero} après 14 jours`);

            await supabase
              .from("membres")
              .update({ statut: "exclu" })
              .eq("user_id", userId)
              .eq("tontine_id", tour.tontine_id);

            // Marquer la défaillance
            await supabase.from("defaillances").insert({
              user_id: userId,
              tontine_id: tour.tontine_id,
              tontine_nom: tontineNom,
              tour_numero: tour.numero,
              montant_du: montant,
              devise: "EUR",
            });

            await supabase
              .from("profiles")
              .update({ est_defaillant: true })
              .eq("id", userId);

            await calculerScore(userId);

            await envoyerNotif(profile, "payment-late",
              `EXCLUSION : Vous êtes exclu de "${tontineNom}". Caution saisie. Score mis à jour.`);
            await creerNotifInApp(supabase, userId, "Exclusion",
              `Vous avez été exclu de "${tontineNom}" pour non-paiement.`);
            resultats.exclusions++;
          }
        } catch (err) {
          resultats.erreurs.push(
            `User ${userId} tour ${tour.id}: ${err instanceof Error ? err.message : "erreur"}`
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      resultats,
    });
  } catch (err) {
    console.error("Erreur cron relances:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

// ========================
// Prélèvement automatique
// ========================
async function tenterPrelevement(
  stripeCustomerId: string | null,
  montant: number,
  userId: string,
  tontineId: string,
  tontineNom: string,
  tourId: string,
  tourNumero: number
): Promise<boolean> {
  if (!stripeCustomerId) return false;

  try {
    const stripe = getStripe();

    // Chercher une carte enregistrée
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if ("deleted" in customer && customer.deleted) return false;

    let pmId: string | undefined;

    // Méthode par défaut
    const defaultPm = customer.invoice_settings?.default_payment_method;
    if (typeof defaultPm === "string") {
      pmId = defaultPm;
    } else if (defaultPm?.id) {
      pmId = defaultPm.id;
    }

    // Sinon première carte disponible
    if (!pmId) {
      const pms = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: "card",
        limit: 1,
      });
      if (pms.data.length === 0) return false;
      pmId = pms.data[0].id;
    }

    const montantCentimes = Math.round(montant * 1.01 * 100); // +1% frais Binq

    const pi = await stripe.paymentIntents.create({
      amount: montantCentimes,
      currency: "eur",
      customer: stripeCustomerId,
      payment_method: pmId,
      off_session: true,
      confirm: true,
      metadata: {
        type: "cotisation_auto",
        userId,
        tontineId,
        tontineNom,
        tourId,
        tourNumero: tourNumero.toString(),
      },
    });

    return pi.status === "succeeded";
  } catch (err) {
    console.error(`Prélèvement auto échoué pour ${userId}:`, err);
    return false;
  }
}

// ========================
// Notifications
// ========================
async function envoyerNotif(
  profile: { email?: string; telephone?: string; prenom?: string },
  type: string,
  message: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://binq.io";

  const promises: Promise<unknown>[] = [];

  if (profile.email) {
    promises.push(
      fetch(`${appUrl}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: profile.email,
          type,
          data: { prenom: profile.prenom || "Membre", message },
        }),
      }).catch(() => {})
    );
  }

  if (profile.telephone) {
    promises.push(
      fetch(`${appUrl}/api/sms/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: profile.telephone,
          type,
          data: { prenom: profile.prenom || "Membre", message },
        }),
      }).catch(() => {})
    );
  }

  await Promise.allSettled(promises);
}

// eslint-disable-next-line
async function creerNotifInApp(db: { from: Function }, userId: string, titre: string, message: string) {
  try {
    await db.from("notifications").insert({
      user_id: userId,
      titre,
      message,
      lu: false,
    });
  } catch {
    // ignore
  }
}
