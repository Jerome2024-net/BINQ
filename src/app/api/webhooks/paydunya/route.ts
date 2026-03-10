import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { type DeviseCode, formatMontant } from "@/lib/currencies";

/**
 * Webhook PayDunya — IPN (Instant Payment Notification)
 *
 * Reçoit les confirmations de paiement mobile money
 * (Orange Money, MTN MoMo, Moov Money).
 *
 * PayDunya envoie un POST avec le token de l'invoice.
 * On vérifie le statut via l'API PayDunya puis on crédite le marchand.
 */

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data?.invoice?.token) {
      console.error("PayDunya webhook: token manquant", body);
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    const invoiceToken = data.invoice.token;
    const status = data.status;

    console.log(`📱 PayDunya webhook: token=${invoiceToken}, status=${status}`);

    // Vérifier le paiement auprès de PayDunya
    const masterKey = process.env.PAYDUNYA_MASTER_KEY;
    const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
    const pdToken = process.env.PAYDUNYA_TOKEN;

    if (!masterKey || !privateKey || !pdToken) {
      console.error("PayDunya: configuration manquante");
      return NextResponse.json(
        { error: "Configuration PayDunya manquante" },
        { status: 500 }
      );
    }

    const isTest = process.env.PAYDUNYA_MODE !== "live";
    const baseUrl = isTest
      ? "https://app.paydunya.com/sandbox-api/v1"
      : "https://app.paydunya.com/api/v1";

    // Récupérer les détails de l'invoice
    const verifyRes = await fetch(
      `${baseUrl}/checkout-invoice/confirm/${invoiceToken}`,
      {
        headers: {
          "PAYDUNYA-MASTER-KEY": masterKey,
          "PAYDUNYA-PRIVATE-KEY": privateKey,
          "PAYDUNYA-TOKEN": pdToken,
        },
      }
    );

    const verifyData = await verifyRes.json();

    if (verifyData.status !== "completed") {
      console.log(
        `PayDunya: paiement non complété (${verifyData.status})`,
        verifyData
      );
      return NextResponse.json({ received: true, status: verifyData.status });
    }

    // Paiement confirmé — extraire les données custom
    const customData = verifyData.custom_data || {};
    const paymentCode = customData.payment_code;
    const linkId = customData.link_id;
    const createurId = customData.createur_id;
    const devise: DeviseCode = customData.devise === "EUR" ? "EUR" : "XOF";
    const channel = customData.channel || "mobile_money";

    if (!createurId || !linkId) {
      console.error("PayDunya: données custom manquantes", customData);
      return NextResponse.json(
        { error: "Données custom manquantes" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Vérifier si déjà traité (idempotence)
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("reference", `PDY-${invoiceToken.slice(-8).toUpperCase()}`)
      .eq("statut", "confirme")
      .single();

    if (existing) {
      console.log("PayDunya: paiement déjà traité");
      return NextResponse.json({ received: true, already_processed: true });
    }

    // Récupérer le lien de paiement
    const { data: link } = await supabase
      .from("payment_links")
      .select("*")
      .eq("id", linkId)
      .single();

    if (!link) {
      console.error("PayDunya: lien introuvable", linkId);
      return NextResponse.json(
        { error: "Lien introuvable" },
        { status: 404 }
      );
    }

    const montant = Number(link.montant) || Number(verifyData.invoice?.total_amount) || 0;
    if (montant <= 0) {
      console.error("PayDunya: montant invalide", montant);
      return NextResponse.json(
        { error: "Montant invalide" },
        { status: 400 }
      );
    }

    // Frais Binq (1% pour mobile money)
    const fraisBinq = Math.ceil(montant * 0.01);
    const montantNet = montant - fraisBinq;

    // Récupérer ou créer le wallet du créateur
    let { data: creatorWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", createurId)
      .eq("devise", devise)
      .single();

    if (!creatorWallet) {
      const { data: created } = await supabase
        .from("wallets")
        .insert({
          user_id: createurId,
          solde: 0,
          solde_bloque: 0,
          devise,
        })
        .select()
        .single();
      creatorWallet = created;
    }

    if (!creatorWallet) {
      console.error("PayDunya: erreur wallet créateur");
      return NextResponse.json(
        { error: "Erreur wallet" },
        { status: 500 }
      );
    }

    // Créditer le marchand (montant net)
    const reference = `PDY-${invoiceToken.slice(-8).toUpperCase()}`;
    const now = new Date().toISOString();
    const newSolde = creatorWallet.solde + montantNet;

    const { error: creditErr } = await supabase.rpc(
      "update_wallet_balance",
      {
        p_wallet_id: creatorWallet.id,
        p_amount: montantNet,
      }
    );

    // Fallback si la RPC n'existe pas
    if (creditErr) {
      const { error: updateErr } = await supabase
        .from("wallets")
        .update({ solde: newSolde })
        .eq("id", creatorWallet.id);

      if (updateErr) {
        console.error("PayDunya: erreur crédit wallet", updateErr);
        return NextResponse.json(
          { error: "Erreur crédit wallet" },
          { status: 500 }
        );
      }
    }

    // Profil créateur
    const { data: creatorProfile } = await supabase
      .from("profiles")
      .select("prenom, nom")
      .eq("id", createurId)
      .single();
    const creatorName = creatorProfile
      ? `${creatorProfile.prenom} ${creatorProfile.nom}`.trim()
      : "Marchand";

    const linkDesc = link.description ? ` — ${link.description}` : "";

    // Transaction confirmée
    await supabase.from("transactions").upsert(
      {
        user_id: createurId,
        wallet_id: creatorWallet.id,
        type: "depot",
        montant: montantNet,
        solde_avant: creatorWallet.solde,
        solde_apres: newSolde,
        devise,
        statut: "confirme",
        reference,
        description: `Paiement mobile (${channel}) reçu${linkDesc} — Frais: ${formatMontant(fraisBinq, devise)}`,
        meta_methode: channel,
        confirmed_at: now,
      },
      { onConflict: "reference" }
    );

    // Marquer le lien comme payé (si usage unique)
    if (link.usage_unique) {
      await supabase
        .from("payment_links")
        .update({ statut: "paye", paye_at: now })
        .eq("id", link.id);
    }

    // Notification
    await supabase.from("notifications").insert({
      user_id: createurId,
      titre: "Paiement mobile reçu",
      message: `Vous avez reçu ${formatMontant(montantNet, devise)} via ${channel}${linkDesc}`,
      lu: false,
    });

    console.log(
      `✅ PayDunya: ${formatMontant(montantNet, devise)} crédité à ${creatorName} (ref: ${reference})`
    );

    return NextResponse.json({ received: true, success: true });
  } catch (error) {
    console.error("Erreur webhook PayDunya:", error);
    return NextResponse.json(
      { error: "Erreur traitement webhook" },
      { status: 500 }
    );
  }
}
