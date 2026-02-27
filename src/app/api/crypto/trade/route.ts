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

const FRAIS_TAUX = 0.015; // 1.5% fees

function generateRef() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "BTC-";
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

// ── GET : get crypto wallet + recent transactions ──
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const supabase = getServiceClient();

  // Get crypto wallet
  const { data: cryptoWallet } = await supabase
    .from("crypto_wallets")
    .select("*")
    .eq("user_id", user.id)
    .eq("devise", "BTC")
    .single();

  // Get recent transactions
  const { data: transactions } = await supabase
    .from("crypto_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    wallet: cryptoWallet || { solde: 0, devise: "BTC" },
    transactions: transactions || [],
  });
}

// ── POST : buy or sell BTC ──
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const supabase = getServiceClient();
    const body = await req.json();
    const { type, montant_eur, prix_btc, methode = "wallet" } = body;

    if (!type || !["achat", "vente"].includes(type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }
    if (!montant_eur || montant_eur <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }
    if (montant_eur < 1) {
      return NextResponse.json({ error: "Montant minimum : 1 €" }, { status: 400 });
    }
    if (!prix_btc || prix_btc <= 0) {
      return NextResponse.json({ error: "Prix BTC invalide" }, { status: 400 });
    }

    const frais = Math.round(montant_eur * FRAIS_TAUX * 100) / 100;
    const montantNet = montant_eur - frais;
    const montantCrypto = montantNet / prix_btc;
    const reference = generateRef();

    // ═══════════════════════════════════════════
    // ACHAT PAR CARTE — créer PaymentIntent Stripe
    // ═══════════════════════════════════════════
    if (type === "achat" && methode === "carte") {
      const stripe = getStripe();
      const amountCents = Math.round(montant_eur * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "eur",
        description: `Achat Bitcoin – ${montantCrypto.toFixed(8)} BTC`,
        automatic_payment_methods: { enabled: true },
        metadata: {
          type: "crypto_achat",
          userId: user.id,
          montant_eur: String(montant_eur),
          prix_btc: String(prix_btc),
          frais: String(frais),
          montant_crypto: String(montantCrypto),
          reference,
          app: "binq",
        },
      });

      return NextResponse.json({
        success: true,
        methode: "carte",
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        reference,
        preview: {
          montant_crypto: montantCrypto,
          montant_eur,
          frais,
          prix_unitaire: prix_btc,
        },
      });
    }

    // ═══════════════════════════════════════════
    // ACHAT / VENTE VIA WALLET (existant)
    // ═══════════════════════════════════════════

    // Get EUR wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("devise", "EUR")
      .single();

    if (!wallet) {
      return NextResponse.json({ error: "Portefeuille introuvable" }, { status: 404 });
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

    if (type === "achat") {
      // Check EUR balance
      if (Number(wallet.solde) < montant_eur) {
        return NextResponse.json({ error: "Solde EUR insuffisant" }, { status: 400 });
      }

      // Debit EUR wallet
      const newSoldeEur = Number(wallet.solde) - montant_eur;
      const { error: debitErr } = await supabase
        .from("wallets")
        .update({ solde: newSoldeEur, updated_at: new Date().toISOString() })
        .eq("id", wallet.id);
      if (debitErr) return NextResponse.json({ error: "Erreur débit EUR" }, { status: 500 });

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

      // Record in main transactions table
      await supabase.from("transactions").insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: "achat_crypto",
        montant: montant_eur,
        devise: "EUR",
        description: `Achat ${montantCrypto.toFixed(8)} BTC`,
        statut: "confirme",
        reference,
        solde_avant: Number(wallet.solde),
        solde_apres: newSoldeEur,
        frais: frais,
      });

      // Notification
      try {
        await supabase.from("notifications").insert({
          user_id: user.id,
          titre: "Achat Bitcoin confirmé",
          message: `Vous avez acheté ${montantCrypto.toFixed(8)} BTC pour ${montant_eur.toFixed(2)} €`,
        });
      } catch { /* ignore */ }

      // Record fee for admin
      try {
        await recordFee({
          userId: user.id,
          source: "crypto_achat",
          montant: frais,
          transactionRef: reference,
        });
      } catch { /* ignore fee errors */ }

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
        nouveau_solde_eur: newSoldeEur,
        nouveau_solde_btc: newSoldeBtc,
      });

    } else {
      // ── VENTE ──
      const montantCryptoVente = montant_eur / prix_btc;

      if (Number(cryptoWallet!.solde) < montantCryptoVente) {
        return NextResponse.json({ error: "Solde BTC insuffisant" }, { status: 400 });
      }

      // Debit crypto
      const newSoldeBtc = Number(cryptoWallet!.solde) - montantCryptoVente;
      const { error: debitErr } = await supabase
        .from("crypto_wallets")
        .update({ solde: newSoldeBtc, updated_at: new Date().toISOString() })
        .eq("id", cryptoWallet!.id);
      if (debitErr) return NextResponse.json({ error: "Erreur débit BTC" }, { status: 500 });

      // Credit EUR (minus fees)
      const newSoldeEur = Number(wallet.solde) + montantNet;
      const { error: creditErr } = await supabase
        .from("wallets")
        .update({ solde: newSoldeEur, updated_at: new Date().toISOString() })
        .eq("id", wallet.id);
      if (creditErr) return NextResponse.json({ error: "Erreur crédit EUR" }, { status: 500 });

      // Record crypto transaction
      await supabase.from("crypto_transactions").insert({
        user_id: user.id,
        type: "vente",
        crypto_devise: "BTC",
        montant_crypto: montantCryptoVente,
        montant_eur: montantNet,
        prix_unitaire: prix_btc,
        frais_eur: frais,
        reference,
      });

      // Record in main transactions
      await supabase.from("transactions").insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: "vente_crypto",
        montant: montantNet,
        devise: "EUR",
        description: `Vente ${montantCryptoVente.toFixed(8)} BTC`,
        statut: "confirme",
        reference,
        solde_avant: Number(wallet.solde),
        solde_apres: newSoldeEur,
        frais: frais,
      });

      // Notification
      try {
        await supabase.from("notifications").insert({
          user_id: user.id,
          titre: "Vente Bitcoin confirmée",
          message: `Vous avez vendu ${montantCryptoVente.toFixed(8)} BTC pour ${montantNet.toFixed(2)} €`,
        });
      } catch { /* ignore */ }

      // Record fee for admin
      try {
        await recordFee({
          userId: user.id,
          source: "crypto_vente",
          montant: frais,
          transactionRef: reference,
        });
      } catch { /* ignore fee errors */ }

      return NextResponse.json({
        success: true,
        transaction: {
          type: "vente",
          montant_crypto: montantCryptoVente,
          montant_eur: montantNet,
          frais,
          prix_unitaire: prix_btc,
          reference,
        },
        nouveau_solde_eur: newSoldeEur,
        nouveau_solde_btc: newSoldeBtc,
      });
    }
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
