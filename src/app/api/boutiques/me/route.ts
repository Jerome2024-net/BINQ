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

    // Get QR codes for products
    const produitIds = (produits || []).map((p: any) => p.id);
    let qrMap: Record<string, string> = {};
    if (produitIds.length > 0) {
      const { data: qrCodes } = await supabase
        .from("qr_codes")
        .select("code, produit_id")
        .in("produit_id", produitIds)
        .eq("type", "produit")
        .eq("is_active", true);
      if (qrCodes) {
        for (const qr of qrCodes) {
          if (qr.produit_id) qrMap[qr.produit_id] = qr.code;
        }
      }
    }

    // Merge QR codes into products
    const produitsWithQR = (produits || []).map((p: any) => ({
      ...p,
      qr_code: qrMap[p.id] || null,
    }));

    // Get stats
    const { data: commandes, count } = await supabase
      .from("commandes")
      .select("montant, montant_marchand, sous_total, frais_livraison", { count: "exact" })
      .eq("vendeur_id", user.id)
      .eq("statut", "payee");

    const totalVentes = commandes?.reduce((s, c: any) => {
      const merchantAmount = c.montant_marchand ?? (Number(c.sous_total || 0) + Number(c.frais_livraison || 0));
      return s + Number(merchantAmount || c.montant || 0);
    }, 0) || 0;

    return NextResponse.json({
      boutique,
      produits: produitsWithQR,
      stats: {
        totalProduits: produitsWithQR.length,
        totalCommandes: count || 0,
        totalVentes,
        vues: boutique.vues || 0,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
