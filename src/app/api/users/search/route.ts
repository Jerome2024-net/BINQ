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

// ── GET : rechercher des utilisateurs par nom, prénom, email ou téléphone ──
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Recherche trop courte (min 2 caractères)" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Recherche par nom, prénom ou email (ilike)
  const searchPattern = `%${q}%`;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, prenom, nom, avatar_url, email, telephone")
    .or(`prenom.ilike.${searchPattern},nom.ilike.${searchPattern},email.ilike.${searchPattern},telephone.ilike.${searchPattern}`)
    .neq("id", user.id) // Exclure soi-même
    .limit(10);

  if (error) {
    console.error("Erreur recherche utilisateurs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Ne pas exposer trop d'infos — masquer email/téléphone partiellement
  const results = (data || []).map((u) => ({
    id: u.id,
    prenom: u.prenom || "",
    nom: u.nom || "",
    avatar_url: u.avatar_url,
    email_masked: u.email ? maskEmail(u.email) : null,
  }));

  return NextResponse.json({ users: results });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}
