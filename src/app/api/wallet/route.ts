import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * GET /api/wallet
 * Retourne le wallet EUR + transactions récentes de l'utilisateur.
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const supabase = getServiceClient();

  // Get or create wallet
  let { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!wallet) {
    const { data: newWallet, error } = await supabase
      .from("wallets")
      .insert({ user_id: user.id, solde: 0, solde_bloque: 0, devise: "EUR" })
      .select()
      .single();
    if (error) return NextResponse.json({ error: "Erreur création wallet" }, { status: 500 });
    wallet = newWallet;
  }

  // Recent transactions
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .in("type", ["depot", "transfert_sortant", "transfert_entrant", "retrait", "vente_crypto", "commission"])
    .eq("statut", "confirme")
    .order("created_at", { ascending: false })
    .limit(30);

  // Recent transfers with user info
  const { data: transferts } = await supabase
    .from("transferts")
    .select("*")
    .or(`expediteur_id.eq.${user.id},destinataire_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get profiles for transfers
  const userIds = Array.from(new Set(
    (transferts || []).flatMap((t) => [t.expediteur_id, t.destinataire_id])
  ));

  let profilesMap: Record<string, { prenom: string; nom: string }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, prenom, nom")
      .in("id", userIds);
    if (profiles) {
      for (const p of profiles) profilesMap[p.id] = { prenom: p.prenom, nom: p.nom };
    }
  }

  const enrichedTransfers = (transferts || []).map((t) => ({
    ...t,
    expediteur: profilesMap[t.expediteur_id] || { prenom: "Inconnu", nom: "" },
    destinataire: profilesMap[t.destinataire_id] || { prenom: "Inconnu", nom: "" },
    direction: t.expediteur_id === user.id ? "sortant" : "entrant",
  }));

  return NextResponse.json({
    wallet: {
      solde: wallet.solde || 0,
      devise: wallet.devise || "EUR",
    },
    transactions: transactions || [],
    transferts: enrichedTransfers,
  });
}
