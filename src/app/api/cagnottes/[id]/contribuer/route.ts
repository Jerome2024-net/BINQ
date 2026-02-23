import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── POST : contribuer à une cagnotte (depuis le portefeuille) ──
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { montant, message } = body;

  if (!montant || montant <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  if (montant > 10000) {
    return NextResponse.json({ error: "Montant maximum : 10 000" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Vérifier que la cagnotte est active
  const { data: cagnotte } = await supabase
    .from("cagnottes")
    .select("id, solde, statut, date_limite, devise")
    .eq("id", params.id)
    .single();

  if (!cagnotte || cagnotte.statut !== "active") {
    return NextResponse.json({ error: "Cagnotte non trouvée ou inactive" }, { status: 404 });
  }

  // Vérifier la date limite
  if (cagnotte.date_limite && new Date(cagnotte.date_limite) < new Date()) {
    return NextResponse.json({ error: "Cette cagnotte a expiré" }, { status: 400 });
  }

  // Vérifier que l'utilisateur est membre
  const { data: membre } = await supabase
    .from("cagnotte_membres")
    .select("id, total_contribue")
    .eq("cagnotte_id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!membre) {
    return NextResponse.json({ error: "Vous n'êtes pas membre de cette cagnotte" }, { status: 403 });
  }

  // Vérifier le solde du portefeuille
  const { data: wallet } = await supabase
    .from("wallets")
    .select("id, solde")
    .eq("user_id", user.id)
    .single();

  if (!wallet || Number(wallet.solde) < montant) {
    return NextResponse.json({ error: "Solde portefeuille insuffisant" }, { status: 400 });
  }

  // --- Transaction atomique ---
  const nouveauSoldeWallet = Number(wallet.solde) - montant;
  const nouveauSoldeCagnotte = Number(cagnotte.solde) + montant;
  const nouveauTotalContribue = Number(membre.total_contribue) + montant;

  // 1. Débiter le portefeuille
  const { error: walletError } = await supabase
    .from("wallets")
    .update({ solde: nouveauSoldeWallet, updated_at: new Date().toISOString() })
    .eq("id", wallet.id)
    .eq("solde", wallet.solde); // optimistic lock

  if (walletError) {
    return NextResponse.json({ error: "Erreur lors du débit du portefeuille" }, { status: 500 });
  }

  // 2. Créditer la cagnotte
  await supabase
    .from("cagnottes")
    .update({ solde: nouveauSoldeCagnotte, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  // 3. Mettre à jour le total du membre
  await supabase
    .from("cagnotte_membres")
    .update({ total_contribue: nouveauTotalContribue })
    .eq("id", membre.id);

  // 4. Enregistrer la contribution
  const { data: contribution, error: contribError } = await supabase
    .from("cagnotte_contributions")
    .insert({
      cagnotte_id: params.id,
      user_id: user.id,
      montant,
      message: message?.trim() || null,
      type: "contribution",
    })
    .select()
    .single();

  if (contribError) {
    console.error("Erreur contribution:", contribError);
    return NextResponse.json({ error: contribError.message }, { status: 500 });
  }

  // 5. Enregistrer la transaction wallet
  await supabase.from("transactions").insert({
    user_id: user.id,
    wallet_id: wallet.id,
    type: "cagnotte",
    montant,
    solde_avant: wallet.solde,
    solde_apres: nouveauSoldeWallet,
    devise: cagnotte.devise || "EUR",
    statut: "confirme",
    reference: `CAG-${Date.now().toString(36).toUpperCase()}`,
    description: `Contribution cagnotte`,
    confirmed_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    contribution,
    nouveau_solde_cagnotte: nouveauSoldeCagnotte,
    nouveau_solde_wallet: nouveauSoldeWallet,
  });
}
