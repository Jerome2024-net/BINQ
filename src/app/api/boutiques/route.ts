import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { generateQRCode } from "@/lib/qr-universal";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/boutiques — Liste publique (avec filtres)
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(req.url);
    const categorie = searchParams.get("categorie");
    const search = searchParams.get("search");
    const ville = searchParams.get("ville");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("boutiques")
      .select(`
        *,
        categorie:categories(nom, slug, icone),
        produits:produits(count)
      `, { count: "exact" })
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (categorie) {
      // Lookup category id by slug
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorie)
        .single();
      if (cat) query = query.eq("categorie_id", cat.id);
    }

    if (search) {
      query = query.or(`nom.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (ville) {
      query = query.ilike("ville", `%${ville}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ boutiques: data, total: count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/boutiques — Créer une boutique
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const body = await req.json();
    const { nom, description, categorie_id, telephone, whatsapp, adresse, ville, devise } = body;

    if (!nom || nom.trim().length < 2) {
      return NextResponse.json({ error: "Nom de boutique requis (min 2 caractères)" }, { status: 400 });
    }

    // Check if user already has a boutique
    const { data: existing } = await supabase
      .from("boutiques")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Vous avez déjà une boutique" }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = nom
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    
    let slug = baseSlug;
    let counter = 0;
    while (true) {
      const { data: slugCheck } = await supabase
        .from("boutiques")
        .select("id")
        .eq("slug", slug)
        .single();
      if (!slugCheck) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Get user profile for verification
    const { data: profile } = await supabase
      .from("profiles")
      .select("prenom, nom, is_merchant")
      .eq("id", user.id)
      .single();

    const { data: boutique, error } = await supabase
      .from("boutiques")
      .insert({
        user_id: user.id,
        nom: nom.trim(),
        slug,
        description: description?.trim() || null,
        categorie_id: categorie_id || null,
        telephone: telephone?.trim() || null,
        whatsapp: whatsapp?.trim() || null,
        adresse: adresse?.trim() || null,
        ville: ville?.trim() || null,
        devise: devise || "XOF",
        is_verified: profile?.is_merchant || false,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-generate universal QR code for the boutique
    if (boutique) {
      await supabase.from("qr_codes").insert({
        code: generateQRCode(),
        type: "boutique",
        boutique_id: boutique.id,
        user_id: user.id,
        label: boutique.nom,
      });
    }

    return NextResponse.json({ boutique }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
