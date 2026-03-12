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

// GET /api/boutiques/me — Ma boutique
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();

    const { data: boutique } = await supabase
      .from("boutiques")
      .select(`
        *,
        categorie:categories(nom, slug, icone)
      `)
      .eq("user_id", user.id)
      .single();

    if (!boutique) {
      return NextResponse.json({ boutique: null });
    }

    // Get products
    const { data: produits } = await supabase
      .from("produits")
      .select("*")
      .eq("boutique_id", boutique.id)
      .order("ordre", { ascending: true })
      .order("created_at", { ascending: false });

    // Get stats
    const { data: commandes, count } = await supabase
      .from("commandes")
      .select("montant", { count: "exact" })
      .eq("vendeur_id", user.id)
      .eq("statut", "payee");

    const totalVentes = commandes?.reduce((s, c) => s + Number(c.montant), 0) || 0;

    return NextResponse.json({
      boutique,
      produits: produits || [],
      stats: {
        totalProduits: produits?.length || 0,
        totalCommandes: count || 0,
        totalVentes,
        vues: boutique.vues || 0,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
