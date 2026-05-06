export interface MapboxCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapboxPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  place_type?: string[];
}

interface MapboxFeature {
  id: string;
  place_name?: string;
  text?: string;
  center?: [number, number];
  place_type?: string[];
}

export function getMapboxAccessToken() {
  return process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
}

export function getPublicMapboxAccessToken() {
  return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
}

export function isMapboxConfigured() {
  return Boolean(getMapboxAccessToken());
}

export function mapboxFeatureToPlace(feature: MapboxFeature): MapboxPlace | null {
  if (!feature.center || feature.center.length < 2) return null;

  const [longitude, latitude] = feature.center;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    id: feature.id,
    name: feature.text || feature.place_name || "Position",
    address: feature.place_name || feature.text || "Position sélectionnée",
    latitude,
    longitude,
    place_type: feature.place_type,
  };
}

export function browserSupportsGeolocation() {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export function getBrowserPosition(options?: PositionOptions): Promise<MapboxCoordinates> {
  return new Promise((resolve, reject) => {
    if (!browserSupportsGeolocation()) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
        ...options,
      }
    );
  });
}

export function getMapboxDirectionsUrl({
  latitude,
  longitude,
  address,
  origin,
}: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  origin?: MapboxCoordinates | null;
}) {
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    const destination = `${longitude},${latitude}`;
    const params = new URLSearchParams({ destination });
    if (origin) params.set("origin", `${origin.longitude},${origin.latitude}`);
    return `https://www.mapbox.com/directions?${params.toString()}`;
  }

  if (address) {
    return `https://www.mapbox.com/search?query=${encodeURIComponent(address)}`;
  }

  return null;
}
