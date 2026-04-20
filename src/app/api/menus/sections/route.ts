import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/api-auth";

function supabaseService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/menus/sections — ajouter une section au menu
export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseService();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { menu_id, nom, description, ordre } = body;

    // Vérifier ownership: menu → boutique → user
    const { data: menu } = await supabase
      .from("menus")
      .select("id, boutique_id, boutiques!inner(user_id)")
      .eq("id", menu_id)
      .single();

    if (!menu || (menu as any).boutiques?.user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { data: section, error } = await supabase
      .from("menu_sections")
      .insert({
        menu_id,
        nom,
        description: description || null,
        ordre: ordre ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ section }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/menus/sections — modifier une section
export async function PUT(req: NextRequest) {
  try {
    const supabase = supabaseService();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { id, nom, description, ordre, is_active } = body;

    // Vérifier ownership
    const { data: section } = await supabase
      .from("menu_sections")
      .select("id, menu:menus!inner(boutique_id, boutiques:boutiques!inner(user_id))")
      .eq("id", id)
      .single();

    if (!section || (section as any).menu?.boutiques?.user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const updates: any = {};
    if (nom !== undefined) updates.nom = nom;
    if (description !== undefined) updates.description = description;
    if (ordre !== undefined) updates.ordre = ordre;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from("menu_sections")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ section: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/menus/sections?id=...
export async function DELETE(req: NextRequest) {
  try {
    const supabase = supabaseService();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    // Vérifier ownership
    const { data: section } = await supabase
      .from("menu_sections")
      .select("id, menu:menus!inner(boutique_id, boutiques:boutiques!inner(user_id))")
      .eq("id", id)
      .single();

    if (!section || (section as any).menu?.boutiques?.user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { error } = await supabase.from("menu_sections").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
