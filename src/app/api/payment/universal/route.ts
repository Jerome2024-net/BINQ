import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import {
  type PaymentMethodId,
  calculateFees,
  getPaymentMethod,
  isMobileMoneyMethod,
  getPayDunyaChannel,
} from "@/lib/payment-gateway";
import { type DeviseCode, formatMontant, xofToEur } from "@/lib/currencies";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Helpers ──

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

/**
 * Crée une invoice PayDunya pour mobile money.
 */
async function createPayDunyaInvoice(params: {
  amount: number;
  description: string;
  channel: string;
  phoneNumber: string;
  paymentCode: string;
  linkId: string;
  createurId: string;
  devise: DeviseCode;
}): Promise<{ success: boolean; token?: string; url?: string; error?: string }> {
  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;

  if (!masterKey || !privateKey || !token) {
    return { success: false, error: "Configuration PayDunya manquante" };
  }

  const isTest = process.env.PAYDUNYA_MODE !== "live";
  const baseUrl = isTest
    ? "https://app.paydunya.com/sandbox-api/v1"
    : "https://app.paydunya.com/api/v1";

  const baseAppUrl = getBaseUrl();

  try {
    // Étape 1 : Créer la facture
    const invoiceRes = await fetch(`${baseUrl}/checkout-invoice/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PAYDUNYA-MASTER-KEY": masterKey,
        "PAYDUNYA-PRIVATE-KEY": privateKey,
        "PAYDUNYA-TOKEN": token,
      },
      body: JSON.stringify({
        invoice: {
          total_amount: params.amount,
          description: params.description,
        },
        store: {
          name: "Binq Pay",
          tagline: "Paiement universel",
          phone: "",
          postal_address: "",
          website_url: baseAppUrl,
          logo_url: `${baseAppUrl}/icon-192x192.png`,
        },
        actions: {
          callback_url: `${baseAppUrl}/api/webhooks/paydunya`,
          return_url: `${baseAppUrl}/payment/success?code=${params.paymentCode}&method=${params.channel}`,
          cancel_url: `${baseAppUrl}/payment/cancel?code=${params.paymentCode}`,
        },
        custom_data: {
          payment_code: params.paymentCode,
          link_id: params.linkId,
          createur_id: params.createurId,
          devise: params.devise,
          phone_number: params.phoneNumber,
          channel: params.channel,
        },
      }),
    });

    const invoiceData = await invoiceRes.json();

    if (invoiceData.response_code !== "00") {
      console.error("PayDunya create invoice error:", invoiceData);
      return {
        success: false,
        error: invoiceData.response_text || "Erreur PayDunya",
      };
    }

    return {
      success: true,
      token: invoiceData.token,
      url: invoiceData.response_text, // redirect URL
    };
  } catch (err) {
    console.error("PayDunya error:", err);
    return { success: false, error: "Erreur de connexion PayDunya" };
  }
}

// ── POST : Paiement universel ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      method,
      montant: montantLibre,
      phoneNumber,
    } = body as {
      code: string;
      method: PaymentMethodId;
      montant?: number;
      phoneNumber?: string;
    };

    if (!code || !method) {
      return NextResponse.json(
        { error: "Code et méthode de paiement requis" },
        { status: 400 }
      );
    }

    const paymentMethod = getPaymentMethod(method);
    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Méthode de paiement inconnue" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // 1. Récupérer le lien
    const { data: link, error: linkErr } = await supabase
      .from("payment_links")
      .select("*")
      .eq("code", code)
      .single();

    if (linkErr || !link) {
      return NextResponse.json(
        { error: "Lien de paiement introuvable" },
        { status: 404 }
      );
    }

    if (link.statut !== "actif") {
      return NextResponse.json(
        { error: "Ce lien n'est plus actif" },
        { status: 410 }
      );
    }

    const montant = link.montant ? Number(link.montant) : Number(montantLibre);
    const linkDevise: DeviseCode =
      link.devise === "EUR" || link.devise === "XOF" ? link.devise : "XOF";

    if (!montant || montant <= 0) {
      return NextResponse.json(
        { error: "Montant invalide" },
        { status: 400 }
      );
    }

    // Calculer les frais
    const { frais, totalPayeur } = calculateFees(montant, method);

    // Récupérer le profil du créateur
    const { data: creatorProfile } = await supabase
      .from("profiles")
      .select("prenom, nom")
      .eq("id", link.createur_id)
      .single();
    const creatorName = creatorProfile
      ? `${creatorProfile.prenom} ${creatorProfile.nom}`.trim()
      : "Marchand";

    const description =
      link.description || `Paiement à ${creatorName}`;

    // ═══════════════════════════════════════
    // A) BINQ WALLET — Transfer interne
    // ═══════════════════════════════════════
    if (method === "binq_wallet") {
      // Requiert authentification
      const authHeader = request.headers.get("authorization");
      if (!authHeader) {
        return NextResponse.json(
          { error: "Authentification requise pour le paiement Binq" },
          { status: 401 }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (!user) {
        return NextResponse.json(
          { error: "Non authentifié" },
          { status: 401 }
        );
      }

      if (link.createur_id === user.id) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas payer votre propre lien" },
          { status: 400 }
        );
      }

      // Wallet du payeur
      const { data: payerWallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .eq("devise", linkDevise)
        .single();

      if (!payerWallet) {
        return NextResponse.json(
          { error: "Portefeuille non trouvé" },
          { status: 404 }
        );
      }

      if (payerWallet.solde < montant) {
        return NextResponse.json(
          { error: "Solde insuffisant" },
          { status: 400 }
        );
      }

      // Wallet du créateur
      let { data: creatorWallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", link.createur_id)
        .eq("devise", linkDevise)
        .single();

      if (!creatorWallet) {
        const { data: created } = await supabase
          .from("wallets")
          .insert({
            user_id: link.createur_id,
            solde: 0,
            solde_bloque: 0,
            devise: linkDevise,
          })
          .select()
          .single();
        creatorWallet = created;
      }

      if (!creatorWallet) {
        return NextResponse.json(
          { error: "Erreur wallet destinataire" },
          { status: 500 }
        );
      }

      const reference = `PAY-${Date.now().toString(36).toUpperCase()}`;
      const now = new Date().toISOString();

      // Profil du payeur
      const { data: payerProfile } = await supabase
        .from("profiles")
        .select("prenom, nom")
        .eq("id", user.id)
        .single();
      const payerName = payerProfile
        ? `${payerProfile.prenom} ${payerProfile.nom}`.trim()
        : "Utilisateur";

      // Débiter le payeur
      const newPayerSolde = payerWallet.solde - montant;
      const { error: debitErr } = await supabase
        .from("wallets")
        .update({ solde: newPayerSolde })
        .eq("id", payerWallet.id);

      if (debitErr) {
        return NextResponse.json(
          { error: "Erreur lors du débit" },
          { status: 500 }
        );
      }

      // Créditer le créateur
      const newCreatorSolde = creatorWallet.solde + montant;
      const { error: creditErr } = await supabase
        .from("wallets")
        .update({ solde: newCreatorSolde })
        .eq("id", creatorWallet.id);

      if (creditErr) {
        await supabase
          .from("wallets")
          .update({ solde: payerWallet.solde })
          .eq("id", payerWallet.id);
        return NextResponse.json(
          { error: "Erreur lors du crédit" },
          { status: 500 }
        );
      }

      // Transfert + transactions
      const linkDesc = link.description ? ` — ${link.description}` : "";

      await Promise.all([
        supabase.from("transferts").insert({
          expediteur_id: user.id,
          destinataire_id: link.createur_id,
          montant,
          devise: linkDevise,
          message: link.description || "Paiement QR universel",
          statut: "confirme",
          payment_link_id: link.id,
          reference,
        }),
        supabase.from("transactions").insert({
          user_id: user.id,
          wallet_id: payerWallet.id,
          type: "transfert_sortant",
          montant,
          solde_avant: payerWallet.solde,
          solde_apres: newPayerSolde,
          devise: linkDevise,
          statut: "confirme",
          reference,
          description: `Paiement à ${creatorName}${linkDesc}`,
          meta_methode: "universal_qr",
          confirmed_at: now,
        }),
        supabase.from("transactions").insert({
          user_id: link.createur_id,
          wallet_id: creatorWallet.id,
          type: "transfert_entrant",
          montant,
          solde_avant: creatorWallet.solde,
          solde_apres: newCreatorSolde,
          devise: linkDevise,
          statut: "confirme",
          reference,
          description: `Paiement reçu de ${payerName}${linkDesc}`,
          meta_methode: "universal_qr",
          confirmed_at: now,
        }),
      ]);

      // Marquer comme payé
      if (link.usage_unique) {
        await supabase
          .from("payment_links")
          .update({ statut: "paye", paye_par: user.id, paye_at: now })
          .eq("id", link.id);
      }

      // Notifications
      await Promise.allSettled([
        supabase.from("notifications").insert({
          user_id: link.createur_id,
          titre: "Paiement reçu",
          message: `${payerName} vous a payé ${formatMontant(montant, linkDevise)}${linkDesc}`,
          lu: false,
        }),
        supabase.from("notifications").insert({
          user_id: user.id,
          titre: "Paiement effectué",
          message: `Vous avez payé ${formatMontant(montant, linkDevise)} à ${creatorName}${linkDesc}`,
          lu: false,
        }),
      ]);

      return NextResponse.json({
        success: true,
        method: "binq_wallet",
        reference,
        montant,
        frais: 0,
        devise: linkDevise,
      });
    }

    // ═══════════════════════════════════════
    // B) CARTE BANCAIRE — Stripe Checkout
    // ═══════════════════════════════════════
    if (method === "card_stripe") {
      const stripe = getStripe();
      const baseUrl = getBaseUrl();

      // Convertir en EUR pour Stripe (Stripe ne supporte pas XOF)
      const amountEur =
        linkDevise === "XOF" ? xofToEur(totalPayeur) : totalPayeur;
      const amountCents = Math.round(amountEur * 100);

      if (amountCents < 50) {
        return NextResponse.json(
          { error: "Montant trop faible pour le paiement par carte (minimum 0.50€)" },
          { status: 400 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `Paiement à ${creatorName}`,
                description: description,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: "universal_payment",
          payment_code: code,
          link_id: link.id,
          createur_id: link.createur_id,
          montant_original: montant.toString(),
          frais: frais.toString(),
          devise: linkDevise,
          method: "card_stripe",
        },
        success_url: `${baseUrl}/payment/success?code=${code}&method=card&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/payment/cancel?code=${code}`,
      });

      return NextResponse.json({
        success: true,
        method: "card_stripe",
        redirectUrl: session.url,
        sessionId: session.id,
      });
    }

    // ═══════════════════════════════════════
    // C) MOBILE MONEY — PayDunya
    // ═══════════════════════════════════════
    if (isMobileMoneyMethod(method)) {
      if (!phoneNumber) {
        return NextResponse.json(
          { error: "Numéro de téléphone requis pour le paiement mobile" },
          { status: 400 }
        );
      }

      const channel = getPayDunyaChannel(method);
      if (!channel) {
        return NextResponse.json(
          { error: "Canal mobile money non supporté" },
          { status: 400 }
        );
      }

      // PayDunya travaille en XOF
      const amountXof =
        linkDevise === "EUR"
          ? Math.round(totalPayeur * 655.957)
          : totalPayeur;

      const result = await createPayDunyaInvoice({
        amount: amountXof,
        description,
        channel,
        phoneNumber,
        paymentCode: code,
        linkId: link.id,
        createurId: link.createur_id,
        devise: linkDevise,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Erreur PayDunya" },
          { status: 500 }
        );
      }

      // Stocker le paiement en attente
      await supabase.from("transactions").insert({
        user_id: link.createur_id,
        type: "depot",
        montant,
        devise: linkDevise,
        statut: "en_attente",
        reference: `PDY-${result.token?.slice(-8)?.toUpperCase() || Date.now().toString(36).toUpperCase()}`,
        description: `Paiement mobile (${paymentMethod.label}) en attente — ${description}`,
        meta_methode: method,
      });

      return NextResponse.json({
        success: true,
        method,
        token: result.token,
        redirectUrl: result.url,
      });
    }

    return NextResponse.json(
      { error: "Méthode de paiement non supportée" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur paiement universel:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
