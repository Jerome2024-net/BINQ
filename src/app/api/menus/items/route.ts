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

// POST /api/menus/items — ajouter un item
export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseService();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { section_id, nom, description, prix, image_url, allergenes, is_vegetarien, ordre } = body;

    // Récupérer la section → menu → boutique pour vérifier ownership + boutique_id
    const { data: section } = await supabase
      .from("menu_sections")
      .select("id, menu:menus!inner(boutique_id, boutiques:boutiques!inner(user_id, devise))")
      .eq("id", section_id)
      .single();

    if (!section || (section as any).menu?.boutiques?.user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const boutique_id = (section as any).menu.boutique_id;
    const devise = (section as any).menu.boutiques.devise || "XOF";

    const { data: item, error } = await supabase
      .from("menu_items")
      .insert({
        section_id,
        boutique_id,
        nom,
        description: description || null,
        prix: parseFloat(prix) || 0,
        devise,
        image_url: image_url || null,
        allergenes: allergenes || null,
        is_vegetarien: is_vegetarien || false,
        ordre: ordre ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ item }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/menus/items — modifier un item
export async function PUT(req: NextRequest) {
  try {
    const supabase = supabaseService();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { id, nom, description, prix, image_url, allergenes, is_vegetarien, is_disponible, ordre } = body;

    // Vérifier ownership
    const { data: item } = await supabase
      .from("menu_items")
      .select("id, boutique:boutiques!inner(user_id)")
      .eq("id", id)
      .single();

    if (!item || (item as any).boutique?.user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (nom !== undefined) updates.nom = nom;
    if (description !== undefined) updates.description = description;
    if (prix !== undefined) updates.prix = parseFloat(prix);
    if (image_url !== undefined) updates.image_url = image_url;
    if (allergenes !== undefined) updates.allergenes = allergenes;
    if (is_vegetarien !== undefined) updates.is_vegetarien = is_vegetarien;
    if (is_disponible !== undefined) updates.is_disponible = is_disponible;
    if (ordre !== undefined) updates.ordre = ordre;

    const { data, error } = await supabase
      .from("menu_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/menus/items?id=...
export async function DELETE(req: NextRequest) {
  try {
    const supabase = supabaseService();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const { data: item } = await supabase
      .from("menu_items")
      .select("id, boutique:boutiques!inner(user_id)")
      .eq("id", id)
      .single();

    if (!item || (item as any).boutique?.user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
