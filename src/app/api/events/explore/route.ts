import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/events/explore — Public: liste des événements publiés & actifs
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const ville = searchParams.get("ville") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 50);

    let query = supabase
      .from("events")
      .select(
        "id, nom, description, date_debut, heure_debut, date_fin, lieu, ville, cover_url, logo_url, devise, total_vendu, boutique_id"
      )
      .eq("is_published", true)
      .eq("is_active", true)
      .order("date_debut", { ascending: true })
      .limit(limit);

    if (search) {
      query = query.or(
        `nom.ilike.%${search}%,description.ilike.%${search}%,lieu.ilike.%${search}%,ville.ilike.%${search}%`
      );
    }

    if (ville) {
      query = query.ilike("ville", `%${ville}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ events: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
