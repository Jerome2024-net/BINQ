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

  // Recherche par nom, prénom, email ou telephone
  const { data, error } = await supabase
    .from("profiles")
    .select("id, prenom, nom, avatar, email, telephone")
    .or(
      `prenom.ilike.%${q}%,nom.ilike.%${q}%,email.ilike.%${q}%,telephone.ilike.%${q}%`
    )
    .neq("id", user.id)
    .limit(10);

  if (error) {
    console.error("Erreur recherche utilisateurs:", error);

    // Fallback : recherche simple sur prenom + nom uniquement
    const { data: fallback, error: fbErr } = await supabase
      .from("profiles")
      .select("id, prenom, nom, avatar, email, telephone")
      .or(`prenom.ilike.%${q}%,nom.ilike.%${q}%`)
      .neq("id", user.id)
      .limit(10);

    if (fbErr) {
      console.error("Erreur fallback recherche:", fbErr);
      return NextResponse.json({ error: fbErr.message }, { status: 500 });
    }

    const results = (fallback || []).map((u) => ({
      id: u.id,
      prenom: u.prenom || "",
      nom: u.nom || "",
      avatar_url: u.avatar || null,
      email_masked: u.email ? maskEmail(u.email) : null,
    }));

    return NextResponse.json({ users: results });
  }

  // Ne pas exposer trop d'infos — masquer email/téléphone partiellement
  const results = (data || []).map((u) => ({
    id: u.id,
    prenom: u.prenom || "",
    nom: u.nom || "",
    avatar_url: u.avatar || null,
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
