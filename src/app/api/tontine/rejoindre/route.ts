import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/tontine/rejoindre
 *
 * Rejoindre une tontine avec paiement de la caution par carte
 * La caution = 1x montant_cotisation = fonds de garantie
 *
 * Si le membre ne paie pas son tour :
 *   -> La caution est saisie pour couvrir le pot
 *   -> Le membre est exclu
 *   -> La tontine continue normalement
 *
 * Body: { tontineId: string, invitationId?: string }
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { tontineId, invitationId } = body;

    if (!tontineId) {
      return NextResponse.json({ error: "ID tontine requis" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // 1. Recuperer la tontine
    const { data: tontine } = await supabase
      .from("tontines")
      .select("id, nom, montant_cotisation, devise, nombre_membres, membres_max, statut")
      .eq("id", tontineId)
      .single();

    if (!tontine) {
      return NextResponse.json({ error: "Tontine introuvable" }, { status: 404 });
    }

    if (tontine.nombre_membres >= tontine.membres_max) {
      return NextResponse.json({ error: "Groupe complet" }, { status: 400 });
    }

    // 2. Verifier pas deja membre
    const { data: existant } = await supabase
      .from("membres")
      .select("id")
      .eq("tontine_id", tontineId)
      .eq("user_id", user.id)
      .single();

    if (existant) {
      return NextResponse.json({ error: "Vous etes deja membre de cette tontine" }, { status: 400 });
    }

    // 3. Verifier eligibilite (score)
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, score_fiabilite, niveau_fiabilite, email")
      .eq("id", user.id)
      .single();

    if (profile?.niveau_fiabilite === "bloque") {
      return NextResponse.json({
        error: `Score de fiabilite trop bas (${profile.score_fiabilite}/100). Regularisez vos penalites.`,
        code: "SCORE_TOO_LOW",
      }, { status: 400 });
    }

    // 4. Verifier pas de penalites impayees
    const { data: penalites } = await supabase
      .from("penalites")
      .select("montant")
      .eq("user_id", user.id)
      .eq("statut", "appliquee");

    if (penalites && penalites.length > 0) {
      const total = penalites.reduce((s, p) => s + Number(p.montant), 0);
      return NextResponse.json({
        error: `Vous avez ${total.toFixed(2)}€ de penalites impayees. Regularisez-les avant de rejoindre.`,
        code: "PENALITES_IMPAYEES",
      }, { status: 400 });
    }

    // 5. Payer la caution par carte (= 1x cotisation)
    const montantCaution = Number(tontine.montant_cotisation);
    const stripe = getStripe();

    // Trouver ou creer le Stripe Customer
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const email = profile?.email || user.email;
      const existing = await stripe.customers.list({ email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email,
          metadata: { userId: user.id, platform: "binq" },
        });
        customerId = customer.id;
      }
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    // Trouver la carte enregistree
    let pmId: string | undefined;
    const customer = await stripe.customers.retrieve(customerId);
    if (!("deleted" in customer && customer.deleted)) {
      const defaultPm = customer.invoice_settings?.default_payment_method;
      if (typeof defaultPm === "string") pmId = defaultPm;
      else if (defaultPm?.id) pmId = defaultPm.id;
    }
    if (!pmId) {
      const pms = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 });
      if (pms.data.length > 0) pmId = pms.data[0].id;
    }

    if (!pmId) {
      return NextResponse.json({
        error: "Aucune carte bancaire enregistree. Ajoutez une carte avant de rejoindre.",
        code: "NO_CARD",
      }, { status: 400 });
    }

    // Prelever la caution
    let paymentIntentId: string | null = null;
    try {
      const pi = await stripe.paymentIntents.create({
        amount: Math.round(montantCaution * 100),
        currency: tontine.devise?.toLowerCase() || "eur",
        customer: customerId,
        payment_method: pmId,
        off_session: true,
        confirm: true,
        metadata: {
          type: "caution_garantie",
          userId: user.id,
          tontineId,
          tontineNom: tontine.nom,
        },
      });

      if (pi.status !== "succeeded") {
        return NextResponse.json({
          error: "Le paiement de la caution a echoue. Verifiez votre carte.",
          code: "PAYMENT_FAILED",
        }, { status: 400 });
      }

      paymentIntentId = pi.id;
    } catch (err) {
      console.error("Erreur paiement caution:", err);
      return NextResponse.json({
        error: "Impossible de prelever la caution. Verifiez votre carte bancaire.",
        code: "PAYMENT_ERROR",
      }, { status: 400 });
    }

    // 6. Enregistrer la caution
    await supabase.from("cautions").insert({
      user_id: user.id,
      tontine_id: tontineId,
      montant: montantCaution,
      statut: "bloquee",
    });

    // 7. Transaction
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, solde")
      .eq("user_id", user.id)
      .single();

    if (wallet) {
      await supabase.from("transactions").insert({
        wallet_id: wallet.id,
        user_id: user.id,
        type: "caution",
        montant: montantCaution,
        solde_avant: wallet.solde,
        solde_apres: wallet.solde,
        devise: tontine.devise || "EUR",
        statut: "confirme",
        description: `Caution (fonds de garantie) - "${tontine.nom}"`,
        meta_tontine_id: tontineId,
        reference: paymentIntentId || `CAUTION-${Date.now().toString(36).toUpperCase()}`,
        confirmed_at: new Date().toISOString(),
      });
    }

    // 8. Ajouter comme membre
    const { error: membreError } = await supabase.from("membres").insert({
      tontine_id: tontineId,
      user_id: user.id,
      role: "membre",
      date_adhesion: new Date().toISOString().split("T")[0],
    });

    if (membreError) {
      // Rembourser la caution
      try {
        if (paymentIntentId) await stripe.refunds.create({ payment_intent: paymentIntentId });
      } catch { /* ignore */ }
      return NextResponse.json({ error: membreError.message }, { status: 500 });
    }

    // 9. Incrementer membres
    await supabase
      .from("tontines")
      .update({ nombre_membres: tontine.nombre_membres + 1 })
      .eq("id", tontineId);

    // 10. Accepter l'invitation si fournie
    if (invitationId) {
      await supabase
        .from("invitations")
        .update({ statut: "acceptee" })
        .eq("id", invitationId);
    }

    // 11. Notification
    try {
      await supabase.from("notifications").insert({
        user_id: user.id,
        titre: "Bienvenue dans la tontine !",
        message: `Vous avez rejoint "${tontine.nom}". Caution de ${montantCaution}€ prelevee (restituee en fin de tontine si aucun incident).`,
        lu: false,
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      message: `Bienvenue dans "${tontine.nom}" ! Caution de ${montantCaution}€ prelevee. Elle sera restituee a la fin de la tontine.`,
      caution: montantCaution,
    });
  } catch (err) {
    console.error("Erreur rejoindre tontine:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'adhesion" },
      { status: 500 }
    );
  }
}
