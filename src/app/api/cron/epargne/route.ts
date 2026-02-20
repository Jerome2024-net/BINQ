import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

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
  const stripe = getStripe();
  const now = new Date();
  const resultats = {
    depotsAuto: 0,
    erreurs: [] as string[],
  };

  try {
    // ═══════════════════════════════════════════
    // 1. DÉPÔTS AUTOMATIQUES (épargne programmée)
    // ═══════════════════════════════════════════
    const { data: epargnesToProcess } = await supabase
      .from("epargnes")
      .select("*")
      .eq("statut", "active")
      .eq("type", "programmee")
      .not("montant_auto", "is", null)
      .not("prochaine_date_auto", "is", null)
      .lte("prochaine_date_auto", now.toISOString());

    if (epargnesToProcess?.length) {
      for (const ep of epargnesToProcess) {
        try {
          const montant = Number(ep.montant_auto);
          let depotEffectue = false;
          let stripePaymentId: string | null = null;

          // Source = wallet d'abord
          if (ep.source_auto === "wallet" || !ep.source_auto) {
            const { data: profil } = await supabase
              .from("profiles")
              .select("solde_wallet")
              .eq("id", ep.user_id)
              .single();

            const soldeWallet = Number(profil?.solde_wallet) || 0;

            if (soldeWallet >= montant) {
              // Débiter le wallet
              await supabase
                .from("profiles")
                .update({ solde_wallet: soldeWallet - montant })
                .eq("id", ep.user_id);

              depotEffectue = true;
            }
          }

          // Fallback carte si wallet insuffisant ou source = carte
          if (!depotEffectue) {
            const { data: profil } = await supabase
              .from("profiles")
              .select("stripe_customer_id")
              .eq("id", ep.user_id)
              .single();

            if (profil?.stripe_customer_id) {
              const paymentMethods = await stripe.paymentMethods.list({
                customer: profil.stripe_customer_id,
                type: "card",
                limit: 1,
              });

              if (paymentMethods.data.length > 0) {
                try {
                  const cronDevise = (ep.devise || "eur").toLowerCase();
                  const pi = await stripe.paymentIntents.create({
                    amount: Math.round(montant * 100),
                    currency: cronDevise,
                    customer: profil.stripe_customer_id,
                    payment_method: paymentMethods.data[0].id,
                    off_session: true,
                    confirm: true,
                    description: `Épargne auto Binq - ${ep.nom}`,
                    metadata: {
                      type: "epargne_auto",
                      epargne_id: ep.id,
                      user_id: ep.user_id,
                    },
                  });

                  if (pi.status === "succeeded") {
                    depotEffectue = true;
                    stripePaymentId = pi.id;
                  }
                } catch (stripeErr) {
                  console.error(`Stripe auto-debit failed for ${ep.id}:`, stripeErr);
                }
              }
            }
          }

          if (depotEffectue) {
            const nouveauSolde = Number(ep.solde) + montant;

            // Mettre à jour le solde
            const prochaineDate = calculerProchaineDate(ep.frequence_auto, now);
            await supabase
              .from("epargnes")
              .update({
                solde: nouveauSolde,
                prochaine_date_auto: prochaineDate.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq("id", ep.id);

            // Enregistrer la transaction
            await supabase.from("epargne_transactions").insert({
              epargne_id: ep.id,
              user_id: ep.user_id,
              type: "depot_auto",
              montant,
              solde_apres: nouveauSolde,
              description: `Dépôt automatique ${ep.frequence_auto}`,
              stripe_payment_id: stripePaymentId,
            });

            resultats.depotsAuto++;
          } else {
            // Reporter au lendemain si échec
            const demain = new Date(now);
            demain.setDate(demain.getDate() + 1);
            await supabase
              .from("epargnes")
              .update({ prochaine_date_auto: demain.toISOString() })
              .eq("id", ep.id);

            resultats.erreurs.push(`Dépôt auto échoué pour ${ep.id}`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erreur inconnue";
          resultats.erreurs.push(`Épargne ${ep.id}: ${msg}`);
        }
      }
    }


  } catch (err) {
    console.error("Erreur cron épargne:", err);
    return NextResponse.json(
      { error: "Erreur serveur", details: err instanceof Error ? err.message : "Inconnue" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, resultats });
}

function calculerProchaineDate(frequence: string, depuis: Date): Date {
  const next = new Date(depuis);
  switch (frequence) {
    case "quotidien":
      next.setDate(next.getDate() + 1);
      break;
    case "hebdomadaire":
      next.setDate(next.getDate() + 7);
      break;
    case "mensuel":
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}
