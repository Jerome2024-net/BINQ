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

// ── GET : polling du statut d'un QR terminal marchand ──
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code requis" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: link, error } = await supabase
    .from("payment_links")
    .select("id, code, statut, montant, devise, paye_par, paye_at, createur_id")
    .eq("code", code)
    .single();

  if (error || !link) {
    return NextResponse.json({ error: "Terminal non trouvé" }, { status: 404 });
  }

  // Vérifier que c'est bien le marchand qui poll
  if (link.createur_id !== user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  let payerName = null;
  if (link.paye_par) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("prenom, nom")
      .eq("id", link.paye_par)
      .single();
    if (profile) {
      payerName = `${profile.prenom} ${profile.nom}`.trim();
    }
  }

  return NextResponse.json({
    code: link.code,
    statut: link.statut,
    montant: link.montant,
    devise: link.devise,
    paye_par: payerName,
    paye_at: link.paye_at,
  });
}
