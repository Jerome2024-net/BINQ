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
    const { type, montant_eur, prix_btc } = body;

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

    const isAchat = type === "achat";
    
    // Calcul des frais
    // Achat : frais ADDITIONNELS (montant_eur est le net investi)
    // Vente : frais DÉDUITS (montant_eur est le brut vendu)
    
    let montantNet: number;
    let frais: number;
    let montantTotal: number; // Ce qui est payé (achat) ou débité (vente valeur)

    if (isAchat) {
        // Le montant_eur est ce que l'utilisateur veut investit en BTC
        montantNet = montant_eur;
        frais = Math.round(montant_eur * FRAIS_TAUX * 100) / 100;
        montantTotal = montant_eur + frais; // Total à payer par carte
    } else {
        // Vente : montant_eur est la valeur BTC qu'il vend
        // On déduit les frais du payout en EUR
        frais = Math.round(montant_eur * FRAIS_TAUX * 100) / 100;
        montantNet = montant_eur - frais; // Ce qu'il reçoit sur son wallet EUR
        montantTotal = montant_eur;
    }

    const montantCrypto = isAchat 
      ? montantNet / prix_btc  // Achat : on convertit le montant net (investi)
      : montantTotal / prix_btc; // Vente : on vend la valeur brute en BTC

    const reference = generateRef();

    // ═══════════════════════════════════════════
    // ACHAT — toujours par carte bancaire (Stripe)
    // ═══════════════════════════════════════════
    if (isAchat) {
      const stripe = getStripe();
      const amountCents = Math.round(montantTotal * 100); // On charge montant + frais

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "eur",
        description: `Achat Bitcoin – ${montantCrypto.toFixed(8)} BTC (net ${montantNet} € + frais ${frais} €)`,
        automatic_payment_methods: { enabled: true },
        metadata: {
          type: "crypto_achat",
          userId: user.id,
          montant_eur: String(montantTotal), // Total payé pour compatibilité
          montant_investi: String(montantNet), // Nouveau champ pour clarté
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
          montant_eur: montantNet, // Montant investi
          montant_total: montantTotal, // Montant payé
          frais,
          prix_unitaire: prix_btc,
        },
      });
    }

    // ═══════════════════════════════════════════
    // VENTE — crédit sur portefeuille EUR
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

    // ── VENTE ── (le seul type qui arrive ici, l'achat retourne plus haut)
    {
      const montantCryptoVente = montantCrypto; // Utiilser la valeur calculée plus haut

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
