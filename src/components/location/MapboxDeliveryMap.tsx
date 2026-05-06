"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Loader2, LocateFixed, Navigation } from "lucide-react";
import {
  getBrowserPosition,
  getMapboxDirectionsUrl,
  getPublicMapboxAccessToken,
  type MapboxCoordinates,
} from "@/lib/mapbox";

interface MapboxDeliveryMapProps {
  clientLatitude: number;
  clientLongitude: number;
  clientAddress?: string | null;
  className?: string;
}

const routeSourceId = "delivery-route";
const routeLayerId = "delivery-route-line";

export default function MapboxDeliveryMap({
  clientLatitude,
  clientLongitude,
  clientAddress,
  className = "",
}: MapboxDeliveryMapProps) {
  const token = getPublicMapboxAccessToken();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const clientMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [driverPosition, setDriverPosition] = useState<MapboxCoordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const directionsUrl = getMapboxDirectionsUrl({
    latitude: clientLatitude,
    longitude: clientLongitude,
    address: clientAddress || undefined,
    origin: driverPosition || undefined,
  });

  const updateRoute = useCallback((driver: MapboxCoordinates | null) => {
    const map = mapRef.current;
    if (!map || !driver) return;

    const route = {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [driver.longitude, driver.latitude],
          [clientLongitude, clientLatitude],
        ],
      },
      properties: {},
    };

    const source = map.getSource(routeSourceId) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(route);
      return;
    }

    const addRoute = () => {
      if (map.getSource(routeSourceId)) return;
      map.addSource(routeSourceId, { type: "geojson", data: route });
      map.addLayer({
        id: routeLayerId,
        type: "line",
        source: routeSourceId,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#2563eb", "line-width": 4, "line-opacity": 0.8 },
      });
    };

    if (map.isStyleLoaded()) addRoute();
    else map.once("load", addRoute);
  }, [clientLatitude, clientLongitude]);

  const fitMap = useCallback((driver: MapboxCoordinates | null) => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = new mapboxgl.LngLatBounds([clientLongitude, clientLatitude], [clientLongitude, clientLatitude]);
    if (driver) bounds.extend([driver.longitude, driver.latitude]);
    map.fitBounds(bounds, { padding: 56, maxZoom: driver ? 15 : 16, duration: 900 });
  }, [clientLatitude, clientLongitude]);

  useEffect(() => {
    if (!token || !mapContainerRef.current) return;

    mapboxgl.accessToken = token;
    const clientCenter: [number, number] = [clientLongitude, clientLatitude];

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: clientCenter,
      zoom: 15,
      attributionControl: false,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    clientMarkerRef.current = new mapboxgl.Marker({ color: "#ef4444" })
      .setLngLat(clientCenter)
      .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(clientAddress || "Position client"))
      .addTo(mapRef.current);

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      clientMarkerRef.current?.remove();
      driverMarkerRef.current?.remove();
      mapRef.current?.remove();
    };
  }, [clientAddress, clientLatitude, clientLongitude, token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !driverPosition) return;

    const driverCenter: [number, number] = [driverPosition.longitude, driverPosition.latitude];
    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new mapboxgl.Marker({ color: "#2563eb" })
        .setLngLat(driverCenter)
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setText("Votre position"))
        .addTo(map);
    } else {
      driverMarkerRef.current.setLngLat(driverCenter);
    }

    updateRoute(driverPosition);
    fitMap(driverPosition);
  }, [driverPosition, fitMap, updateRoute]);

  const locateOnce = async () => {
    setLocating(true);
    setError("");
    try {
      const coords = await getBrowserPosition();
      setDriverPosition(coords);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de récupérer votre position.");
    } finally {
      setLocating(false);
    }
  };

  const startLiveTracking = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    setLocating(true);
    setError("");
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setDriverPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      (geoError) => {
        setError(geoError.message || "Impossible de suivre votre position.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 }
    );
  };

  if (!token) {
    return (
      <div className={`rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-700 ${className}`}>
        Mapbox n&apos;est pas configuré. Ajoutez `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div ref={mapContainerRef} className="h-72 rounded-3xl overflow-hidden border border-blue-100 bg-blue-50" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={locateOnce}
          disabled={locating}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-blue-700 hover:bg-blue-100 disabled:opacity-60"
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          Ma position
        </button>
        <button
          type="button"
          onClick={startLiveTracking}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700 hover:bg-emerald-100"
        >
          <Navigation className="w-4 h-4" /> Suivi live
        </button>
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-xs font-black text-white hover:bg-neutral-800"
          >
            <Navigation className="w-4 h-4" /> Itinéraire
          </a>
        )}
      </div>

      {error && <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}
      <p className="rounded-2xl bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
        Point rouge : client · point bleu : votre position livreur.
      </p>
    </div>
  );
}
