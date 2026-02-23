import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── POST : payer un payment link ──
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { code, montant: montantLibre } = body;

  if (!code) {
    return NextResponse.json({ error: "Code requis" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // 1. Récupérer le lien
  const { data: link, error: linkErr } = await supabase
    .from("payment_links")
    .select("*")
    .eq("code", code)
    .single();

  if (linkErr || !link) {
    return NextResponse.json({ error: "Lien de paiement introuvable" }, { status: 404 });
  }

  if (link.statut !== "actif") {
    return NextResponse.json({ error: "Ce lien n'est plus actif" }, { status: 410 });
  }

  const linkType = link.type || "request";

  // Pour les liens 'send', le créateur envoie, donc le claimant ne peut pas être le créateur
  // Pour les liens 'request', le créateur demande, donc le payeur ne peut pas être le créateur
  if (link.createur_id === user.id) {
    return NextResponse.json({
      error: linkType === "send"
        ? "Vous ne pouvez pas récupérer votre propre envoi"
        : "Vous ne pouvez pas payer votre propre lien",
    }, { status: 400 });
  }

  // ── Type 'send': l'expéditeur a déjà été débité, on crédite le claimant ──
  if (linkType === "send") {
    const montant = Number(link.montant);
    if (!montant || montant <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    // Récupérer ou créer le wallet du claimant
    let { data: claimantWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!claimantWallet) {
      const { data: created } = await supabase
        .from("wallets")
        .insert({ user_id: user.id, solde: 0, solde_bloque: 0, devise: "EUR" })
        .select()
        .single();
      claimantWallet = created;
    }

    if (!claimantWallet) {
      return NextResponse.json({ error: "Erreur wallet" }, { status: 500 });
    }

    const reference = `CLM-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    // Profils
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("prenom, nom")
      .eq("id", link.createur_id)
      .single();

    const { data: claimantProfile } = await supabase
      .from("profiles")
      .select("prenom, nom")
      .eq("id", user.id)
      .single();

    const senderName = senderProfile ? `${senderProfile.prenom} ${senderProfile.nom}`.trim() : "Utilisateur";
    const claimantName = claimantProfile ? `${claimantProfile.prenom} ${claimantProfile.nom}`.trim() : "Utilisateur";

    // Créditer le claimant
    const newClaimantSolde = claimantWallet.solde + montant;
    const { error: creditErr } = await supabase
      .from("wallets")
      .update({ solde: newClaimantSolde })
      .eq("id", claimantWallet.id);

    if (creditErr) {
      return NextResponse.json({ error: "Erreur lors du crédit" }, { status: 500 });
    }

    // Transfert
    await supabase.from("transferts").insert({
      expediteur_id: link.createur_id,
      destinataire_id: user.id,
      montant,
      devise: "EUR",
      message: link.description || "Envoi via lien",
      statut: "confirme",
      payment_link_id: link.id,
      reference,
    });

    // Transaction pour le claimant
    const linkDesc = link.description ? ` — ${link.description}` : "";
    await supabase.from("transactions").insert({
      user_id: user.id,
      wallet_id: claimantWallet.id,
      type: "transfert_entrant",
      montant,
      solde_avant: claimantWallet.solde,
      solde_apres: newClaimantSolde,
      devise: "EUR",
      statut: "confirme",
      reference,
      description: `Reçu de ${senderName}${linkDesc}`,
      meta_methode: "send_link",
      confirmed_at: now,
    });

    // Marquer comme payé
    if (link.usage_unique) {
      await supabase
        .from("payment_links")
        .update({ statut: "paye", paye_par: user.id, paye_at: now })
        .eq("id", link.id);
    }

    return NextResponse.json({
      success: true,
      transfert: { reference, montant, expediteur: senderName },
    });
  }

  // ── Type 'request': flow normal — débit payeur + crédit créateur ──
  const montant = link.montant ? Number(link.montant) : Number(montantLibre);

  if (!montant || montant <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }
  if (montant < 1) {
    return NextResponse.json({ error: "Montant minimum : 1 €" }, { status: 400 });
  }

  // 2. Récupérer le wallet du payeur
  const { data: payerWallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!payerWallet) {
    return NextResponse.json({ error: "Portefeuille non trouvé" }, { status: 404 });
  }

  if (payerWallet.solde < montant) {
    return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
  }

  // 3. Récupérer ou créer le wallet du créateur
  let { data: creatorWallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", link.createur_id)
    .single();

  if (!creatorWallet) {
    const { data: created } = await supabase
      .from("wallets")
      .insert({ user_id: link.createur_id, solde: 0, solde_bloque: 0, devise: "EUR" })
      .select()
      .single();
    creatorWallet = created;
  }

  if (!creatorWallet) {
    return NextResponse.json({ error: "Erreur wallet destinataire" }, { status: 500 });
  }

  const reference = `PAY-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  // Profils
  const { data: payerProfile } = await supabase
    .from("profiles")
    .select("prenom, nom")
    .eq("id", user.id)
    .single();

  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select("prenom, nom")
    .eq("id", link.createur_id)
    .single();

  const payerName = payerProfile ? `${payerProfile.prenom} ${payerProfile.nom}`.trim() : "Utilisateur";
  const creatorName = creatorProfile ? `${creatorProfile.prenom} ${creatorProfile.nom}`.trim() : "Utilisateur";

  // 4. Débiter le payeur
  const newPayerSolde = payerWallet.solde - montant;
  const { error: debitErr } = await supabase
    .from("wallets")
    .update({ solde: newPayerSolde })
    .eq("id", payerWallet.id);

  if (debitErr) {
    return NextResponse.json({ error: "Erreur lors du débit" }, { status: 500 });
  }

  // 5. Créditer le créateur
  const newCreatorSolde = creatorWallet.solde + montant;
  const { error: creditErr } = await supabase
    .from("wallets")
    .update({ solde: newCreatorSolde })
    .eq("id", creatorWallet.id);

  if (creditErr) {
    // Rollback
    await supabase
      .from("wallets")
      .update({ solde: payerWallet.solde })
      .eq("id", payerWallet.id);
    return NextResponse.json({ error: "Erreur lors du crédit" }, { status: 500 });
  }

  // 6. Créer le transfert
  await supabase.from("transferts").insert({
    expediteur_id: user.id,
    destinataire_id: link.createur_id,
    montant,
    devise: "EUR",
    message: link.description || "Paiement par lien",
    statut: "confirme",
    payment_link_id: link.id,
    reference,
  });

  // 7. Transactions
  const linkDesc = link.description ? ` — ${link.description}` : "";
  await Promise.all([
    supabase.from("transactions").insert({
      user_id: user.id,
      wallet_id: payerWallet.id,
      type: "transfert_sortant",
      montant,
      solde_avant: payerWallet.solde,
      solde_apres: newPayerSolde,
      devise: "EUR",
      statut: "confirme",
      reference,
      description: `Paiement à ${creatorName}${linkDesc}`,
      meta_methode: "payment_link",
      confirmed_at: now,
    }),
    supabase.from("transactions").insert({
      user_id: link.createur_id,
      wallet_id: creatorWallet.id,
      type: "transfert_entrant",
      montant,
      solde_avant: creatorWallet.solde,
      solde_apres: newCreatorSolde,
      devise: "EUR",
      statut: "confirme",
      reference,
      description: `Paiement reçu de ${payerName}${linkDesc}`,
      meta_methode: "payment_link",
      confirmed_at: now,
    }),
  ]);

  // 8. Marquer le lien comme payé (si usage unique)
  if (link.usage_unique) {
    await supabase
      .from("payment_links")
      .update({ statut: "paye", paye_par: user.id, paye_at: now })
      .eq("id", link.id);
  }

  return NextResponse.json({
    success: true,
    transfert: { reference, montant, destinataire: creatorName },
  });
}
