import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/api-auth";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const supabase = getServiceClient();

  let query = supabase
    .from("profiles")
    .select("id, prenom, nom, telephone, avatar, is_livreur")
    .eq("is_livreur", true)
    .neq("id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (q && q.length >= 2) {
    query = query.or(`prenom.ilike.%${q}%,nom.ilike.%${q}%,telephone.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erreur fetch livreurs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const livreurs = (data || []).map((profile) => ({
    id: profile.id,
    prenom: profile.prenom || "",
    nom: profile.nom || "",
    telephone: profile.telephone || "",
    avatar_url: profile.avatar || null,
  }));

  return NextResponse.json({ livreurs });
}

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_livreur: true, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id, prenom, nom, telephone, avatar, is_livreur")
    .single();

  if (error) {
    console.error("Erreur activation livreur:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    livreur: {
      id: data.id,
      prenom: data.prenom || "",
      nom: data.nom || "",
      telephone: data.telephone || "",
      avatar_url: data.avatar || null,
    },
  });
}
