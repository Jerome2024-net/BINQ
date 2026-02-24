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

// ── GET : rechercher des utilisateurs par nom ou prénom ──
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Recherche trop courte (min 2 caractères)" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Recherche par prénom ou nom
  const { data, error } = await supabase
    .from("profiles")
    .select("id, prenom, nom, avatar")
    .or(`prenom.ilike.%${q}%,nom.ilike.%${q}%`)
    .neq("id", user.id)
    .limit(10);

  if (error) {
    console.error("Erreur recherche utilisateurs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = (data || []).map((u) => ({
    id: u.id,
    prenom: u.prenom || "",
    nom: u.nom || "",
    avatar_url: u.avatar || null,
  }));

  return NextResponse.json({ users: results });
}
