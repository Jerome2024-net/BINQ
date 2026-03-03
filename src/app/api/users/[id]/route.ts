import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── GET : profil public d'un utilisateur (pour QR Code / paiement direct) ──
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, prenom, nom, avatar")
    .eq("id", id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: profile.id,
      prenom: profile.prenom || "",
      nom: profile.nom || "",
      avatar_url: profile.avatar || null,
    },
  });
}
