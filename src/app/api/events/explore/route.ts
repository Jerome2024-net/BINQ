import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/events/explore — Public: liste des événements publiés & actifs (à venir uniquement)
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const ville = searchParams.get("ville") || "";
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // Today's date in YYYY-MM-DD for filtering past events
    const today = new Date().toISOString().split("T")[0];

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

    const { data: events, error } = await query;
    if (error) throw error;

    const eventIds = (events || []).map((e: any) => e.id);

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

    // Fetch ticket_types for pricing & capacity info
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

    // Merge all info into events
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

    // Check if there are more events beyond this page
    const hasMore = (events || []).length === limit;

    return NextResponse.json({ events: enriched, hasMore });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
