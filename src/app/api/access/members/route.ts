import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

function generateAccessCode(): string {
  return "BA-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

// GET — Liste des membres (optionnel: ?space_id=...)
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get("space_id");

    let query = supabase()
      .from("access_members")
      .select("*, access_spaces!inner(nom)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (spaceId) {
      query = query.eq("space_id", spaceId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// POST — Ajouter un membre
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const { space_id, nom, prenom, email, telephone, role, date_debut, date_fin } = body;

    if (!space_id || !nom?.trim() || !prenom?.trim()) {
      return NextResponse.json({ error: "Espace, nom et prénom requis" }, { status: 400 });
    }

    // Vérifier que l'espace appartient à l'utilisateur
    const { data: space } = await supabase()
      .from("access_spaces")
      .select("id")
      .eq("id", space_id)
      .eq("user_id", user.id)
      .single();

    if (!space) {
      return NextResponse.json({ error: "Espace non trouvé" }, { status: 404 });
    }

    const qr_code = generateAccessCode();

    const { data, error } = await supabase()
      .from("access_members")
      .insert({
        space_id,
        user_id: user.id,
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email?.trim() || null,
        telephone: telephone?.trim() || null,
        role: role || "employé",
        qr_code,
        date_debut: date_debut || null,
        date_fin: date_fin || null,
      })
      .select("*, access_spaces!inner(nom)")
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// PUT — Modifier un membre
export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const { data, error } = await supabase()
      .from("access_members")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*, access_spaces!inner(nom)")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Supprimer un membre
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const { error } = await supabase()
      .from("access_members")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
