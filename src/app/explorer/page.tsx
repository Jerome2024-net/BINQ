"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  CalendarDays,
  Loader2,
  X,
  Menu,
  ChevronDown,
  MapPin,
  Users,
  ChevronRight,
  Flame,
  Sparkles,
} from "lucide-react";

/* ─── Types ─── */
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
  min_price: number;
  total_capacity: number;
  total_sold: number;
  boutiques: {
    nom: string;
    slug: string;
    logo_url: string | null;
    is_verified: boolean;
  } | null;
}

/* ─── Helpers ─── */
function formatTime(heureStr: string | null) {
  if (!heureStr) return "";
  const [h, m] = heureStr.split(":");
  return `${h}:${m}`;
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const ev = new Date(dateStr + "T00:00:00");

  if (ev.getTime() === today.getTime()) return "Aujourd'hui";
  if (ev.getTime() === tomorrow.getTime()) return "Demain";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const ev = new Date(dateStr + "T00:00:00");

  const dayName = d.toLocaleDateString("fr-FR", { weekday: "long" });
  const day = d.getDate();
  const month = d.toLocaleDateString("fr-FR", { month: "long" });

  if (ev.getTime() === today.getTime())
    return `Aujourd'hui — ${dayName} ${day} ${month}`;
  if (ev.getTime() === tomorrow.getTime())
    return `Demain — ${dayName} ${day} ${month}`;
  return `${dayName} ${day} ${month}`;
}

function getCapacityInfo(totalCapacity: number, totalSold: number) {
  if (totalCapacity <= 0) return null;
  const ratio = totalSold / totalCapacity;
  if (ratio >= 1) return { label: "Complet", style: "bg-red-500/90 text-white" };
  if (ratio >= 0.85) return { label: "Presque complet", style: "bg-orange-500/90 text-white" };
  return null;
}

/* ─── Category options (mapped to boutique categories) ─── */
const EVENT_CATEGORIES = [
  { slug: "", label: "Tout", icon: "🔥" },
  { slug: "alimentation", label: "Food & Drink", icon: "🍔" },
  { slug: "mode", label: "Mode", icon: "👗" },
  { slug: "electronique", label: "Tech", icon: "📱" },
  { slug: "beaute", label: "Beauté", icon: "💄" },
  { slug: "services", label: "Services", icon: "🔧" },
  { slug: "artisanat", label: "Art & Culture", icon: "🎨" },
  { slug: "sport", label: "Sport", icon: "⚽" },
  { slug: "education", label: "Éducation", icon: "📚" },
];

/* ─── Skeleton ─── */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl overflow-hidden bg-white border border-gray-100">
      <div className="aspect-[16/9] bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-20 bg-gray-100 rounded-full" />
        <div className="h-5 w-4/5 bg-gray-100 rounded" />
        <div className="h-3 w-2/3 bg-gray-100 rounded" />
        <div className="h-3 w-1/2 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

function SkeletonFeatured() {
  return (
    <div className="animate-pulse rounded-3xl overflow-hidden bg-gray-100 aspect-[2.2/1] w-full" />
  );
}

const PAGE_SIZE = 20;

export default function ExplorerPublicPage() {
  const [events, setEvents] = useState<EventPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const fetchEvents = useCallback(
    async (opts?: {
      search?: string;
      ville?: string;
      categorie?: string;
      offset?: number;
      append?: boolean;
    }) => {
      const { search, ville, categorie, offset = 0, append = false } = opts || {};
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (ville) params.set("ville", ville);
        if (categorie) params.set("categorie", categorie);
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String(offset));
        if (offset === 0) params.set("meta", "1");

        const res = await fetch(`/api/events/explore?${params}`);
        const data = await res.json();
        const newEvents: EventPublic[] = data.events || [];
        setHasMore(!!data.hasMore);

        if (data.cities && data.cities.length > 0) {
          setCities(data.cities);
        }

        if (append) {
          setEvents((prev) => [...prev, ...newEvents]);
        } else {
          setEvents(newEvents);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchEvents({
        search: searchQuery || undefined,
        ville: selectedCity || undefined,
        categorie: selectedCategory || undefined,
      });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCity, selectedCategory]);

  const loadMore = () => {
    setLoadingMore(true);
    fetchEvents({
      search: searchQuery || undefined,
      ville: selectedCity || undefined,
      categorie: selectedCategory || undefined,
      offset: events.length,
      append: true,
    });
  };

  /* Featured = first event */
  const featured = events.length > 0 ? events[0] : null;
  const restEvents = events.length > 1 ? events.slice(1) : [];

  /* Group remaining events by date */
  const groupedEvents = useMemo(() => {
    const groups: { date: string; label: string; events: EventPublic[] }[] = [];
    const map = new Map<string, EventPublic[]>();

    for (const ev of restEvents) {
      const key = ev.date_debut;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }

    map.forEach((evts, date) => {
      groups.push({ date, label: formatDateFull(date), events: evts });
    });

    groups.sort((a, b) => a.date.localeCompare(b.date));
    return groups;
  }, [restEvents]);

  const hasActiveFilters =
    !!selectedCity || !!selectedCategory || !!searchQuery;

  return (
    <div
      className="min-h-screen bg-[#f8f9fa]"
      style={{
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ═══════ HEADER ═══════ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/20">
              <span className="text-white font-extrabold text-sm">B</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900">
              Binq
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <Link
              href="/explorer"
              className="px-3.5 py-2 text-sm font-medium text-violet-700 bg-violet-50 rounded-xl"
            >
              Explorer
            </Link>
            <Link
              href="/connexion"
              className="px-3.5 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="ml-2 px-5 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
            >
              Créer un événement
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {mobileOpen && (
          <div className="sm:hidden bg-white border-t border-gray-100 pb-4 pt-3 px-4">
            <div className="flex flex-col gap-1">
              <Link
                href="/explorer"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-violet-700 font-medium bg-violet-50 text-sm"
              >
                Explorer
              </Link>
              <Link
                href="/connexion"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 text-sm"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl bg-gray-900 text-white text-sm text-center font-semibold mt-1"
              >
                Créer un événement
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="bg-white pt-8 sm:pt-12 pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-semibold text-violet-600 tracking-wide">
              Découvrir
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
            Événements à{" "}
            <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              {selectedCity || "Cotonou"}
            </span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg mt-3 max-w-xl leading-relaxed">
            Trouvez les meilleurs événements près de chez vous. Concerts,
            conférences, networking et plus encore.
          </p>

          {/* Search + City row */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un événement, lieu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* City dropdown */}
            <div className="relative">
              <button
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm hover:border-gray-300 transition-all min-w-[190px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span
                    className={
                      selectedCity
                        ? "text-gray-900 font-medium"
                        : "text-gray-400"
                    }
                  >
                    {selectedCity || "Toutes les villes"}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {cityDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setCityDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-full min-w-[220px] bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedCity("");
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${!selectedCity ? "text-violet-600 font-medium bg-violet-50/50" : "text-gray-700"}`}
                    >
                      🌍 Toutes les villes
                    </button>
                    {cities.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setSelectedCity(city);
                          setCityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${selectedCity === city ? "text-violet-600 font-medium bg-violet-50/50" : "text-gray-700"}`}
                      >
                        📍 {city}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ CATEGORY TABS ═══════ */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1">
            {EVENT_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "bg-gray-900 text-white shadow-md shadow-gray-900/10"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ CONTENT ═══════ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 pt-6">
        {/* Active filter pills */}
        {hasActiveFilters && !loading && (
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span className="text-xs text-gray-400 font-medium">Filtres :</span>
            {selectedCity && (
              <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-medium px-3 py-1.5 rounded-full">
                📍 {selectedCity}
                <button onClick={() => setSelectedCity("")} className="hover:text-violet-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-medium px-3 py-1.5 rounded-full">
                {EVENT_CATEGORIES.find((c) => c.slug === selectedCategory)?.icon}{" "}
                {EVENT_CATEGORIES.find((c) => c.slug === selectedCategory)?.label}
                <button onClick={() => setSelectedCategory("")} className="hover:text-violet-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-medium px-3 py-1.5 rounded-full">
                🔍 &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery("")} className="hover:text-violet-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedCity("");
                setSelectedCategory("");
                setSearchQuery("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600 font-medium underline ml-1"
            >
              Tout effacer
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="space-y-8">
            <SkeletonFeatured />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        ) : events.length === 0 ? (
          /* Empty */
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <CalendarDays className="w-9 h-9 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Aucun événement trouvé
            </h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto mb-6">
              {hasActiveFilters
                ? "Essayez de modifier vos filtres pour trouver plus d'événements."
                : "Il n'y a pas encore d'événements à venir. Revenez bientôt !"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCity("");
                  setSelectedCategory("");
                }}
                className="text-sm text-violet-600 font-semibold hover:underline"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {/* ═══ FEATURED EVENT ═══ */}
            {featured && (
              <Link href={`/evenement/${featured.id}`} className="group block">
                <div className="relative rounded-3xl overflow-hidden bg-gray-900 aspect-[2.2/1] sm:aspect-[2.5/1]">
                  {featured.cover_url ? (
                    <Image
                      src={featured.cover_url}
                      alt={featured.nom}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-blue-600" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md text-white text-xs font-semibold rounded-full border border-white/10">
                        <Flame className="w-3 h-3" /> En vedette
                      </span>
                      {featured.min_price === 0 ? (
                        <span className="px-3 py-1 bg-emerald-500/90 text-white text-xs font-semibold rounded-full">
                          Gratuit
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-white/15 backdrop-blur-md text-white text-xs font-semibold rounded-full border border-white/10">
                          {featured.min_price.toLocaleString("fr-FR")}{" "}
                          {featured.devise}
                        </span>
                      )}
                      {(() => {
                        const cap = getCapacityInfo(
                          featured.total_capacity,
                          featured.total_sold
                        );
                        if (!cap) return null;
                        return (
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${cap.style}`}
                          >
                            {cap.label}
                          </span>
                        );
                      })()}
                    </div>

                    <h2 className="text-white text-xl sm:text-3xl font-bold leading-tight line-clamp-2 mb-2">
                      {featured.nom}
                    </h2>

                    <div className="flex items-center gap-4 text-white/80 text-sm flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4" />
                        {formatDateShort(featured.date_debut)}
                        {featured.heure_debut &&
                          ` · ${formatTime(featured.heure_debut)}`}
                      </span>
                      {featured.lieu && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {featured.lieu}
                        </span>
                      )}
                      {featured.total_vendu > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />+{featured.total_vendu}{" "}
                          inscrits
                        </span>
                      )}
                    </div>

                    {featured.boutiques && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur overflow-hidden flex items-center justify-center ring-2 ring-white/20">
                          {featured.boutiques.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={featured.boutiques.logo_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-white">
                              {featured.boutiques.nom.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="text-white/70 text-sm">
                          Par {featured.boutiques.nom}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )}

            {/* ═══ EVENTS BY DATE ═══ */}
            {groupedEvents.map((group) => (
              <div key={group.date}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 capitalize leading-tight">
                      {group.label}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {group.events.length} événement
                      {group.events.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {loadingMore ? "Chargement..." : "Voir plus d'événements"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-white border-t border-gray-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">B</span>
              </div>
              <span className="font-bold text-sm text-gray-900">Binq</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link
                href="/"
                className="hover:text-gray-900 transition-colors"
              >
                Accueil
              </Link>
              <Link
                href="/explorer"
                className="text-gray-900 font-medium"
              >
                Explorer
              </Link>
              <Link
                href="/connexion"
                className="hover:text-gray-900 transition-colors"
              >
                Connexion
              </Link>
            </div>
            <p className="text-xs text-gray-300">
              &copy; {new Date().getFullYear()} Binq
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════ EVENT CARD ═══════ */
function EventCard({ event }: { event: EventPublic }) {
  const capacityInfo = getCapacityInfo(event.total_capacity, event.total_sold);
  const isFree = event.min_price === 0;

  return (
    <Link
      href={`/evenement/${event.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300"
    >
      {/* Cover */}
      <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
        {event.cover_url ? (
          <Image
            src={event.cover_url}
            alt={event.nom}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : event.logo_url ? (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <Image
              src={event.logo_url}
              alt=""
              width={56}
              height={56}
              className="rounded-2xl object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center">
            <CalendarDays className="w-10 h-10 text-gray-200" />
          </div>
        )}

        {/* Date badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
          <p className="text-[11px] font-bold text-violet-600 uppercase leading-none">
            {formatDateShort(event.date_debut)}
          </p>
          {event.heure_debut && (
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
              {formatTime(event.heure_debut)}
            </p>
          )}
        </div>

        {/* Price badge */}
        <div className="absolute top-3 right-3">
          {isFree ? (
            <span className="px-2.5 py-1 bg-emerald-500 text-white text-[11px] font-bold rounded-lg shadow-sm">
              Gratuit
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm text-gray-900 text-[11px] font-bold rounded-lg shadow-sm">
              {event.min_price.toLocaleString("fr-FR")} {event.devise}
            </span>
          )}
        </div>

        {/* Capacity overlay */}
        {capacityInfo && (
          <div className="absolute bottom-3 left-3">
            <span
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-sm ${capacityInfo.style}`}
            >
              {capacityInfo.label}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-[15px] text-gray-900 leading-snug line-clamp-2 group-hover:text-violet-700 transition-colors">
          {event.nom}
        </h3>

        {event.boutiques && (
          <div className="flex items-center gap-2 mt-2.5">
            <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-gray-200/50">
              {event.boutiques.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.boutiques.logo_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[9px] font-bold text-gray-400">
                  {event.boutiques.nom.charAt(0)}
                </span>
              )}
            </div>
            <span className="text-[13px] text-gray-500 truncate">
              Par {event.boutiques.nom}
            </span>
          </div>
        )}

        {event.lieu && (
          <div className="flex items-center gap-1.5 mt-2 text-[13px] text-gray-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{event.lieu}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3">
            {event.total_vendu > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-gray-400 font-medium">
                <Users className="w-3.5 h-3.5" />+{event.total_vendu}
              </span>
            )}
            {event.ville && (
              <span className="text-[12px] text-gray-300 font-medium">
                {event.ville}
              </span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}
