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

// ── GET : historique des transferts P2P ──
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("transferts")
    .select("*")
    .or(`expediteur_id.eq.${user.id},destinataire_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Erreur fetch transferts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Récupérer les profils des participants
  const userIds = Array.from(new Set(
    (data || []).flatMap((t) => [t.expediteur_id, t.destinataire_id])
  ));

  let profilesMap: Record<string, { prenom: string; nom: string; avatar_url: string | null }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, prenom, nom, avatar_url")
      .in("id", userIds);

    if (profiles) {
      for (const p of profiles) {
        profilesMap[p.id] = { prenom: p.prenom, nom: p.nom, avatar_url: p.avatar_url };
      }
    }
  }

  const transferts = (data || []).map((t) => ({
    ...t,
    expediteur: profilesMap[t.expediteur_id] || { prenom: "Inconnu", nom: "", avatar_url: null },
    destinataire: profilesMap[t.destinataire_id] || { prenom: "Inconnu", nom: "", avatar_url: null },
    direction: t.expediteur_id === user.id ? "sortant" : "entrant",
  }));

  return NextResponse.json({ transferts });
}
