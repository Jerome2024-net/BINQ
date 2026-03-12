import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/api-auth";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/produits — Liste publique (avec filtres)
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(req.url);
    const boutique_id = searchParams.get("boutique_id");
    const search = searchParams.get("search");
    const categorie = searchParams.get("categorie");
    const min = searchParams.get("min");
    const max = searchParams.get("max");
    const sort = searchParams.get("sort") || "recent";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("produits")
      .select(`
        *,
        boutique:boutiques!inner(id, nom, slug, logo_url, is_verified, ville)
      `, { count: "exact" })
      .eq("is_active", true)
      .eq("boutiques.is_active", true)
      .range(offset, offset + limit - 1);

    if (boutique_id) query = query.eq("boutique_id", boutique_id);
    if (search) query = query.or(`nom.ilike.%${search}%,description.ilike.%${search}%`);
    if (categorie) query = query.ilike("categorie", `%${categorie}%`);
    if (min) query = query.gte("prix", parseFloat(min));
    if (max) query = query.lte("prix", parseFloat(max));

    switch (sort) {
      case "prix-asc": query = query.order("prix", { ascending: true }); break;
      case "prix-desc": query = query.order("prix", { ascending: false }); break;
      case "populaire": query = query.order("ventes", { ascending: false }); break;
      default: query = query.order("created_at", { ascending: false });
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ produits: data, total: count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/produits — Ajouter un produit
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const body = await req.json();
    const { nom, description, prix, prix_barre, image_url, categorie, stock } = body;

    if (!nom || !prix || prix <= 0) {
      return NextResponse.json({ error: "Nom et prix requis" }, { status: 400 });
    }

    // Get user's boutique
    const { data: boutique } = await supabase
      .from("boutiques")
      .select("id, devise")
      .eq("user_id", user.id)
      .single();

    if (!boutique) {
      return NextResponse.json({ error: "Vous devez d'abord créer une boutique" }, { status: 400 });
    }

    // Check product limit (free tier = 20)
    const { count } = await supabase
      .from("produits")
      .select("id", { count: "exact" })
      .eq("boutique_id", boutique.id);

    if ((count || 0) >= 20) {
      return NextResponse.json({ error: "Limite de 20 produits atteinte" }, { status: 400 });
    }

    const { data: produit, error } = await supabase
      .from("produits")
      .insert({
        boutique_id: boutique.id,
        nom: nom.trim(),
        description: description?.trim() || null,
        prix: parseFloat(prix),
        prix_barre: prix_barre ? parseFloat(prix_barre) : null,
        devise: boutique.devise || "XOF",
        image_url: image_url || null,
        categorie: categorie?.trim() || null,
        stock: stock !== undefined ? parseInt(stock) : null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ produit }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
