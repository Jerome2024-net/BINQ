import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/events/explore — Public: upcoming published events + filters
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const ville = searchParams.get("ville") || "";
    const categorieSlug = searchParams.get("categorie") || "";
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const meta = searchParams.get("meta"); // if "1", also return cities list

    const today = new Date().toISOString().split("T")[0];

    // If filtering by category, first get boutique_ids in that category
    let categoryBoutiqueIds: string[] | null = null;
    if (categorieSlug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorieSlug)
        .single();

      if (cat) {
        const { data: catBoutiques } = await supabase
          .from("boutiques")
          .select("id")
          .eq("categorie_id", cat.id);

        categoryBoutiqueIds = (catBoutiques || []).map((b: any) => b.id);
        if (categoryBoutiqueIds.length === 0) {
          // No boutiques in this category → return empty
          const result: any = { events: [], hasMore: false };
          if (meta === "1") {
            const cities = await getDistinctCities(supabase, today);
            result.cities = cities;
          }
          return NextResponse.json(result);
        }
      }
    }

    let query = supabase
      .from("events")
      .select(
        "id, nom, description, date_debut, heure_debut, date_fin, lieu, ville, cover_url, logo_url, devise, total_vendu, boutique_id"
      )
      .eq("is_published", true)
      .eq("is_active", true)
      .gte("date_debut", today)
      .order("date_debut", { ascending: true })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `nom.ilike.%${search}%,description.ilike.%${search}%,lieu.ilike.%${search}%,ville.ilike.%${search}%`
      );
    }

    if (ville) {
      query = query.ilike("ville", `%${ville}%`);
    }

    if (categoryBoutiqueIds) {
      query = query.in("boutique_id", categoryBoutiqueIds);
    }

    const { data: events, error } = await query;
    if (error) throw error;

    const eventIds = (events || []).map((e: any) => e.id);

    // Fetch organizer info
    const boutiqueIds = Array.from(
      new Set((events || []).map((e: any) => e.boutique_id).filter(Boolean))
    );

    let boutiquesMap: Record<string, any> = {};
    if (boutiqueIds.length > 0) {
      const { data: boutiques } = await supabase
        .from("boutiques")
        .select("id, nom, slug, logo_url, is_verified, categorie_id")
        .in("id", boutiqueIds);

      if (boutiques) {
        for (const b of boutiques) {
          boutiquesMap[b.id] = b;
        }
      }
    }

    // Fetch ticket_types for pricing & capacity
    let ticketMap: Record<string, { min_price: number; total_capacity: number; total_sold: number }> = {};
    if (eventIds.length > 0) {
      const { data: ticketTypes } = await supabase
        .from("ticket_types")
        .select("event_id, prix, quantite_total, quantite_vendue, is_active")
        .in("event_id", eventIds)
        .eq("is_active", true);

      if (ticketTypes) {
        for (const tt of ticketTypes) {
          if (!ticketMap[tt.event_id]) {
            ticketMap[tt.event_id] = { min_price: Infinity, total_capacity: 0, total_sold: 0 };
          }
          const price = parseFloat(tt.prix) || 0;
          if (price < ticketMap[tt.event_id].min_price) {
            ticketMap[tt.event_id].min_price = price;
          }
          ticketMap[tt.event_id].total_capacity += tt.quantite_total || 0;
          ticketMap[tt.event_id].total_sold += tt.quantite_vendue || 0;
        }
      }
    }

    const enriched = (events || []).map((e: any) => {
      const tk = ticketMap[e.id];
      return {
        ...e,
        boutiques: boutiquesMap[e.boutique_id] || null,
        min_price: tk ? (tk.min_price === Infinity ? 0 : tk.min_price) : 0,
        total_capacity: tk ? tk.total_capacity : 0,
        total_sold: tk ? tk.total_sold : 0,
      };
    });

    const hasMore = (events || []).length === limit;

    const result: any = { events: enriched, hasMore };

    // Optionally return distinct cities for filter UI
    if (meta === "1") {
      const cities = await getDistinctCities(supabase, today);
      result.cities = cities;
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

async function getDistinctCities(supabase: any, today: string) {
  const { data } = await supabase
    .from("events")
    .select("ville")
    .eq("is_published", true)
    .eq("is_active", true)
    .gte("date_debut", today)
    .not("ville", "is", null);

  if (!data) return [];

  const unique = Array.from(new Set(data.map((d: any) => d.ville?.trim()).filter(Boolean)));
  return unique.sort();
}
