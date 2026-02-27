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
 * POST /api/crypto/confirm
 * Appelé après paiement carte réussi pour créditer le BTC.
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

    // Vérifier le PaymentIntent côté Stripe
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.status !== "succeeded") {
      return NextResponse.json({ error: "Paiement non confirmé" }, { status: 400 });
    }

    // Extraire les metadata
    const meta = pi.metadata;
    if (meta.type !== "crypto_achat" || meta.userId !== user.id) {
      return NextResponse.json({ error: "PaymentIntent invalide" }, { status: 400 });
    }

    const montant_eur = Number(meta.montant_eur);
    const prix_btc = Number(meta.prix_btc);
    const frais = Number(meta.frais);
    const montantNet = montant_eur - frais;
    const montantCrypto = montantNet / prix_btc;
    const reference = meta.reference;

    const supabase = getServiceClient();

    // Vérifier que la transaction n'a pas déjà été créditée (idempotency)
    const { data: existing } = await supabase
      .from("crypto_transactions")
      .select("id")
      .eq("reference", reference)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Transaction déjà traitée", reference }, { status: 409 });
    }

    // Get or create crypto wallet
    let { data: cryptoWallet } = await supabase
      .from("crypto_wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("devise", "BTC")
      .single();

    if (!cryptoWallet) {
      const { data: newCW, error: cwErr } = await supabase
        .from("crypto_wallets")
        .insert({ user_id: user.id, devise: "BTC", solde: 0 })
        .select()
        .single();
      if (cwErr) return NextResponse.json({ error: "Erreur création wallet crypto" }, { status: 500 });
      cryptoWallet = newCW;
    }

    // Credit crypto wallet
    const newSoldeBtc = Number(cryptoWallet!.solde) + montantCrypto;
    const { error: creditErr } = await supabase
      .from("crypto_wallets")
      .update({ solde: newSoldeBtc, updated_at: new Date().toISOString() })
      .eq("id", cryptoWallet!.id);
    if (creditErr) return NextResponse.json({ error: "Erreur crédit BTC" }, { status: 500 });

    // Record crypto transaction
    await supabase.from("crypto_transactions").insert({
      user_id: user.id,
      type: "achat",
      crypto_devise: "BTC",
      montant_crypto: montantCrypto,
      montant_eur,
      prix_unitaire: prix_btc,
      frais_eur: frais,
      reference,
    });

    // Record fee for admin
    try {
      await recordFee({
        userId: user.id,
        source: "crypto_achat_carte",
        montant: frais,
        transactionRef: reference,
      });
    } catch { /* ignore fee recording errors */ }

    // Notification
    try {
      await supabase.from("notifications").insert({
        user_id: user.id,
        titre: "Achat Bitcoin par carte confirmé",
        message: `Vous avez acheté ${montantCrypto.toFixed(8)} BTC pour ${montant_eur.toFixed(2)} € (carte)`,
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      transaction: {
        type: "achat",
        montant_crypto: montantCrypto,
        montant_eur,
        frais,
        prix_unitaire: prix_btc,
        reference,
      },
      nouveau_solde_btc: newSoldeBtc,
    });
  } catch (err) {
    console.error("[crypto/confirm] Erreur:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
