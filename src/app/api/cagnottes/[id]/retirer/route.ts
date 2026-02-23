import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── POST : retirer les fonds de la cagnotte (admin uniquement) ──
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { montant, destination } = body;
  // destination: "wallet" pour envoyer vers le portefeuille de l'admin
  // destination: "repartir" pour répartir entre tous les membres

  const supabase = getServiceClient();

  // Vérifier que c'est l'admin
  const { data: cagnotte } = await supabase
    .from("cagnottes")
    .select("id, createur_id, solde, devise, statut")
    .eq("id", params.id)
    .single();

  if (!cagnotte || cagnotte.createur_id !== user.id) {
    return NextResponse.json({ error: "Seul l'administrateur peut retirer les fonds" }, { status: 403 });
  }

  if (cagnotte.statut !== "active") {
    return NextResponse.json({ error: "Cagnotte inactive" }, { status: 400 });
  }

  const soldeDisponible = Number(cagnotte.solde);
  const montantRetrait = montant ? Number(montant) : soldeDisponible;

  if (montantRetrait <= 0 || montantRetrait > soldeDisponible) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  if (destination === "repartir") {
    // Répartir entre les membres
    const { data: membres } = await supabase
      .from("cagnotte_membres")
      .select("user_id")
      .eq("cagnotte_id", params.id);

    if (!membres || membres.length === 0) {
      return NextResponse.json({ error: "Aucun membre" }, { status: 400 });
    }

    const partParMembre = Math.floor((montantRetrait / membres.length) * 100) / 100;
    const reste = montantRetrait - (partParMembre * membres.length);

    for (let i = 0; i < membres.length; i++) {
      const m = membres[i];
      const part = i === 0 ? partParMembre + reste : partParMembre; // premier membre reçoit le reste

      // Créditer le portefeuille du membre
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, solde")
        .eq("user_id", m.user_id)
        .single();

      if (wallet) {
        const nouveauSolde = Number(wallet.solde) + part;
        await supabase
          .from("wallets")
          .update({ solde: nouveauSolde, updated_at: new Date().toISOString() })
          .eq("id", wallet.id);

        await supabase.from("transactions").insert({
          user_id: m.user_id,
          wallet_id: wallet.id,
          type: "cagnotte_retrait",
          montant: part,
          solde_avant: wallet.solde,
          solde_apres: nouveauSolde,
          devise: cagnotte.devise || "EUR",
          statut: "confirme",
          reference: `CAGR-${Date.now().toString(36).toUpperCase()}`,
          description: `Répartition cagnotte`,
          confirmed_at: new Date().toISOString(),
        });
      }
    }

    // Enregistrer la contribution de retrait
    await supabase.from("cagnotte_contributions").insert({
      cagnotte_id: params.id,
      user_id: user.id,
      montant: montantRetrait,
      type: "retrait_reparti",
      message: `Réparti entre ${membres.length} membres`,
    });

  } else {
    // Envoyer tout vers le portefeuille de l'admin
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, solde")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      return NextResponse.json({ error: "Portefeuille non trouvé" }, { status: 404 });
    }

    const nouveauSoldeWallet = Number(wallet.solde) + montantRetrait;

    await supabase
      .from("wallets")
      .update({ solde: nouveauSoldeWallet, updated_at: new Date().toISOString() })
      .eq("id", wallet.id);

    await supabase.from("transactions").insert({
      user_id: user.id,
      wallet_id: wallet.id,
      type: "cagnotte_retrait",
      montant: montantRetrait,
      solde_avant: wallet.solde,
      solde_apres: nouveauSoldeWallet,
      devise: cagnotte.devise || "EUR",
      statut: "confirme",
      reference: `CAGR-${Date.now().toString(36).toUpperCase()}`,
      description: `Retrait cagnotte`,
      confirmed_at: new Date().toISOString(),
    });

    await supabase.from("cagnotte_contributions").insert({
      cagnotte_id: params.id,
      user_id: user.id,
      montant: montantRetrait,
      type: "retrait",
      message: "Retrait vers portefeuille",
    });
  }

  // Mettre à jour le solde de la cagnotte
  const nouveauSoldeCagnotte = soldeDisponible - montantRetrait;
  await supabase
    .from("cagnottes")
    .update({
      solde: nouveauSoldeCagnotte,
      statut: nouveauSoldeCagnotte <= 0 ? "cloturee" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  return NextResponse.json({
    success: true,
    nouveau_solde: nouveauSoldeCagnotte,
  });
}
