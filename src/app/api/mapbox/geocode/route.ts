import { NextRequest, NextResponse } from "next/server";
import { getMapboxAccessToken, mapboxFeatureToPlace } from "@/lib/mapbox";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = getMapboxAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Mapbox non configuré" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const query = String(searchParams.get("q") || "").trim();
  if (query.length < 2) {
    return NextResponse.json({ places: [] });
  }

  const params = new URLSearchParams({
    access_token: token,
    language: searchParams.get("language") || "fr",
    limit: searchParams.get("limit") || "6",
    types: searchParams.get("types") || "address,poi,place,locality,neighborhood",
  });

  const country = searchParams.get("country") || process.env.MAPBOX_COUNTRY_CODES;
  if (country) params.set("country", country.toLowerCase());

  const proximity = searchParams.get("proximity");
  if (proximity) params.set("proximity", proximity);

  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
  const response = await fetch(endpoint, { next: { revalidate: 60 } });
  const payload = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: payload?.message || "Erreur Mapbox" }, { status: response.status });
  }

  const places = (payload.features || [])
    .map(mapboxFeatureToPlace)
    .filter(Boolean);

  return NextResponse.json({ places });
}
