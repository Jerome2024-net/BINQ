import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── GET : infos publiques d'une cagnotte via code d'invitation ──
export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const supabase = getServiceClient();

  const { data: cagnotte } = await supabase
    .from("cagnottes")
    .select(`
      id, nom, description, objectif_montant, date_limite,
      devise, icone, couleur, solde, statut, created_at,
      cagnotte_membres ( id, user_id )
    `)
    .eq("code_invitation", params.code.toUpperCase())
    .single();

  if (!cagnotte) {
    return NextResponse.json({ error: "Cagnotte introuvable" }, { status: 404 });
  }

  if (cagnotte.statut !== "active") {
    return NextResponse.json({ error: "Cette cagnotte n'est plus active" }, { status: 400 });
  }

  // Récupérer les profils des 5 premiers membres
  const membreUserIds = (cagnotte.cagnotte_membres || []).slice(0, 5).map((m: { user_id: string }) => m.user_id);
  let membresApercu: { prenom: string; avatar_url: string | null }[] = [];
  if (membreUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, prenom, avatar_url")
      .in("id", membreUserIds);
    membresApercu = (profiles || []).map((p) => ({
      prenom: p.prenom || "",
      avatar_url: p.avatar_url || null,
    }));
  }

  return NextResponse.json({
    id: cagnotte.id,
    nom: cagnotte.nom,
    description: cagnotte.description,
    objectif_montant: cagnotte.objectif_montant,
    date_limite: cagnotte.date_limite,
    devise: cagnotte.devise,
    icone: cagnotte.icone,
    couleur: cagnotte.couleur,
    solde: cagnotte.solde,
    nombre_membres: cagnotte.cagnotte_membres?.length || 0,
    membres_apercu: membresApercu,
  });
}
