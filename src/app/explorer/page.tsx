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
  const [h, m] = heureStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
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
  const month = d.toLocaleDateString("fr-FR", { month: "short" });

  const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  if (eventDate.getTime() === today.getTime()) {
    return `Aujourd'hui|${capDay}`;
  }
  if (eventDate.getTime() === tomorrow.getTime()) {
    return `Demain|${capDay}`;
  }
  return `${dayNum} ${month.charAt(0).toUpperCase() + month.slice(1)}|${capDay}`;
}

function getCapacityLabel(totalCapacity: number, totalSold: number) {
  if (totalCapacity <= 0) return null;
  const ratio = totalSold / totalCapacity;
  if (ratio >= 1) return "Complet";
  if (ratio >= 0.85) return "Presque complet";
  if (ratio >= 0.7) return "Liste d'attente";
  return null;
}

/* ─── Skeleton ─── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-5 py-5 animate-pulse">
      <div className="flex-1 min-w-0 space-y-3">
        <div className="h-3.5 w-16 bg-neutral-100 rounded-md" />
        <div className="h-5 w-4/5 bg-neutral-100 rounded-md" />
        <div className="h-3.5 w-2/5 bg-neutral-100 rounded-md" />
        <div className="h-3 w-1/3 bg-neutral-100 rounded-md" />
      </div>
      <div className="w-[120px] h-[120px] rounded-xl bg-neutral-100 shrink-0" />
    </div>
  );
}

function SkeletonGroup() {
  return (
    <div>
      <div className="pt-8 pb-4">
        <div className="h-4 w-44 bg-neutral-100 rounded-md animate-pulse" />
      </div>
      <div className="divide-y divide-neutral-100">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
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
      groups.push({ date, label: formatDateHeader(date), events: evts });
    });

    groups.sort((a, b) => a.date.localeCompare(b.date));
    return groups;
  }, [events]);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* ═══════ HEADER ═══════ */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-black/[0.06]">
        <div className="max-w-[680px] mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            <span className="font-semibold text-[15px] tracking-[-0.01em]">Binq</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/connexion"
              className="hidden sm:inline-flex text-[13px] text-[#666] hover:text-[#1a1a1a] transition-colors font-medium px-3 py-1.5"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="hidden sm:inline-flex text-[13px] px-4 py-1.5 bg-[#1a1a1a] text-white rounded-full font-medium hover:bg-[#333] transition-colors"
            >
              Créer un événement
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="sm:hidden p-2 rounded-lg text-[#666] hover:bg-neutral-50 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="sm:hidden bg-white border-t border-black/[0.06] pb-4 pt-3 px-5">
            <div className="flex flex-col gap-1">
              <Link href="/connexion" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-[#666] hover:bg-neutral-50 text-sm">
                Connexion
              </Link>
              <Link href="/inscription" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg bg-[#1a1a1a] text-white text-sm text-center font-medium">
                Créer un événement
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="pt-12 sm:pt-20 pb-8 sm:pb-12">
        <div className="max-w-[680px] mx-auto px-5">
          <p className="text-[13px] text-[#999] font-medium tracking-wide uppercase mb-3">
            Que se passe-t-il à
          </p>
          <h1 className="text-[32px] sm:text-[44px] font-bold tracking-[-0.03em] leading-[1.1] text-[#1a1a1a] mb-3">
            Cotonou
          </h1>
          <p className="text-[#999] text-[15px] leading-relaxed max-w-md mb-10">
            Découvrez les événements les plus populaires à Cotonou et soyez
            notifié des nouveaux événements avant qu&apos;ils n&apos;affichent complet.
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#bbb]" />
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8f8f8] border border-[#eee] rounded-[12px] pl-11 pr-10 py-3 text-[14px] text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-[#ddd] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-[#bbb] hover:text-[#666]" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ EVENTS LIST ═══════ */}
      <section className="pb-24 sm:pb-32">
        <div className="max-w-[680px] mx-auto px-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[13px] font-semibold text-[#999] uppercase tracking-[0.08em]">
              Événements
            </h2>
          </div>

          {/* Skeleton loading */}
          {loading ? (
            <div>
              <SkeletonGroup />
              <SkeletonGroup />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-[#f8f8f8] flex items-center justify-center mx-auto mb-5">
                <CalendarDays className="w-7 h-7 text-[#ccc]" />
              </div>
              <h3 className="text-[17px] font-semibold text-[#1a1a1a] mb-1.5">
                Aucun événement trouvé
              </h3>
              <p className="text-[14px] text-[#999] max-w-[280px] mx-auto mb-6">
                {searchQuery
                  ? "Essayez une autre recherche."
                  : "Il n'y a pas encore d'événements à venir. Revenez bientôt !"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[14px] text-[#1a1a1a] font-medium hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          ) : (
            <div>
              {groupedEvents.map((group) => (
                <div key={group.date}>
                  {/* ── Date header (Luma-style) ── */}
                  <div className="sticky top-14 z-10 bg-white pt-8 pb-4">
                    <span className="text-[15px] font-semibold text-[#1a1a1a] tracking-[-0.01em]">
                      {(() => {
                        const idx = group.label.indexOf("|");
                        if (idx === -1) return group.label;
                        const primary = group.label.slice(0, idx);
                        const secondary = group.label.slice(idx + 1);
                        return (
                          <>
                            {primary}
                            <span className="text-[#999] font-normal">{secondary}</span>
                          </>
                        );
                      })()}
                    </span>
                  </div>

                  {/* ── Event rows ── */}
                  <div className="divide-y divide-[#f0f0f0]">
                    {group.events.map((event) => {
                      const capacityLabel = getCapacityLabel(event.total_capacity, event.total_sold);

                      return (
                        <Link
                          key={event.id}
                          href={`/evenement/${event.id}`}
                          className="group flex items-center gap-5 py-5 -mx-4 px-4 rounded-2xl hover:bg-[#fafafa] transition-colors duration-150"
                        >
                          {/* Left: event info */}
                          <div className="flex-1 min-w-0">
                            {/* Time */}
                            {event.heure_debut && (
                              <p className="text-[13px] font-medium text-[#999] mb-1.5 tracking-wide">
                                {formatTime(event.heure_debut)}
                              </p>
                            )}

                            {/* Title */}
                            <h3 className="font-semibold text-[16px] text-[#1a1a1a] leading-[1.35] line-clamp-2 tracking-[-0.01em] group-hover:text-[#1a1a1a]">
                              {event.nom}
                            </h3>

                            {/* Organizer */}
                            {event.boutiques && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-[18px] h-[18px] rounded-full bg-[#f0f0f0] overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-black/[0.04]">
                                  {event.boutiques.logo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={event.boutiques.logo_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[9px] font-semibold text-[#999]">
                                      {event.boutiques.nom.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[13px] text-[#666] truncate">
                                  Par {event.boutiques.nom}
                                </span>
                              </div>
                            )}

                            {/* Location + capacity + count (all on one line, like Luma) */}
                            <div className="flex items-center gap-0 mt-1.5 text-[13px] text-[#999] min-w-0">
                              {event.lieu && (
                                <span className="truncate max-w-[200px] sm:max-w-[300px]">{event.lieu}</span>
                              )}
                              {capacityLabel && (
                                <>
                                  <span className="mx-2 text-[#ddd]">·</span>
                                  <span className="text-[#e08a00] font-medium whitespace-nowrap">{capacityLabel}</span>
                                </>
                              )}
                              {event.total_vendu > 0 && (
                                <span className="ml-auto pl-4 text-[13px] text-[#999] whitespace-nowrap tabular-nums">
                                  +{event.total_vendu}
                                </span>
                              )}
                            </div>

                            {/* Price hint (subtle, only for paid events) */}
                            {event.min_price > 0 && (
                              <p className="text-[12px] text-[#bbb] mt-1">
                                À partir de {event.min_price.toLocaleString("fr-FR")} {event.devise}
                              </p>
                            )}
                          </div>

                          {/* Right: square cover image (120×120, like Luma) */}
                          <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-xl overflow-hidden bg-[#f5f5f5] shrink-0 ring-1 ring-black/[0.04]">
                            {event.cover_url ? (
                              <Image
                                src={event.cover_url}
                                alt={event.nom}
                                width={120}
                                height={120}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            ) : event.logo_url ? (
                              <div className="w-full h-full bg-gradient-to-br from-[#f8f8f8] to-[#f0f0f0] flex items-center justify-center">
                                <Image
                                  src={event.logo_url}
                                  alt={event.nom}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 rounded-lg object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#f8f8f8] to-[#efefef] flex items-center justify-center">
                                <CalendarDays className="w-7 h-7 text-[#ddd]" />
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center pt-10">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-[14px] font-medium text-[#666] bg-[#f8f8f8] border border-[#eee] rounded-full hover:bg-[#f0f0f0] transition-colors disabled:opacity-50"
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
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-[#f0f0f0]">
        <div className="max-w-[680px] mx-auto px-5 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#1a1a1a] rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">B</span>
              </div>
              <span className="font-semibold text-[14px] tracking-[-0.01em]">Binq</span>
            </Link>
            <div className="flex items-center gap-6 text-[13px] text-[#999]">
              <Link href="/" className="hover:text-[#1a1a1a] transition-colors">
                Accueil
              </Link>
              <Link href="/explorer" className="text-[#1a1a1a] font-medium">
                Explorer
              </Link>
              <Link href="/connexion" className="hover:text-[#1a1a1a] transition-colors">
                Connexion
              </Link>
            </div>
            <p className="text-[12px] text-[#ccc]">
              &copy; {new Date().getFullYear()} Binq
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
