import { NextRequest, NextResponse } from "next/server";
import { getMapboxAccessToken, mapboxFeatureToPlace } from "@/lib/mapbox";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = getMapboxAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Mapbox non configuré" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const latitude = Number(searchParams.get("latitude"));
  const longitude = Number(searchParams.get("longitude"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "Coordonnées invalides" }, { status: 400 });
  }

  const params = new URLSearchParams({
    access_token: token,
    language: searchParams.get("language") || "fr",
    limit: "1",
    types: searchParams.get("types") || "address,poi,place,locality,neighborhood",
  });

  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?${params.toString()}`;
  const response = await fetch(endpoint, { next: { revalidate: 60 } });
  const payload = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: payload?.message || "Erreur Mapbox" }, { status: response.status });
  }

  const place = mapboxFeatureToPlace(payload.features?.[0]) || {
    id: `coords:${latitude},${longitude}`,
    name: "Position actuelle",
    address: `Position actuelle (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
    latitude,
    longitude,
  };

  return NextResponse.json({ place });
}
