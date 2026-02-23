import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── GET : infos publiques d'un payment link (par code) ──
export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  if (!code) {
    return NextResponse.json({ error: "Code requis" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: link, error } = await supabase
    .from("payment_links")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !link) {
    return NextResponse.json({ error: "Lien de paiement introuvable" }, { status: 404 });
  }

  if (link.statut !== "actif") {
    return NextResponse.json({
      error: link.statut === "paye" ? "Ce lien a déjà été utilisé" : "Ce lien n'est plus actif",
      statut: link.statut,
    }, { status: 410 });
  }

  // Récupérer le profil du créateur
  const { data: profile } = await supabase
    .from("profiles")
    .select("prenom, nom, avatar_url")
    .eq("id", link.createur_id)
    .single();

  return NextResponse.json({
    link: {
      id: link.id,
      code: link.code,
      montant: link.montant,
      devise: link.devise,
      description: link.description,
      statut: link.statut,
      type: link.type || 'request',
      createur: profile
        ? { prenom: profile.prenom, nom: profile.nom, avatar_url: profile.avatar_url }
        : { prenom: "Utilisateur", nom: "Binq", avatar_url: null },
    },
  });
}
