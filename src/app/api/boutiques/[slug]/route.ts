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

// GET /api/boutiques/[slug] — Détail public d'une boutique
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = getServiceClient();
    const slug = params.slug;

    const { data: boutique, error } = await supabase
      .from("boutiques")
      .select(`
        *,
        categorie:categories(nom, slug, icone),
        owner:profiles!boutiques_user_id_fkey(prenom, nom, avatar_url)
      `)
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !boutique) {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }

    // Increment views
    await supabase
      .from("boutiques")
      .update({ vues: (boutique.vues || 0) + 1 })
      .eq("id", boutique.id);

    // Get products
    const { data: produits } = await supabase
      .from("produits")
      .select("*")
      .eq("boutique_id", boutique.id)
      .eq("is_active", true)
      .order("ordre", { ascending: true })
      .order("created_at", { ascending: false });

    return NextResponse.json({ boutique, produits: produits || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/boutiques/[slug] — Modifier sa boutique
export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const body = await req.json();

    // Verify ownership
    const { data: boutique } = await supabase
      .from("boutiques")
      .select("id, user_id")
      .eq("slug", params.slug)
      .single();

    if (!boutique || boutique.user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    const allowed = ["nom", "description", "categorie_id", "telephone", "whatsapp", "adresse", "ville", "logo_url", "banner_url"];
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from("boutiques")
      .update(updates)
      .eq("id", boutique.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ boutique: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
