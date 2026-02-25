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

// ── POST : envoyer de l'argent à un autre utilisateur ──
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { destinataire_id, montant, message } = body;

  // Validation
  if (!destinataire_id || typeof destinataire_id !== "string") {
    return NextResponse.json({ error: "Destinataire requis" }, { status: 400 });
  }
  if (!montant || typeof montant !== "number" || montant <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }
  if (montant < 1) {
    return NextResponse.json({ error: "Montant minimum : 1 €" }, { status: 400 });
  }
  if (destinataire_id === user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous envoyer de l'argent" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // 1. Vérifier que le destinataire existe
  const { data: destProfile } = await supabase
    .from("profiles")
    .select("id, prenom, nom")
    .eq("id", destinataire_id)
    .single();

  if (!destProfile) {
    return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 });
  }

  // 2. Récupérer le wallet de l'expéditeur
  const { data: senderWallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!senderWallet) {
    return NextResponse.json({ error: "Portefeuille non trouvé" }, { status: 404 });
  }

  if (senderWallet.solde < montant) {
    return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
  }

  // 3. Récupérer ou créer le wallet du destinataire
  let { data: receiverWallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", destinataire_id)
    .single();

  if (!receiverWallet) {
    const { data: created, error: createErr } = await supabase
      .from("wallets")
      .insert({ user_id: destinataire_id, solde: 0, solde_bloque: 0, devise: "EUR" })
      .select()
      .single();

    if (createErr || !created) {
      return NextResponse.json({ error: "Erreur création wallet destinataire" }, { status: 500 });
    }
    receiverWallet = created;
  }

  const reference = `TRF-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  // 4. Récupérer le profil de l'expéditeur pour la description
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("prenom, nom")
    .eq("id", user.id)
    .single();

  const senderName = senderProfile ? `${senderProfile.prenom} ${senderProfile.nom}`.trim() : "Utilisateur";
  const destName = `${destProfile.prenom} ${destProfile.nom}`.trim();

  // 5. Débiter l'expéditeur
  const newSenderSolde = senderWallet.solde - montant;
  const { error: debitErr } = await supabase
    .from("wallets")
    .update({ solde: newSenderSolde })
    .eq("id", senderWallet.id);

  if (debitErr) {
    return NextResponse.json({ error: "Erreur lors du débit" }, { status: 500 });
  }

  // 6. Créditer le destinataire
  const newReceiverSolde = receiverWallet.solde + montant;
  const { error: creditErr } = await supabase
    .from("wallets")
    .update({ solde: newReceiverSolde })
    .eq("id", receiverWallet.id);

  if (creditErr) {
    // Rollback le débit
    await supabase
      .from("wallets")
      .update({ solde: senderWallet.solde })
      .eq("id", senderWallet.id);
    return NextResponse.json({ error: "Erreur lors du crédit" }, { status: 500 });
  }

  // 7. Créer le transfert
  const { error: transferErr } = await supabase.from("transferts").insert({
    expediteur_id: user.id,
    destinataire_id,
    montant,
    devise: "EUR",
    message: message || null,
    statut: "confirme",
    reference,
  });

  if (transferErr) {
    console.error("Erreur insert transfert:", transferErr);
  }

  // 8. Enregistrer les transactions dans l'historique
  await Promise.all([
    supabase.from("transactions").insert({
      user_id: user.id,
      wallet_id: senderWallet.id,
      type: "transfert_sortant",
      montant,
      solde_avant: senderWallet.solde,
      solde_apres: newSenderSolde,
      devise: "EUR",
      statut: "confirme",
      reference,
      description: `Envoi à ${destName}${message ? ` — ${message}` : ""}`,
      meta_methode: "transfert_p2p",
      confirmed_at: now,
    }),
    supabase.from("transactions").insert({
      user_id: destinataire_id,
      wallet_id: receiverWallet.id,
      type: "transfert_entrant",
      montant,
      solde_avant: receiverWallet.solde,
      solde_apres: newReceiverSolde,
      devise: "EUR",
      statut: "confirme",
      reference,
      description: `Reçu de ${senderName}${message ? ` — ${message}` : ""}`,
      meta_methode: "transfert_p2p",
      confirmed_at: now,
    }),
  ]);

  // Notifications in-app
  await Promise.allSettled([
    supabase.from("notifications").insert({
      user_id: destinataire_id,
      titre: "Argent reçu",
      message: `${senderName} vous a envoyé ${montant.toFixed(2)} €${message ? ` — ${message}` : ""}`,
      lu: false,
    }),
    supabase.from("notifications").insert({
      user_id: user.id,
      titre: "Transfert envoyé",
      message: `Vous avez envoyé ${montant.toFixed(2)} € à ${destName}`,
      lu: false,
    }),
  ]);

  return NextResponse.json({
    success: true,
    transfert: {
      reference,
      montant,
      destinataire: destName,
    },
  });
}
