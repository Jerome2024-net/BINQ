import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── GET : lister ses comptes d'épargne ──
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("epargnes")
    .select("*")
    .eq("user_id", user.id)
    .neq("statut", "cloturee")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ epargnes: data });
}

// ── POST : créer un compte d'épargne ──
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const {
    nom,
    type,
    objectif_montant,
    objectif_date,
    montant_auto,
    frequence_auto,
    source_auto,
    bloque_jusqu_a,
    icone,
    couleur,
    devise,
  } = body;

  if (!nom || !type) {
    return NextResponse.json({ error: "Nom et type requis" }, { status: 400 });
  }

  const deviseValide = ["EUR", "USD"].includes(devise) ? devise : "EUR";

  if (!["libre", "objectif", "programmee"].includes(type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Vérifier le nombre de comptes existants (max 10)
  const { count } = await supabase
    .from("epargnes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("statut", "cloturee");

  if ((count || 0) >= 10) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas avoir plus de 10 comptes d'épargne actifs" },
      { status: 400 }
    );
  }

  // Calcul prochaine date auto si programmée
  let prochaine_date_auto = null;
  if (type === "programmee" && montant_auto && frequence_auto) {
    const now = new Date();
    if (frequence_auto === "quotidien") {
      now.setDate(now.getDate() + 1);
    } else if (frequence_auto === "hebdomadaire") {
      now.setDate(now.getDate() + 7);
    } else if (frequence_auto === "mensuel") {
      now.setMonth(now.getMonth() + 1);
    }
    prochaine_date_auto = now.toISOString();
  }

  const { data, error } = await supabase
    .from("epargnes")
    .insert({
      user_id: user.id,
      nom: nom.trim(),
      type,
      devise: deviseValide,
      objectif_montant: type === "objectif" ? objectif_montant : null,
      objectif_date: type === "objectif" ? objectif_date : null,
      montant_auto: type === "programmee" ? montant_auto : null,
      frequence_auto: type === "programmee" ? frequence_auto : null,
      source_auto: type === "programmee" ? (source_auto || "wallet") : null,
      prochaine_date_auto,
      bloque_jusqu_a: bloque_jusqu_a || null,
      icone: icone || "💰",
      couleur: couleur || "#6366f1",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ epargne: data }, { status: 201 });
}

// ── DELETE : clôturer un compte ──
export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const epargneId = searchParams.get("id");
  if (!epargneId) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const supabase = getServiceClient();

  // Vérifier que le solde est à 0
  const { data: ep } = await supabase
    .from("epargnes")
    .select("solde, user_id")
    .eq("id", epargneId)
    .single();

  if (!ep || ep.user_id !== user.id) {
    return NextResponse.json({ error: "Compte non trouvé" }, { status: 404 });
  }

  if (Number(ep.solde) > 0) {
    return NextResponse.json(
      { error: "Retirez d'abord tout le solde avant de clôturer" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("epargnes")
    .update({ statut: "cloturee", updated_at: new Date().toISOString() })
    .eq("id", epargneId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
