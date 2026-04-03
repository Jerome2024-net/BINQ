"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  CalendarDays,
  Loader2,
  Star,
  X,
  Menu,
  Users,
  Share2,
  Check,
  ChevronDown,
  Ticket,
  AlertCircle,
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

function formatTime(heureStr: string | null) {
  if (!heureStr) return "";
  return heureStr.slice(0, 5);
}

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const eventDate = new Date(dateStr + "T00:00:00");

  const dayName = d.toLocaleDateString("fr-FR", { weekday: "long" });
  const dayNum = d.getDate();
  const month = d.toLocaleDateString("fr-FR", { month: "long" });

  if (eventDate.getTime() === today.getTime()) {
    return `Aujourd'hui · ${dayName}`;
  }
  if (eventDate.getTime() === tomorrow.getTime()) {
    return `Demain · ${dayName}`;
  }
  return `${dayNum} ${month} · ${dayName}`;
}

function formatPrice(price: number, devise: string) {
  if (price === 0) return "Gratuit";
  return `${price.toLocaleString("fr-FR")} ${devise}`;
}

function getCapacityStatus(totalCapacity: number, totalSold: number) {
  if (totalCapacity <= 0) return null;
  const ratio = totalSold / totalCapacity;
  if (ratio >= 1) return { label: "Complet", color: "bg-red-50 text-red-600" };
  if (ratio >= 0.9) return { label: "Presque complet", color: "bg-orange-50 text-orange-600" };
  if (ratio >= 0.75) return { label: "Places limitées", color: "bg-amber-50 text-amber-600" };
  return null;
}

/* ─── Skeleton placeholders ─── */
function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-neutral-50 -mx-3 px-3 animate-pulse">
      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="h-3 w-12 bg-neutral-100 rounded" />
        <div className="h-4 w-3/4 bg-neutral-100 rounded" />
        <div className="h-3 w-1/3 bg-neutral-100 rounded" />
        <div className="h-3 w-1/2 bg-neutral-100 rounded" />
      </div>
      <div className="w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] rounded-xl bg-neutral-100 shrink-0" />
    </div>
  );
}

function SkeletonGroup() {
  return (
    <div>
      <div className="py-3 border-b border-neutral-100">
        <div className="h-3.5 w-40 bg-neutral-100 rounded animate-pulse" />
      </div>
      <SkeletonRow />
      <SkeletonRow />
    </div>
  );
}

const PAGE_SIZE = 20;

export default function ExplorerPublicPage() {
  const [events, setEvents] = useState<EventPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchEvents = useCallback(async (search?: string, offset = 0, append = false) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));
      const res = await fetch(`/api/events/explore?${params}`);
      const data = await res.json();
      const newEvents: EventPublic[] = data.events || [];
      setHasMore(!!data.hasMore);
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
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchEvents(searchQuery || undefined);
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const loadMore = () => {
    setLoadingMore(true);
    fetchEvents(searchQuery || undefined, events.length, true);
  };

  const handleShare = async (e: React.MouseEvent, event: EventPublic) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/evenement/${event.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.nom, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedId(event.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      /* user cancelled */
    }
  };

  // Group events by date (Luma-style)
  const groupedEvents = useMemo(() => {
    const groups: { date: string; label: string; events: EventPublic[] }[] = [];
    const map = new Map<string, EventPublic[]>();

    for (const ev of events) {
      const key = ev.date_debut;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }

    map.forEach((evts, date) => {
      groups.push({ date, label: formatDateHeader(date), events: evts });
    });

    groups.sort((a, b) => a.date.localeCompare(b.date));
    return groups;
  }, [events]);

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-neutral-900">
      {/* ═══════ HEADER ═══════ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
              <Star className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-neutral-900">
              Binq
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/connexion"
              className="text-[13px] text-neutral-500 hover:text-neutral-900 transition-colors font-medium"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="hidden sm:inline-flex text-[13px] px-4 py-1.5 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 transition-colors"
            >
              Créer un événement
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="sm:hidden p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="sm:hidden bg-white border-t border-neutral-100 pb-4 pt-3 px-5">
            <div className="flex flex-col gap-1">
              <Link href="/connexion" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-50 text-sm">
                Connexion
              </Link>
              <Link href="/inscription" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg bg-neutral-900 text-white text-sm text-center font-medium">
                Créer un événement
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="pt-10 sm:pt-16 pb-6 sm:pb-10">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-2">
            Cotonou
          </h1>
          <p className="text-neutral-400 text-sm sm:text-[15px] leading-relaxed max-w-lg mb-8">
            Découvrez les événements les plus populaires à Cotonou et ne manquez rien.
          </p>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-300 focus:ring-1 focus:ring-neutral-200 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ EVENTS LIST ═══════ */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <h2 className="text-[13px] font-semibold text-neutral-400 uppercase tracking-wider mb-6">
            Événements
          </h2>

          {/* Skeleton loading */}
          {loading ? (
            <div>
              <SkeletonGroup />
              <SkeletonGroup />
              <SkeletonGroup />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-neutral-50 flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-6 h-6 text-neutral-300" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-1">
                Aucun événement trouvé
              </h3>
              <p className="text-sm text-neutral-400 max-w-xs mx-auto mb-6">
                {searchQuery
                  ? "Essayez une autre recherche."
                  : "Il n'y a pas encore d'événements à venir. Revenez bientôt !"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-sm text-neutral-900 font-medium hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          ) : (
            <div>
              {groupedEvents.map((group) => (
                <div key={group.date}>
                  {/* Date header */}
                  <div className="sticky top-14 z-10 bg-white/90 backdrop-blur-sm py-3 border-b border-neutral-100">
                    <span className="text-[13px] font-bold text-neutral-900 capitalize">
                      {group.label}
                    </span>
                  </div>

                  {/* Events */}
                  <div>
                    {group.events.map((event) => {
                      const capacityStatus = getCapacityStatus(event.total_capacity, event.total_sold);
                      const isFree = event.min_price === 0;
                      const isCopied = copiedId === event.id;

                      return (
                        <Link
                          key={event.id}
                          href={`/evenement/${event.id}`}
                          className="group flex items-start gap-4 py-4 border-b border-neutral-50 hover:bg-neutral-50/50 -mx-3 px-3 rounded-xl transition-colors relative"
                        >
                          {/* Left: info */}
                          <div className="flex-1 min-w-0">
                            {/* Time */}
                            {event.heure_debut && (
                              <p className="text-[13px] font-medium text-neutral-400 mb-1">
                                {formatTime(event.heure_debut)}
                              </p>
                            )}

                            {/* Title */}
                            <h3 className="font-semibold text-neutral-900 text-[15px] leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {event.nom}
                            </h3>

                            {/* Organizer */}
                            {event.boutiques && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0">
                                  {event.boutiques.logo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={event.boutiques.logo_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[8px] font-bold text-neutral-400">
                                      {event.boutiques.nom.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-neutral-400 truncate">
                                  Par {event.boutiques.nom}
                                </span>
                              </div>
                            )}

                            {/* Location */}
                            {event.lieu && (
                              <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{event.lieu}</span>
                              </p>
                            )}

                            {/* Badges row: price + capacity + registered */}
                            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                              {/* Price badge */}
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                isFree
                                  ? "bg-green-50 text-green-600"
                                  : "bg-blue-50 text-blue-600"
                              }`}>
                                <Ticket className="w-3 h-3" />
                                {formatPrice(event.min_price, event.devise)}
                              </span>

                              {/* Capacity status */}
                              {capacityStatus && (
                                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${capacityStatus.color}`}>
                                  <AlertCircle className="w-3 h-3" />
                                  {capacityStatus.label}
                                </span>
                              )}

                              {/* Registered count */}
                              {event.total_vendu > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 font-medium">
                                  <Users className="w-3 h-3" />
                                  +{event.total_vendu}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: thumbnail + share */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] rounded-xl overflow-hidden bg-neutral-100">
                              {event.cover_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={event.cover_url}
                                  alt={event.nom}
                                  className="w-full h-full object-cover"
                                />
                              ) : event.logo_url ? (
                                <div className="w-full h-full bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={event.logo_url}
                                    alt={event.nom}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
                                  <CalendarDays className="w-6 h-6 text-neutral-300" />
                                </div>
                              )}
                            </div>
                            {/* Share button */}
                            <button
                              onClick={(e) => handleShare(e, event)}
                              className="p-1.5 rounded-lg text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                              title="Partager"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Share2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Load more button */}
              {hasMore && (
                <div className="flex justify-center pt-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {loadingMore ? "Chargement..." : "Charger plus"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-neutral-100 py-8 sm:py-10">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm shadow-blue-500/30">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="font-semibold text-neutral-900 tracking-tight text-sm">
                Binq
              </span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-neutral-400">
              <Link href="/" className="hover:text-neutral-900 transition">
                Accueil
              </Link>
              <Link href="/explorer" className="text-neutral-900 font-medium">
                Explorer
              </Link>
              <Link href="/connexion" className="hover:text-neutral-900 transition">
                Connexion
              </Link>
            </div>
            <p className="text-xs text-neutral-300">
              &copy; {new Date().getFullYear()} Binq
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
