import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = getServiceClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "acheteur"; // "acheteur" or "vendeur"
    const statut = searchParams.get("statut");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("commandes")
      .select(`
        *,
        produit:produits(id, nom, image_url, prix, devise),
        boutique:boutiques(id, nom, slug, logo_url)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (role === "vendeur") {
      query = query.eq("vendeur_id", user.id);
    } else {
      query = query.eq("acheteur_id", user.id);
    }

    if (statut) {
      query = query.eq("statut", statut);
    }

    const { data: commandes, error } = await query;

    if (error) {
      console.error("Commandes fetch error:", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    // Get stats
    const { data: achatsData } = await supabase
      .from("commandes")
      .select("montant")
      .eq("acheteur_id", user.id);

    const { data: ventesData } = await supabase
      .from("commandes")
      .select("montant")
      .eq("vendeur_id", user.id);

    const totalAchats = achatsData?.reduce((s, c) => s + Number(c.montant), 0) || 0;
    const totalVentes = ventesData?.reduce((s, c) => s + Number(c.montant), 0) || 0;
    const nbAchats = achatsData?.length || 0;
    const nbVentes = ventesData?.length || 0;

    return NextResponse.json({
      commandes: commandes || [],
      stats: { totalAchats, totalVentes, nbAchats, nbVentes },
    });
  } catch (err) {
    console.error("Commandes error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
