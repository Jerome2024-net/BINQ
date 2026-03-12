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

// GET /api/produits/[id] — Détail d'un produit
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceClient();

    const { data: produit, error } = await supabase
      .from("produits")
      .select(`
        *,
        boutique:boutiques(id, nom, slug, logo_url, is_verified, ville, whatsapp, telephone, user_id)
      `)
      .eq("id", params.id)
      .eq("is_active", true)
      .single();

    if (error || !produit) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    // Increment views
    await supabase
      .from("produits")
      .update({ vues: (produit.vues || 0) + 1 })
      .eq("id", produit.id);

    return NextResponse.json({ produit });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/produits/[id] — Modifier un produit
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const body = await req.json();

    // Verify ownership via boutique
    const { data: produit } = await supabase
      .from("produits")
      .select("id, boutique_id, boutique:boutiques(user_id)")
      .eq("id", params.id)
      .single();

    if (!produit || (produit as any).boutique?.user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    const allowed = ["nom", "description", "prix", "prix_barre", "image_url", "categorie", "stock", "is_active", "ordre"];
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from("produits")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ produit: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/produits/[id] — Supprimer un produit
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();

    // Verify ownership
    const { data: produit } = await supabase
      .from("produits")
      .select("id, boutique:boutiques(user_id)")
      .eq("id", params.id)
      .single();

    if (!produit || (produit as any).boutique?.user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { error } = await supabase
      .from("produits")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
