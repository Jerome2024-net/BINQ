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

// ── POST : rejoindre une cagnotte via code ──
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { code } = body;

  if (!code?.trim()) {
    return NextResponse.json({ error: "Code d'invitation requis" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Trouver la cagnotte
  const { data: cagnotte } = await supabase
    .from("cagnottes")
    .select("id, nom, statut")
    .eq("code_invitation", code.trim().toUpperCase())
    .single();

  if (!cagnotte) {
    return NextResponse.json({ error: "Code invalide ou cagnotte introuvable" }, { status: 404 });
  }

  if (cagnotte.statut !== "active") {
    return NextResponse.json({ error: "Cette cagnotte n'est plus active" }, { status: 400 });
  }

  // Vérifier si déjà membre
  const { data: existant } = await supabase
    .from("cagnotte_membres")
    .select("id")
    .eq("cagnotte_id", cagnotte.id)
    .eq("user_id", user.id)
    .single();

  if (existant) {
    return NextResponse.json({ error: "Vous êtes déjà membre de cette cagnotte", cagnotte_id: cagnotte.id }, { status: 400 });
  }

  // Vérifier max 20 membres
  const { count } = await supabase
    .from("cagnotte_membres")
    .select("id", { count: "exact", head: true })
    .eq("cagnotte_id", cagnotte.id);

  if ((count || 0) >= 20) {
    return NextResponse.json({ error: "Cette cagnotte est complète (max 20 membres)" }, { status: 400 });
  }

  // Ajouter le membre
  await supabase.from("cagnotte_membres").insert({
    cagnotte_id: cagnotte.id,
    user_id: user.id,
    role: "membre",
    total_contribue: 0,
  });

  return NextResponse.json({
    success: true,
    cagnotte_id: cagnotte.id,
    nom: cagnotte.nom,
  });
}
