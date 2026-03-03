import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { recordFee } from "@/lib/admin-fees";
import { type DeviseCode, DEVISES, DEFAULT_DEVISE, formatMontant, eurToXof } from "@/lib/currencies";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * POST /api/wallet/deposit-confirm
 * Appelé après paiement carte réussi pour créditer le wallet (EUR ou XOF).
 * Stripe facture en EUR. Si la devise cible est XOF, on convertit.
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

    // Déterminer la devise cible
    const devise: DeviseCode = (meta.devise && DEVISES[meta.devise as DeviseCode]) ? (meta.devise as DeviseCode) : DEFAULT_DEVISE;

    const supabase = getServiceClient();

    // Vérifier si déjà traité
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("stripe_payment_intent_id", pi.id)
      .eq("statut", "confirme")
      .single();

    if (existing) {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("solde, devise")
        .eq("user_id", user.id)
        .eq("devise", devise)
        .single();

      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        nouveau_solde: wallet?.solde || 0,
        devise,
      });
    }

    // Calculer les montants
    const montantEurCents = meta.montant_eur_cents ? parseInt(meta.montant_eur_cents) : (meta.montant_demande ? parseInt(meta.montant_demande) : null);
    const fraisBinqCents = meta.frais_binq ? parseInt(meta.frais_binq) : null;
    const montantEur = montantEurCents ? montantEurCents / 100 : pi.amount / 100;
    const fraisBinq = fraisBinqCents ? fraisBinqCents / 100 : 0;
    const totalPaye = pi.amount / 100;

    // Montant à créditer dans la devise du wallet
    const montantCredite = devise === "XOF" ? eurToXof(montantEur) : montantEur;

    const reference = `DEP-${pi.id.slice(-8).toUpperCase()}`;

    // Récupérer ou créer le wallet pour cette devise
    let { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("devise", devise)
      .single();

    if (!wallet) {
      const { data: newWallet, error: createErr } = await supabase
        .from("wallets")
        .insert({ user_id: user.id, solde: 0, solde_bloque: 0, devise })
        .select()
        .single();
      if (createErr || !newWallet) {
        return NextResponse.json({ error: "Erreur création wallet" }, { status: 500 });
      }
      wallet = newWallet;
    }

    // Créditer le wallet directement (au lieu de RPC qui ne gère pas multi-wallet)
    const nouveauSolde = (wallet.solde || 0) + montantCredite;
    const { error: updateErr } = await supabase
      .from("wallets")
      .update({ solde: nouveauSolde })
      .eq("id", wallet.id);

    if (updateErr) {
      console.error("Erreur update wallet:", updateErr);
      return NextResponse.json({ error: "Erreur crédit wallet" }, { status: 500 });
    }

    // Enregistrer la transaction
    await supabase.from("transactions").upsert(
      {
        user_id: user.id,
        wallet_id: wallet.id,
        type: "depot",
        montant: montantCredite,
        devise,
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
        message: `${formatMontant(montantCredite, devise)} ont été ajoutés à votre portefeuille.`,
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      devise,
      montant_credite: montantCredite,
      frais: fraisBinq,
      total_paye: totalPaye,
      reference,
      nouveau_solde: nouveauSolde,
    });
  } catch (err) {
    console.error("[wallet/deposit-confirm] Erreur:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
