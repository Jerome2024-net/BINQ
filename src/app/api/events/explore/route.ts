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

    const { data: events, error } = await query;
    if (error) throw error;

    // Fetch organizer info for each unique boutique_id
    const boutiqueIds = Array.from(
      new Set((events || []).map((e: any) => e.boutique_id).filter(Boolean))
    );

    let boutiquesMap: Record<string, any> = {};
    if (boutiqueIds.length > 0) {
      const { data: boutiques } = await supabase
        .from("boutiques")
        .select("id, nom, slug, logo_url, is_verified")
        .in("id", boutiqueIds);

      if (boutiques) {
        for (const b of boutiques) {
          boutiquesMap[b.id] = b;
        }
      }
    }

    // Merge organizer info into events
    const enriched = (events || []).map((e: any) => ({
      ...e,
      boutiques: boutiquesMap[e.boutique_id] || null,
    }));

    return NextResponse.json({ events: enriched });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
