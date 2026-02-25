import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── POST : créer un lien d'envoi (Send via link) ──
// L'expéditeur est débité immédiatement. Le destinataire clique le lien pour récupérer.
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { montant, description } = body;

  if (!montant || typeof montant !== "number" || montant <= 0) {
    return NextResponse.json({ error: "Montant requis et doit être > 0" }, { status: 400 });
  }
  if (montant < 1) {
    return NextResponse.json({ error: "Montant minimum : 1 €" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // 1. Récupérer le wallet de l'expéditeur
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

  // 2. Débiter l'expéditeur immédiatement
  const newSolde = senderWallet.solde - montant;
  const { error: debitErr } = await supabase
    .from("wallets")
    .update({ solde: newSolde })
    .eq("id", senderWallet.id);

  if (debitErr) {
    return NextResponse.json({ error: "Erreur lors du débit" }, { status: 500 });
  }

  // 3. Créer le lien de type 'send'
  const code = crypto.randomBytes(8).toString("hex");
  const reference = `SND-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  const { data: link, error: linkErr } = await supabase
    .from("payment_links")
    .insert({
      createur_id: user.id,
      code,
      montant,
      devise: "EUR",
      description: description || null,
      statut: "actif",
      type: "send",
      usage_unique: true,
    })
    .select()
    .single();

  if (linkErr || !link) {
    // Rollback le débit
    await supabase
      .from("wallets")
      .update({ solde: senderWallet.solde })
      .eq("id", senderWallet.id);
    return NextResponse.json({ error: "Erreur création du lien" }, { status: 500 });
  }

  // 4. Enregistrer la transaction de débit
  await supabase.from("transactions").insert({
    user_id: user.id,
    wallet_id: senderWallet.id,
    type: "transfert_sortant",
    montant,
    solde_avant: senderWallet.solde,
    solde_apres: newSolde,
    devise: "EUR",
    statut: "confirme",
    reference,
    description: `Envoi via lien${description ? ` — ${description}` : ""}`,
    meta_methode: "send_link",
    confirmed_at: now,
  });

  // Notification in-app
  try {
    await supabase.from("notifications").insert({
      user_id: user.id,
      titre: "Lien d'envoi créé",
      message: `Vous avez créé un lien d'envoi de ${montant.toFixed(2)} €${description ? ` — ${description}` : ""}`,
      lu: false,
    });
  } catch { /* ignore */ }

  return NextResponse.json({
    success: true,
    link: { code: link.code, montant, reference },
  });
}
