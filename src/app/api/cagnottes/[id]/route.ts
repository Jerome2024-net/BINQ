import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── GET : détails d'une cagnotte ──
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = getServiceClient();

  // Vérifier que l'utilisateur est membre
  const { data: membre } = await supabase
    .from("cagnotte_membres")
    .select("role")
    .eq("cagnotte_id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!membre) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data: cagnotte, error } = await supabase
    .from("cagnottes")
    .select(`
      *,
      cagnotte_membres (
        id,
        user_id,
        role,
        total_contribue,
        joined_at,
        profiles:user_id ( prenom, nom, avatar_url, email )
      ),
      cagnotte_contributions (
        id,
        user_id,
        montant,
        message,
        created_at,
        profiles:user_id ( prenom, nom, avatar_url )
      )
    `)
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Trier contributions par date décroissante
  if (cagnotte.cagnotte_contributions) {
    cagnotte.cagnotte_contributions.sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return NextResponse.json({
    cagnotte,
    mon_role: membre.role,
  });
}

// ── DELETE : supprimer une cagnotte (admin uniquement) ──
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = getServiceClient();

  // Vérifier que c'est l'admin
  const { data: cagnotte } = await supabase
    .from("cagnottes")
    .select("createur_id, solde")
    .eq("id", params.id)
    .single();

  if (!cagnotte || cagnotte.createur_id !== user.id) {
    return NextResponse.json({ error: "Vous n'êtes pas l'administrateur" }, { status: 403 });
  }

  if (Number(cagnotte.solde) > 0) {
    return NextResponse.json(
      { error: "Retirez d'abord tout le solde avant de supprimer" },
      { status: 400 }
    );
  }

  await supabase
    .from("cagnottes")
    .update({ statut: "supprimee", updated_at: new Date().toISOString() })
    .eq("id", params.id);

  return NextResponse.json({ success: true });
}
