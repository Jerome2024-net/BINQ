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

// GET /api/menus?boutique_id=...  — public: menu actif d'une boutique
// POST /api/menus — créer un menu (owner)
export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseService();
    const boutiqueId = req.nextUrl.searchParams.get("boutique_id");

    if (!boutiqueId) {
      return NextResponse.json({ error: "boutique_id requis" }, { status: 400 });
    }

    const { data: menus, error } = await supabase
      .from("menus")
      .select(`
        *,
        menu_sections (
          *,
          menu_items (*)
        )
      `)
      .eq("boutique_id", boutiqueId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Sort sections and items by ordre
    for (const menu of menus || []) {
      if (menu.menu_sections) {
        menu.menu_sections.sort((a: any, b: any) => (a.ordre || 0) - (b.ordre || 0));
        for (const section of menu.menu_sections) {
          if (section.menu_items) {
            section.menu_items.sort((a: any, b: any) => (a.ordre || 0) - (b.ordre || 0));
          }
        }
      }
    }

    return NextResponse.json({ menus: menus || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseService();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { boutique_id, nom, description } = body;

    // Vérifier que l'utilisateur possède la boutique
    const { data: boutique } = await supabase
      .from("boutiques")
      .select("id")
      .eq("id", boutique_id)
      .eq("user_id", user.id)
      .single();

    if (!boutique) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    const { data: menu, error } = await supabase
      .from("menus")
      .insert({
        boutique_id,
        nom: nom || "Menu principal",
        description: description || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ menu }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
