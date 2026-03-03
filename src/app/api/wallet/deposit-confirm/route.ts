import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { recordFee } from "@/lib/admin-fees";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * POST /api/wallet/deposit-confirm
 * Appelé après paiement carte réussi pour créditer le wallet EUR.
 * Fonctionne en complément du webhook Stripe (double sécurité).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json({ error: "paymentIntentId manquant" }, { status: 400 });
    }

    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.status !== "succeeded") {
      return NextResponse.json({ error: "Paiement non confirmé" }, { status: 400 });
    }

    const meta = pi.metadata;
    if (meta.type !== "depot" || meta.userId !== user.id) {
      return NextResponse.json({ error: "PaymentIntent invalide" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Vérifier si déjà traité
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("stripe_payment_intent_id", pi.id)
      .eq("statut", "confirme")
      .single();

    if (existing) {
      // Déjà traité par le webhook — retourner le solde actuel
      const { data: wallet } = await supabase
        .from("wallets")
        .select("solde")
        .eq("user_id", user.id)
        .single();

      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        nouveau_solde: wallet?.solde || 0,
      });
    }

    // Calculer les montants
    const montantDemandeCents = meta.montant_demande ? parseInt(meta.montant_demande) : null;
    const fraisBinqCents = meta.frais_binq ? parseInt(meta.frais_binq) : null;
    const montantCredite = montantDemandeCents ? montantDemandeCents / 100 : pi.amount / 100;
    const fraisBinq = fraisBinqCents ? fraisBinqCents / 100 : 0;
    const totalPaye = pi.amount / 100;

    const reference = `DEP-${pi.id.slice(-8).toUpperCase()}`;

    // Créditer le wallet
    const { error: rpcError } = await supabase.rpc("update_wallet_balance", {
      p_user_id: user.id,
      p_delta: montantCredite,
    });

    if (rpcError) {
      console.error("Erreur RPC update_wallet_balance:", rpcError);
      return NextResponse.json({ error: "Erreur crédit wallet" }, { status: 500 });
    }

    // Enregistrer la transaction
    await supabase.from("transactions").upsert(
      {
        user_id: user.id,
        type: "depot",
        montant: montantCredite,
        devise: "EUR",
        statut: "confirme",
        reference,
        description: `Dépôt par carte bancaire`,
        meta_methode: "stripe",
        meta_frais: fraisBinq,
        confirmed_at: new Date().toISOString(),
        stripe_payment_intent_id: pi.id,
      },
      { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true }
    );

    // Enregistrer les frais
    if (fraisBinq > 0) {
      try {
        await recordFee({
          userId: user.id,
          source: "depot_carte",
          montant: fraisBinq,
          transactionRef: reference,
        });
      } catch { /* ignore */ }
    }

    // Notification
    try {
      await supabase.from("notifications").insert({
        user_id: user.id,
        titre: "Dépôt confirmé",
        message: `${montantCredite.toFixed(2)} € ont été ajoutés à votre portefeuille.`,
      });
    } catch { /* ignore */ }

    // Récupérer le nouveau solde
    const { data: wallet } = await supabase
      .from("wallets")
      .select("solde")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      montant_credite: montantCredite,
      frais: fraisBinq,
      total_paye: totalPaye,
      reference,
      nouveau_solde: wallet?.solde || montantCredite,
    });
  } catch (err) {
    console.error("[wallet/deposit-confirm] Erreur:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
