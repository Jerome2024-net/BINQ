"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { getBrowserPosition, getPublicMapboxAccessToken, type MapboxPlace } from "@/lib/mapbox";

interface MapboxAddressPickerProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: MapboxPlace | null) => void;
  placeholder?: string;
  className?: string;
}

export default function MapboxAddressPicker({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Quartier, rue, repère...",
  className = "",
}: MapboxAddressPickerProps) {
  const token = getPublicMapboxAccessToken();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [places, setPlaces] = useState<MapboxPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<MapboxPlace | null>(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3 || selectedPlace?.address === query) {
      setPlaces([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/mapbox/geocode?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json();
        if (res.ok) setPlaces(data.places || []);
      } catch {
        if (!controller.signal.aborted) setPlaces([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [selectedPlace?.address, value]);

  useEffect(() => {
    if (!token || !selectedPlace || !mapContainerRef.current) return;

    mapboxgl.accessToken = token;
    const center: [number, number] = [selectedPlace.longitude, selectedPlace.latitude];

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center,
        zoom: 15,
        attributionControl: false,
      });
      mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    } else {
      mapRef.current.flyTo({ center, zoom: 15, essential: true });
    }

    if (!markerRef.current) {
      markerRef.current = new mapboxgl.Marker({ color: "#2563eb" }).setLngLat(center).addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat(center);
    }
  }, [selectedPlace, token]);

  useEffect(() => () => {
    markerRef.current?.remove();
    mapRef.current?.remove();
  }, []);

  const selectPlace = (place: MapboxPlace) => {
    setSelectedPlace(place);
    setPlaces([]);
    setError("");
    onChange(place.address);
    onPlaceSelect?.(place);
  };

  const clearPlace = () => {
    setSelectedPlace(null);
    setPlaces([]);
    setError("");
    onChange("");
    onPlaceSelect?.(null);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    setError("");
    try {
      const coords = await getBrowserPosition();
      const res = await fetch(`/api/mapbox/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Adresse introuvable");
      selectPlace(data.place);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de récupérer votre position.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-300" />
        <textarea
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setSelectedPlace(null);
            onPlaceSelect?.(null);
          }}
          placeholder={placeholder}
          rows={2}
          className="w-full pl-9 pr-10 py-3 rounded-xl bg-white border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
        />
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {searching && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
          {value && (
            <button type="button" onClick={clearPlace} className="p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-blue-700 border border-blue-100 hover:bg-blue-50 disabled:opacity-60"
      >
        {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
        Utiliser ma position actuelle
      </button>

      {error && <p className="text-xs font-semibold text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      {places.length > 0 && (
        <div className="rounded-2xl bg-white border border-blue-100 shadow-sm overflow-hidden">
          {places.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => selectPlace(place)}
              className="w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-blue-50 border-b border-blue-50 last:border-b-0"
            >
              <Search className="w-4 h-4 text-blue-500 mt-0.5" />
              <span>
                <span className="block text-sm font-bold text-gray-900">{place.name}</span>
                <span className="block text-xs text-gray-500">{place.address}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedPlace && token && (
        <div ref={mapContainerRef} className="h-36 rounded-2xl overflow-hidden border border-blue-100 bg-blue-50" />
      )}

      {selectedPlace && (
        <p className="text-[11px] font-semibold text-blue-700 bg-blue-50 rounded-xl px-3 py-2">
          Position confirmée : {selectedPlace.latitude.toFixed(5)}, {selectedPlace.longitude.toFixed(5)}
        </p>
      )}
    </div>
  );
}
