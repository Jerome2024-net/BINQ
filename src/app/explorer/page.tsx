"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  CalendarDays,
  ArrowRight,
  Loader2,
  Star,
  X,
  Menu,
  Compass,
} from "lucide-react";

interface EventPublic {
  id: string;
  nom: string;
  description: string | null;
  date_debut: string;
  heure_debut: string | null;
  date_fin: string | null;
  lieu: string;
  ville: string | null;
  cover_url: string | null;
  logo_url: string | null;
  devise: string;
  total_vendu: number;
  boutique_id: string;
  boutiques: {
    nom: string;
    slug: string;
    logo_url: string | null;
    is_verified: boolean;
  } | null;
}

const CITIES = ["Cotonou"];

function formatDate(dateStr: string, heureStr?: string | null) {
  const d = new Date(dateStr + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
  };
  let formatted = d.toLocaleDateString("fr-FR", opts);
  if (heureStr) {
    formatted += ` · ${heureStr.slice(0, 5)}`;
  }
  return formatted;
}

export default function ExplorerPublicPage() {
  const [events, setEvents] = useState<EventPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchEvents = async (search?: string, ville?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (ville) params.set("ville", ville);
      params.set("limit", "30");
      const res = await fetch(`/api/events/explore?${params}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchEvents(searchQuery, selectedCity || undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity]);

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-neutral-900">
      {/* ═══════ HEADER ═══════ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="font-semibold text-[15px] tracking-tight text-neutral-900">
                Binq
              </span>
            </Link>
            <span className="hidden sm:block text-[13px] text-blue-600 font-semibold">
              Explorer
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/connexion"
              className="text-[13px] text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="hidden sm:inline-flex text-[13px] px-4 py-1.5 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              Créer un événement
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="sm:hidden p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden bg-white border-t border-neutral-100 pb-4 pt-3 px-5 animate-fade-in">
            <div className="flex flex-col gap-1">
              <Link
                href="/connexion"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-50 text-sm transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg bg-blue-600 text-white text-sm text-center font-medium"
              >
                Créer un événement
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="pt-12 sm:pt-20 pb-8 sm:pb-12">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
            <Compass className="w-3.5 h-3.5" />
            Découvrir
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-neutral-900">
            Découvrez les événements
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
            Explorez les événements populaires près de chez vous, parcourez par
            ville ou recherchez ce qui vous inspire.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Rechercher un événement, un lieu, une ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-11 pr-10 py-3.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ CITY PILLS ═══════ */}
      <section className="pb-8 sm:pb-12">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Explorer par ville
          </h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCity(null)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                !selectedCity
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Toutes les villes
            </button>
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() =>
                  setSelectedCity(selectedCity === city ? null : city)
                }
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all flex items-center gap-1.5 ${
                  selectedCity === city
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <MapPin className="w-3 h-3" />
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ EVENTS GRID ═══════ */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-7 h-7 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                Aucun événement trouvé
              </h3>
              <p className="text-sm text-neutral-400 max-w-xs mx-auto mb-6">
                {searchQuery || selectedCity
                  ? "Essayez une autre recherche ou une autre ville."
                  : "Il n'y a pas encore d'événements publiés. Revenez bientôt !"}
              </p>
              {(searchQuery || selectedCity) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCity(null);
                  }}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
                  {selectedCity
                    ? `Événements à ${selectedCity}`
                    : searchQuery
                    ? "Résultats de recherche"
                    : "Événements à venir"}
                </h2>
                <span className="text-xs text-neutral-400 font-medium">
                  {events.length} événement{events.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/evenement/${event.id}`}
                    className="group rounded-xl overflow-hidden border border-neutral-100 hover:border-neutral-200 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Cover */}
                    <div className="aspect-[16/9] bg-neutral-100 relative overflow-hidden">
                      {event.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={event.cover_url}
                          alt={event.nom}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : event.logo_url ? (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={event.logo_url}
                            alt={event.nom}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                          <CalendarDays className="w-10 h-10 text-blue-300" />
                        </div>
                      )}

                      {/* Date badge */}
                      <div className="absolute top-3 left-3">
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm">
                          <p className="text-[10px] font-bold text-blue-600 uppercase leading-none">
                            {new Date(
                              event.date_debut + "T00:00:00"
                            ).toLocaleDateString("fr-FR", { month: "short" })}
                          </p>
                          <p className="text-base font-black text-neutral-900 leading-none mt-0.5">
                            {new Date(
                              event.date_debut + "T00:00:00"
                            ).getDate()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="text-xs text-neutral-400 font-medium mb-1">
                        {formatDate(event.date_debut, event.heure_debut)}
                      </p>
                      <h3 className="font-bold text-neutral-900 text-[15px] leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {event.nom}
                      </h3>
                      {event.lieu && (
                        <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {event.lieu}
                            {event.ville ? `, ${event.ville}` : ""}
                          </span>
                        </p>
                      )}

                      {/* Organizer — Luma style */}
                      {event.boutiques && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">
                          <div className="w-6 h-6 rounded-full bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0">
                            {event.boutiques.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={event.boutiques.logo_url} alt={event.boutiques.nom} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-neutral-400">{event.boutiques.nom.charAt(0)}</span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-500 font-medium truncate">Par {event.boutiques.nom}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-neutral-100 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm shadow-blue-500/30">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="font-semibold text-neutral-900 tracking-tight">
                Binq
              </span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-neutral-400">
              <Link href="/" className="hover:text-neutral-900 transition">
                Accueil
              </Link>
              <Link
                href="/explorer"
                className="text-neutral-900 font-medium"
              >
                Explorer
              </Link>
              <Link
                href="/connexion"
                className="hover:text-neutral-900 transition"
              >
                Connexion
              </Link>
            </div>
            <p className="text-xs text-neutral-300">
              &copy; {new Date().getFullYear()} Binq. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
