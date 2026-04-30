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
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Truck,
  Store,
  BadgeCheck,
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
  { slug: "", label: "Tout", gradient: "from-orange-500 to-red-500", bg: "bg-orange-50", text: "text-orange-600" },
  { slug: "alimentation", label: "Courses", gradient: "from-amber-400 to-orange-500", bg: "bg-amber-50", text: "text-amber-600" },
  { slug: "mode", label: "Mode", gradient: "from-pink-400 to-rose-500", bg: "bg-pink-50", text: "text-pink-600" },
  { slug: "electronique", label: "Tech", gradient: "from-cyan-400 to-blue-500", bg: "bg-cyan-50", text: "text-cyan-600" },
  { slug: "beaute", label: "Beauté", gradient: "from-fuchsia-400 to-purple-500", bg: "bg-fuchsia-50", text: "text-fuchsia-600" },
  { slug: "services", label: "Services", gradient: "from-slate-400 to-gray-600", bg: "bg-slate-50", text: "text-slate-600" },
  { slug: "artisanat", label: "Artisans", gradient: "from-violet-400 to-indigo-500", bg: "bg-violet-50", text: "text-violet-600" },
  { slug: "sport", label: "Sport", gradient: "from-emerald-400 to-green-600", bg: "bg-emerald-50", text: "text-emerald-600" },
  { slug: "education", label: "Éducation", gradient: "from-blue-400 to-indigo-500", bg: "bg-blue-50", text: "text-blue-600" },
  { slug: "restauration", label: "Restaurants", gradient: "from-red-400 to-rose-600", bg: "bg-red-50", text: "text-red-600" },
  { slug: "bien-etre", label: "Bien-être", gradient: "from-teal-400 to-emerald-500", bg: "bg-teal-50", text: "text-teal-600" },
  { slug: "hotellerie", label: "Maison", gradient: "from-sky-400 to-blue-600", bg: "bg-sky-50", text: "text-sky-600" },
  { slug: "concerts", label: "Loisirs", gradient: "from-purple-400 to-pink-500", bg: "bg-purple-50", text: "text-purple-600" },
];

/* ─── Skeletons ─── */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[1.75rem] bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="bg-slate-100 aspect-[16/10]" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-28 bg-slate-100 rounded-full" />
        <div className="h-5 w-3/4 bg-slate-100 rounded-full" />
        <div className="h-3 w-1/2 bg-slate-100 rounded-full" />
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
      className="min-h-screen bg-[#f7f9fe] text-slate-950"
      style={{
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ═══════ NAV ═══════ */}
      <header className="sticky top-0 z-50 bg-white/75 backdrop-blur-2xl border-b border-white/70 shadow-sm shadow-slate-200/40">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 h-14 lg:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <QrCode className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" />
            </div>
            <span className="font-bold text-[15px] lg:text-base text-slate-950 tracking-tight">
              Binq
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 lg:gap-2">
            <Link
              href="/explorer"
              className="px-3 lg:px-4 py-1.5 lg:py-2 text-[13px] lg:text-sm font-semibold text-blue-700 bg-blue-50 rounded-full"
            >
              Explorer
            </Link>
            <Link
              href="/connexion"
              className="px-3 lg:px-4 py-1.5 lg:py-2 text-[13px] lg:text-sm font-medium text-slate-500 hover:text-slate-950 rounded-full hover:bg-white transition"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="ml-1.5 px-4 lg:px-5 py-1.5 lg:py-2 text-[13px] lg:text-sm font-semibold bg-slate-950 text-white rounded-full hover:bg-blue-700 transition shadow-lg shadow-slate-950/15"
            >
              Devenir partenaire
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
          <div className="sm:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl px-5 py-3 space-y-1">
            <Link
              href="/explorer"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 rounded-xl"
            >
              Explorer
            </Link>
            <Link
              href="/connexion"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold text-center bg-slate-950 text-white rounded-xl mt-1"
            >
              Devenir partenaire
            </Link>
          </div>
        )}
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden border-b border-white/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.20),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(124,58,237,0.16),transparent_30%),linear-gradient(180deg,#ffffff_0%,#eef5ff_100%)]" />
        <div className="absolute -top-24 right-[-6rem] w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute top-32 left-[-5rem] w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-5 lg:px-10 pt-12 sm:pt-16 lg:pt-22 pb-8 lg:pb-12">
          <div className="grid lg:grid-cols-[1fr_460px] lg:items-end gap-8 lg:gap-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-white shadow-sm text-[12px] font-bold text-blue-700 mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                Restaurants, boutiques & livraison locale
              </div>
              <h1 className="text-[34px] sm:text-[48px] lg:text-[64px] font-black text-slate-950 tracking-[-0.045em] leading-[0.98]">
                Commandez près de{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">chez vous</span>
              </h1>
              <p className="text-slate-500 text-[15px] sm:text-base lg:text-lg mt-5 max-w-xl leading-relaxed">
                Trouvez des commerces locaux, payez en ligne et faites-vous livrer rapidement.
              </p>
              <div className="flex flex-wrap gap-3 mt-7 text-[13px] text-slate-600">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 border border-white shadow-sm">
                  <ShoppingBag className="w-4 h-4 text-blue-600" /> Commande instantanée
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 border border-white shadow-sm">
                  <Truck className="w-4 h-4 text-indigo-600" /> Livraison locale
                </span>
              </div>
            </div>

            {/* Search + City */}
            <div className="rounded-[2rem] bg-white/85 backdrop-blur-xl border border-white shadow-2xl shadow-blue-900/10 p-3 sm:p-4 lg:p-5">
              <div className="mb-3 px-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Recherche rapide</p>
                <p className="text-sm text-slate-500 mt-1">Filtrez par commerce, produit ou ville.</p>
              </div>
              <div className="flex flex-col gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input
                  type="text"
                  placeholder="Rechercher un restaurant, produit, boutique..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-9 py-3.5 text-[14px] text-slate-950 placeholder-slate-400 outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 transition"
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
                  className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-[14px] hover:border-blue-200 hover:bg-white transition w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span
                      className={
                        selectedCity ? "text-slate-950" : "text-slate-400"
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
                  <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 py-2 z-50 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedCity("");
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[13px] hover:bg-slate-50 transition ${!selectedCity ? "text-slate-950 font-semibold" : "text-slate-600"}`}
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
                        className={`w-full text-left px-4 py-2 text-[13px] hover:bg-slate-50 transition ${selectedCity === city ? "text-slate-950 font-semibold" : "text-slate-600"}`}
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
        </div>
      </section>

      {/* ═══════ CATEGORY TABS ═══════ */}
      <section className="sticky top-14 lg:top-16 z-40 bg-[#f7f9fe]/88 backdrop-blur-2xl border-b border-white/80">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="flex gap-2 lg:gap-2.5 overflow-x-auto py-3 lg:py-3.5 scrollbar-none -mx-1 px-1">
            {EVENT_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0 border ${
                    active
                      ? `bg-gradient-to-r ${cat.gradient} text-white border-transparent shadow-lg shadow-black/10`
                      : `bg-white/85 ${cat.text} border-white hover:border-blue-100 hover:shadow-md hover:shadow-blue-900/5 hover:-translate-y-0.5`
                  }`}
                >
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          /* Empty */
          <div className="text-center py-20 bg-white rounded-[2rem] border border-white shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7 text-blue-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-950 mb-1">
              Aucun commerce trouvé
            </h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              {searchQuery || selectedCity || selectedCategory
              ? "Essayez de modifier vos filtres."
                : "Pas encore de commerces disponibles."}
            </p>
            {(searchQuery || selectedCity || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCity("");
                  setSelectedCategory("");
                }}
                className="mt-5 inline-flex items-center px-4 py-2 rounded-full text-sm text-blue-700 bg-blue-50 font-semibold hover:bg-blue-100 transition"
              >
                Réinitialiser
              </button>
            )}
          </div>
        ) : (
          /* Commerce groups by availability */
          <div className="space-y-10">
            {groupedEvents.map((group) => (
              <section key={group.date}>
                {/* Availability header */}
                <div className="flex items-center gap-3 mb-5 lg:mb-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-white shadow-sm text-[13px] lg:text-sm font-bold text-slate-950 capitalize">
                    <Truck className="w-4 h-4 text-blue-600" />
                    Disponible {group.label.toLowerCase()}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
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
                  className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-bold text-slate-700 bg-white border border-white rounded-full hover:bg-blue-50 hover:text-blue-700 transition disabled:opacity-50 shadow-sm"
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
      <footer className="border-t border-white bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-10 lg:py-14">
          <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
            <div className="mb-6 lg:mb-0">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <QrCode className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-[15px] text-slate-950">Binq</span>
              </Link>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                La plateforme de commerce local qui simplifie les commandes, le paiement et la livraison.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[13px] lg:text-sm text-slate-400">
              <Link href="/" className="hover:text-slate-950 transition">
                Accueil
              </Link>
              <Link
                href="/explorer"
                className="text-slate-950 font-semibold"
              >
                Explorer
              </Link>
              <Link
                href="/connexion"
                className="hover:text-slate-950 transition"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="hover:text-slate-950 transition"
              >
                Devenir partenaire
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Binq. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*                  COMMERCE CARD                      */
/* ═══════════════════════════════════════════════════ */
function EventCard({ event }: { event: EventPublic }) {
  const isFree = event.min_price === 0;
  const soldRatio = event.total_capacity > 0 ? Math.min(100, Math.round((event.total_sold / event.total_capacity) * 100)) : 0;

  return (
    <Link href={`/evenement/${event.id}`} className="group block h-full">
      <article className="h-full rounded-[1.75rem] bg-white border border-white shadow-sm shadow-slate-200/80 overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-blue-900/10">
      {/* Image */}
      <div className="relative overflow-hidden bg-slate-100 aspect-[16/10]">
        {event.cover_url ? (
          <Image
            src={event.cover_url}
            alt={event.nom}
            fill
            className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
            unoptimized
          />
        ) : event.logo_url ? (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 flex items-center justify-center">
            <Image
              src={event.logo_url}
              alt=""
              width={62}
              height={62}
              className="rounded-2xl object-cover opacity-70 shadow-lg"
              unoptimized
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 flex items-center justify-center">
            <CalendarDays className="w-9 h-9 text-blue-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent opacity-80" />
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-white/92 backdrop-blur-md shadow-sm text-[11px] font-bold text-slate-950">
          {formatDateCompact(event.date_debut)}{event.heure_debut && ` · ${formatTime(event.heure_debut)}`}
        </div>
        <div className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm text-[11px] font-black ${isFree ? "bg-emerald-500 text-white" : "bg-white/92 text-slate-950"}`}>
          {isFree ? "Gratuit" : `${event.min_price.toLocaleString("fr-FR")} ${event.devise}`}
        </div>
        <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/92 backdrop-blur-md flex items-center justify-center shadow-sm text-blue-600 transition-transform group-hover:translate-x-0.5">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-[16px] font-extrabold text-slate-950 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
          {event.nom}
        </h3>

        {/* Location */}
        {event.lieu && (
          <p className="flex items-center gap-1.5 text-[13px] text-slate-500 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            {event.lieu}
          </p>
        )}

        {event.total_capacity > 0 && (
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>{event.total_sold} commande{event.total_sold > 1 ? "s" : ""}</span>
              <span>{event.total_capacity - event.total_sold} disponibilité{event.total_capacity - event.total_sold > 1 ? "s" : ""}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${soldRatio}%` }} />
            </div>
          </div>
        )}

        {/* Organizer */}
        {(event.organisateur || event.boutiques) && (
          <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
            <div className="w-7 h-7 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-white">
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
                <span className="text-[10px] font-bold text-slate-400">
                  {(event.organisateur?.nom || event.boutiques?.nom || "?").charAt(0)}
                </span>
              )}
            </div>
            <span className="text-[12px] font-medium text-slate-500 truncate">
              {event.organisateur?.nom || event.boutiques?.nom}
            </span>
            {event.boutiques?.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
            {event.total_vendu > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto bg-slate-50 px-2 py-1 rounded-full">
                <Users className="w-3 h-3" />
                {event.total_vendu}
              </span>
            )}
          </div>
        )}
      </div>
      </article>
    </Link>
  );
}
