import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── GET : lister mes cagnottes (créées + rejointes) ──
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = getServiceClient();

  // Récupérer toutes les cagnottes où l'utilisateur est membre
  const { data: memberships } = await supabase
    .from("cagnotte_membres")
    .select("cagnotte_id")
    .eq("user_id", user.id);

  const cagnotteIds = memberships?.map((m) => m.cagnotte_id) || [];

  if (cagnotteIds.length === 0) {
    return NextResponse.json({ cagnottes: [] });
  }

  const { data, error } = await supabase
    .from("cagnottes")
    .select(`
      *,
      cagnotte_membres (
        id,
        user_id,
        role,
        total_contribue,
        profiles:user_id ( prenom, nom, avatar_url )
      )
    `)
    .in("id", cagnotteIds)
    .neq("statut", "supprimee")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ajouter le rôle de l'utilisateur courant
  const cagnottes = (data || []).map((c) => ({
    ...c,
    mon_role: c.cagnotte_membres?.find((m: { user_id: string }) => m.user_id === user.id)?.role || "membre",
    nombre_membres: c.cagnotte_membres?.length || 0,
  }));

  return NextResponse.json({ cagnottes });
}

// ── POST : créer une cagnotte ──
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { nom, description, objectif_montant, date_limite, devise, icone, couleur, visibilite_montants } = body;

  if (!nom?.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const deviseValide = ["EUR", "USD"].includes(devise) ? devise : "EUR";
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();

  const supabase = getServiceClient();

  // Vérifier max 5 cagnottes créées
  const { count } = await supabase
    .from("cagnottes")
    .select("id", { count: "exact", head: true })
    .eq("createur_id", user.id)
    .neq("statut", "supprimee");

  if ((count || 0) >= 5) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas créer plus de 5 cagnottes" },
      { status: 400 }
    );
  }

  // Créer la cagnotte
  const { data: cagnotte, error } = await supabase
    .from("cagnottes")
    .insert({
      createur_id: user.id,
      nom: nom.trim(),
      description: description?.trim() || null,
      objectif_montant: objectif_montant ? Number(objectif_montant) : null,
      date_limite: date_limite || null,
      devise: deviseValide,
      icone: icone || "🎯",
      couleur: couleur || "#6366f1",
      code_invitation: code,
      visibilite_montants: visibilite_montants !== false,
      solde: 0,
      statut: "active",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ajouter le créateur comme membre admin
  await supabase.from("cagnotte_membres").insert({
    cagnotte_id: cagnotte.id,
    user_id: user.id,
    role: "admin",
    total_contribue: 0,
  });

  return NextResponse.json({ cagnotte, code }, { status: 201 });
}
