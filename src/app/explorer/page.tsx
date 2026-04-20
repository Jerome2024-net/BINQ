"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  QrCode,
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
  organisateur: {
    nom: string;
    avatar_url: string | null;
  } | null;
}

/* ─── Helpers ─── */
function formatTime(heureStr: string | null) {
  if (!heureStr) return "";
  const [h, m] = heureStr.split(":");
  return `${h}h${m}`;
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const ev = new Date(dateStr + "T00:00:00");

  if (ev.getTime() === today.getTime()) return "Aujourd'hui";
  if (ev.getTime() === tomorrow.getTime()) return "Demain";

  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDateCompact(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const ev = new Date(dateStr + "T00:00:00");

  if (ev.getTime() === today.getTime()) return "Aujourd'hui";
  if (ev.getTime() === tomorrow.getTime()) return "Demain";

  return d
    .toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .replace(".", "");
}

/* ─── Categories ─── */
const EVENT_CATEGORIES = [
  { slug: "", label: "Tout", icon: "🔥", gradient: "from-orange-500 to-red-500", bg: "bg-orange-50", text: "text-orange-600" },
  { slug: "alimentation", label: "Food & Drink", icon: "🍔", gradient: "from-amber-400 to-orange-500", bg: "bg-amber-50", text: "text-amber-600" },
  { slug: "mode", label: "Mode", icon: "👗", gradient: "from-pink-400 to-rose-500", bg: "bg-pink-50", text: "text-pink-600" },
  { slug: "electronique", label: "Tech", icon: "📱", gradient: "from-cyan-400 to-blue-500", bg: "bg-cyan-50", text: "text-cyan-600" },
  { slug: "beaute", label: "Beauté", icon: "💄", gradient: "from-fuchsia-400 to-purple-500", bg: "bg-fuchsia-50", text: "text-fuchsia-600" },
  { slug: "services", label: "Services", icon: "🔧", gradient: "from-slate-400 to-gray-600", bg: "bg-slate-50", text: "text-slate-600" },
  { slug: "artisanat", label: "Art & Culture", icon: "🎨", gradient: "from-violet-400 to-indigo-500", bg: "bg-violet-50", text: "text-violet-600" },
  { slug: "sport", label: "Sport", icon: "⚽", gradient: "from-emerald-400 to-green-600", bg: "bg-emerald-50", text: "text-emerald-600" },
  { slug: "education", label: "Éducation", icon: "📚", gradient: "from-blue-400 to-indigo-500", bg: "bg-blue-50", text: "text-blue-600" },
  { slug: "restauration", label: "Restaurants", icon: "🍽️", gradient: "from-red-400 to-rose-600", bg: "bg-red-50", text: "text-red-600" },
  { slug: "bien-etre", label: "Bien-être", icon: "💆", gradient: "from-teal-400 to-emerald-500", bg: "bg-teal-50", text: "text-teal-600" },
  { slug: "hotellerie", label: "Hôtellerie & Immo", icon: "🏨", gradient: "from-sky-400 to-blue-600", bg: "bg-sky-50", text: "text-sky-600" },
  { slug: "concerts", label: "Concerts & Festivals", icon: "🎶", gradient: "from-purple-400 to-pink-500", bg: "bg-purple-50", text: "text-purple-600" },
];

/* ─── Skeletons ─── */
function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="rounded-xl bg-gray-100 aspect-[16/10] mb-3" />
      <div className="space-y-2 px-0.5">
        <div className="h-3 w-28 bg-gray-100 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-3 w-1/2 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

/* ─────────────────────────────────────────────────── */
/*                   MAIN PAGE                         */
/* ─────────────────────────────────────────────────── */
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
  const cityRef = useRef<HTMLDivElement>(null);

  /* close city dropdown on outside click */
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const fetchEvents = useCallback(
    async (opts?: {
      search?: string;
      ville?: string;
      categorie?: string;
      offset?: number;
      append?: boolean;
    }) => {
      const {
        search,
        ville,
        categorie,
        offset = 0,
        append = false,
      } = opts || {};
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

  /* Group events by date */
  const groupedEvents = useMemo(() => {
    const groups: { date: string; label: string; events: EventPublic[] }[] = [];
    const map = new Map<string, EventPublic[]>();

    for (const ev of events) {
      const key = ev.date_debut;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }

    map.forEach((evts, date) => {
      groups.push({ date, label: formatDateLabel(date), events: evts });
    });

    groups.sort((a, b) => a.date.localeCompare(b.date));
    return groups;
  }, [events]);

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ═══════ NAV ═══════ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 h-14 lg:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
              <QrCode className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" />
            </div>
            <span className="font-semibold text-[15px] lg:text-base text-gray-900">
              Binq
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 lg:gap-2">
            <Link
              href="/explorer"
              className="px-3 lg:px-4 py-1.5 lg:py-2 text-[13px] lg:text-sm font-medium text-gray-900 bg-gray-100 rounded-lg"
            >
              Explorer
            </Link>
            <Link
              href="/connexion"
              className="px-3 lg:px-4 py-1.5 lg:py-2 text-[13px] lg:text-sm font-medium text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="ml-1.5 px-4 lg:px-5 py-1.5 lg:py-2 text-[13px] lg:text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20"
            >
              Créer un événement
            </Link>
          </nav>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 -mr-2 text-gray-600"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-5 py-3 space-y-1">
            <Link
              href="/explorer"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg"
            >
              Explorer
            </Link>
            <Link
              href="/connexion"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold text-center bg-blue-600 text-white rounded-lg mt-1"
            >
              Créer un événement
            </Link>
          </div>
        )}
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="pt-10 sm:pt-14 lg:pt-20 pb-8 lg:pb-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-10">
            <div className="lg:max-w-xl">
              <h1 className="text-[28px] sm:text-[40px] lg:text-[48px] font-bold text-gray-900 tracking-tight leading-[1.1]">
                Trouve ta prochaine{" "}
                <span className="text-blue-600">expérience</span>
              </h1>
              <p className="text-gray-400 text-[15px] sm:text-base lg:text-lg mt-2.5 max-w-md leading-relaxed">
                Événements, services, accès exclusifs — réserve ta place en un clic.
              </p>
            </div>

            {/* Search + City — side-by-side on desktop */}
            <div className="flex flex-col sm:flex-row gap-2.5 mt-7 lg:mt-0 lg:shrink-0">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-md lg:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une expérience, un lieu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-9 py-2.5 lg:py-3 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* City */}
              <div className="relative" ref={cityRef}>
                <button
                  onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 lg:py-3 text-[14px] hover:border-gray-300 transition min-w-[180px] lg:min-w-[200px] justify-between"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span
                      className={
                        selectedCity ? "text-gray-900" : "text-gray-400"
                      }
                    >
                      {selectedCity || "Toutes les villes"}
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {cityDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-full min-w-[200px] bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedCity("");
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition ${!selectedCity ? "text-gray-900 font-medium" : "text-gray-600"}`}
                    >
                      Toutes les villes
                    </button>
                    {cities.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setSelectedCity(city);
                          setCityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition ${selectedCity === city ? "text-gray-900 font-medium" : "text-gray-600"}`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ CATEGORY TABS ═══════ */}
      <section className="sticky top-14 lg:top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="flex gap-2 lg:gap-2.5 overflow-x-auto py-3 lg:py-3.5 scrollbar-none -mx-1 px-1">
            {EVENT_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`group flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0 border ${
                    active
                      ? `bg-gradient-to-r ${cat.gradient} text-white border-transparent shadow-lg shadow-black/10`
                      : `bg-white ${cat.text} border-gray-200 hover:border-gray-300 hover:shadow-md hover:shadow-black/5 hover:-translate-y-0.5`
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                    active
                      ? "bg-white/25"
                      : `${cat.bg}`
                  }`}>
                    {cat.icon}
                  </span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ CONTENT ═══════ */}
      <main className="max-w-7xl mx-auto px-5 lg:px-10 pb-20 pt-8 lg:pt-10">
        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 lg:gap-x-7 gap-y-8 lg:gap-y-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          /* Empty */
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-7 h-7 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Aucun événement trouvé
            </h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {searchQuery || selectedCity || selectedCategory
                ? "Essayez de modifier vos filtres."
                : "Pas encore d'événements à venir."}
            </p>
            {(searchQuery || selectedCity || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCity("");
                  setSelectedCategory("");
                }}
                className="mt-4 text-sm text-gray-900 font-medium hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        ) : (
          /* Event groups by date */
          <div className="space-y-10">
            {groupedEvents.map((group) => (
              <section key={group.date}>
                {/* Date header */}
                <h2 className="text-[15px] lg:text-lg font-semibold text-gray-900 capitalize mb-5 lg:mb-6">
                  {group.label}
                </h2>

                {/* Cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 lg:gap-x-7 gap-y-8 lg:gap-y-10">
                  {group.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  {loadingMore ? "Chargement..." : "Voir plus"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-10 lg:py-14">
          <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
            <div className="mb-6 lg:mb-0">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
                  <QrCode className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-[15px] text-gray-900">Binq</span>
              </Link>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                La plateforme de billetterie qui simplifie l&apos;organisation et la découverte d&apos;événements.
              </p>
            </div>
            <div className="flex items-center gap-6 text-[13px] lg:text-sm text-gray-400">
              <Link href="/" className="hover:text-gray-900 transition">
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
                className="hover:text-gray-900 transition"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="hover:text-gray-900 transition"
              >
                Créer un événement
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-300">
              &copy; {new Date().getFullYear()} Binq. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*                    EVENT CARD                       */
/* ═══════════════════════════════════════════════════ */
function EventCard({ event }: { event: EventPublic }) {
  const isFree = event.min_price === 0;

  return (
    <Link href={`/evenement/${event.id}`} className="group block">
      {/* Image */}
      <div className="relative rounded-xl lg:rounded-2xl overflow-hidden bg-gray-100 aspect-[16/10] mb-3 shadow-sm group-hover:shadow-md transition-shadow duration-300">
        {event.cover_url ? (
          <Image
            src={event.cover_url}
            alt={event.nom}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
            unoptimized
          />
        ) : event.logo_url ? (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <Image
              src={event.logo_url}
              alt=""
              width={48}
              height={48}
              className="rounded-xl object-cover opacity-50"
              unoptimized
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-gray-200" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        {/* Date + time + price — single muted line */}
        <p className="text-[13px] font-medium text-gray-400">
          {formatDateCompact(event.date_debut)}
          {event.heure_debut && ` · ${formatTime(event.heure_debut)}`}
          {isFree ? (
            <>
              <span className="text-gray-300"> · </span>
              <span className="text-emerald-500 font-semibold">Gratuit</span>
            </>
          ) : (
            <>
              <span className="text-gray-300"> · </span>
              <span className="text-gray-500">
                {event.min_price.toLocaleString("fr-FR")} {event.devise}
              </span>
            </>
          )}
        </p>

        {/* Title */}
        <h3 className="text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-gray-600 transition-colors">
          {event.nom}
        </h3>

        {/* Location */}
        {event.lieu && (
          <p className="text-[13px] text-gray-400 truncate">{event.lieu}</p>
        )}

        {/* Organizer */}
        {(event.organisateur || event.boutiques) && (
          <div className="flex items-center gap-2 pt-1.5">
            <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
              {event.organisateur?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.organisateur.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : event.boutiques?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.boutiques.logo_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[8px] font-bold text-gray-400">
                  {(event.organisateur?.nom || event.boutiques?.nom || "?").charAt(0)}
                </span>
              )}
            </div>
            <span className="text-[12px] text-gray-400 truncate">
              {event.organisateur?.nom || event.boutiques?.nom}
            </span>
            {event.total_vendu > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-gray-300 ml-auto">
                <Users className="w-3 h-3" />
                {event.total_vendu}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
