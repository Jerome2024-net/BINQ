"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  MapPin,
  ChevronRight,
  Plus,
  ArrowLeft,
  Ticket,
  Share2,
  Eye,
  ScanLine,
  ExternalLink,
  Clock,
  Users,
  Loader2,
  Copy,
  Check,
  Printer,
  TrendingUp,
  Sparkles,
  Zap,
} from "lucide-react";
import { type DeviseCode, DEFAULT_DEVISE, formatMontant } from "@/lib/currencies";
import { generateEventPoster } from "@/lib/generatePoster";

interface TicketTypeInfo {
  id: string;
  nom: string;
  prix: number;
  quantite_total: number;
  quantite_vendue: number;
}

interface BoutiqueInfo {
  id: string;
  nom: string;
  slug: string;
}

interface EventInfo {
  id: string;
  nom: string;
  description: string | null;
  date_debut: string;
  heure_debut: string | null;
  date_fin: string | null;
  heure_fin: string | null;
  lieu: string;
  adresse: string | null;
  ville: string | null;
  total_vendu: number;
  revenus: string;
  is_published: boolean;
  logo_url: string | null;
  cover_url: string | null;
  ticket_types?: TicketTypeInfo[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [boutique, setBoutique] = useState<BoutiqueInfo | null>(null);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null);
  const [eventTickets, setEventTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const [devise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("binq_devise") as DeviseCode) || DEFAULT_DEVISE;
    }
    return DEFAULT_DEVISE;
  });

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch("/api/boutiques/me");
        const meData = await meRes.json();

        if (meData.boutique) {
          setBoutique(meData.boutique);
          try {
            const evtRes = await fetch(`/api/events?boutique_id=${meData.boutique.id}`);
            const evtData = await evtRes.json();
            setEvents(Array.isArray(evtData) ? evtData : []);
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [devise]);

  const loadEventTickets = async (eventId: string) => {
    setLoadingTickets(true);
    try {
      const res = await fetch(`/api/events/${eventId}/tickets`);
      const data = await res.json();
      setEventTickets(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setLoadingTickets(false); }
  };

  const handleSelectEvent = (evt: EventInfo) => {
    setSelectedEvent(evt);
    loadEventTickets(evt.id);
  };

  const handleShareEvent = (evt: EventInfo) => {
    const url = `${window.location.origin}/evenement/${evt.id}`;
    if (navigator.share) {
      navigator.share({ title: evt.nom, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDownloadPoster = async (evt: EventInfo) => {
    setGeneratingPoster(true);
    try {
      await generateEventPoster(evt, devise);
    } catch (err) {
      console.error("Erreur génération affiche:", err);
    } finally {
      setGeneratingPoster(false);
    }
  };

  function formatDate(date: string) {
    return new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(time: string | null) {
    if (!time) return "";
    return time.slice(0, 5);
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-neutral-300 animate-spin" />
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // NO BOUTIQUE → Onboarding
  // ═══════════════════════════════════════════
  if (!boutique) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-5 pb-28 lg:pb-10">
        <h1 className="text-2xl font-semibold text-neutral-900 text-center">
          Hi, {user?.prenom || "there"} 👋
        </h1>
        <p className="text-sm text-neutral-400 mt-2 text-center">Start selling tickets in seconds</p>
        <Link
          href="/evenements"
          className="mt-8 w-full max-w-[260px] flex items-center justify-center gap-2 py-2.5 bg-neutral-900 text-white font-medium text-sm rounded-lg hover:bg-neutral-800 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Get Started
        </Link>
      </div>
    );
  }

  // Catégorisation des événements
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  
  const todayEvents = events
    .filter((e) => e.date_debut === todayStr)
    .sort((a, b) => (a.heure_debut || "").localeCompare(b.heure_debut || ""));
  
  const upcomingEvents = events
    .filter((e) => e.date_debut > todayStr)
    .sort((a, b) => a.date_debut.localeCompare(b.date_debut));
  
  const pastEvents = events
    .filter((e) => e.date_debut < todayStr)
    .sort((a, b) => b.date_debut.localeCompare(a.date_debut));

  // ═══════════════════════════════════════════
  // EVENT DETAIL — Luma Style
  // ═══════════════════════════════════════════
  if (selectedEvent) {
    const totalRemaining = selectedEvent.ticket_types?.reduce(
      (a, t) => a + (t.quantite_total - t.quantite_vendue), 0
    ) || 0;
    const totalCapacity = selectedEvent.ticket_types?.reduce((a, t) => a + t.quantite_total, 0) || 1;
    const soldPercent = Math.round(((selectedEvent.total_vendu || 0) / totalCapacity) * 100);

    return (
      <div className="pb-28 lg:pb-10 animate-fade-in">
        {/* Back */}
        <div className="px-4 py-3">
          <button
            onClick={() => { setSelectedEvent(null); setEventTickets([]); }}
            className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        {/* Cover */}
        {selectedEvent.cover_url && (
          <div className="mx-4 rounded-xl overflow-hidden h-48 lg:h-64">
            <img src={selectedEvent.cover_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="px-4">
          {/* Event Info */}
          <div className="mt-4 flex items-start gap-3">
            {selectedEvent.logo_url && (
              <img src={selectedEvent.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-neutral-900">{selectedEvent.nom}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-neutral-400">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(selectedEvent.date_debut)}</span>
                {selectedEvent.heure_debut && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(selectedEvent.heure_debut)}</span>}
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedEvent.lieu}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="border border-neutral-200 rounded-xl p-3 text-center">
              <p className="text-xs text-neutral-400">Revenue</p>
              <p className="text-sm font-semibold text-neutral-900 mt-0.5">{formatMontant(parseFloat(selectedEvent.revenus) || 0, devise)}</p>
            </div>
            <div className="border border-neutral-200 rounded-xl p-3 text-center">
              <p className="text-xs text-neutral-400">Sold</p>
              <p className="text-lg font-semibold text-neutral-900 mt-0.5">{selectedEvent.total_vendu || 0}</p>
            </div>
            <div className="border border-neutral-200 rounded-xl p-3 text-center">
              <p className="text-xs text-neutral-400">Remaining</p>
              <p className="text-lg font-semibold text-neutral-900 mt-0.5">{totalRemaining}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-3 border border-neutral-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-400">Sales progress</span>
              <span className="text-xs font-semibold text-neutral-900">{soldPercent}%</span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-900 rounded-full transition-all duration-700" style={{ width: `${Math.min(soldPercent, 100)}%` }} />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link href={`/evenements?event=${selectedEvent.id}`}
              className="flex items-center justify-center gap-2 bg-neutral-900 text-white py-2.5 rounded-lg font-medium text-sm transition hover:bg-neutral-800 active:scale-[0.98]">
              <ScanLine className="w-4 h-4" /> Scan
            </Link>
            <button onClick={() => handleShareEvent(selectedEvent)}
              className="flex items-center justify-center gap-2 border border-neutral-200 text-neutral-700 py-2.5 rounded-lg font-medium text-sm transition hover:bg-neutral-50 active:scale-[0.98]">
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Copied!" : "Share"}
            </button>
          </div>

          <a href={`/evenement/${selectedEvent.id}`} target="_blank"
            className="mt-2 w-full flex items-center justify-center gap-2 border border-neutral-200 text-neutral-600 py-2.5 rounded-lg text-sm font-medium transition hover:bg-neutral-50">
            <Eye className="w-4 h-4" /> View public page
          </a>

          <button onClick={() => handleDownloadPoster(selectedEvent)} disabled={generatingPoster}
            className="mt-2 w-full flex items-center justify-center gap-2 border border-dashed border-neutral-200 text-neutral-500 py-2.5 rounded-lg text-sm font-medium transition hover:bg-neutral-50 disabled:opacity-50">
            {generatingPoster ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Printer className="w-4 h-4" /> Download QR Poster</>}
          </button>

          {/* Ticket Types */}
          {selectedEvent.ticket_types && selectedEvent.ticket_types.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Tickets</h3>
              <div className="space-y-2">
                {selectedEvent.ticket_types.map((tt) => {
                  const ttSoldPct = tt.quantite_total > 0 ? Math.round((tt.quantite_vendue / tt.quantite_total) * 100) : 0;
                  return (
                    <div key={tt.id} className="border border-neutral-200 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{tt.nom}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{tt.quantite_vendue} / {tt.quantite_total} sold</p>
                        </div>
                        <p className="text-sm font-semibold text-neutral-900">{tt.prix > 0 ? formatMontant(tt.prix, devise) : "Free"}</p>
                      </div>
                      <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-neutral-900 rounded-full transition-all duration-500" style={{ width: `${Math.min(ttSoldPct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-900">
                Participants {!loadingTickets && eventTickets.length > 0 && <span className="text-neutral-400 font-normal">({eventTickets.length})</span>}
              </h3>
              {!loadingTickets && (
                <button onClick={() => loadEventTickets(selectedEvent.id)} className="text-xs text-neutral-400 hover:text-neutral-600 transition">Refresh</button>
              )}
            </div>

            {loadingTickets ? (
              <div className="border border-neutral-200 rounded-xl py-10"><Loader2 className="w-5 h-5 text-neutral-300 animate-spin mx-auto" /></div>
            ) : eventTickets.length === 0 ? (
              <div className="border border-neutral-200 rounded-xl py-10 text-center">
                <Users className="w-6 h-6 text-neutral-200 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">No participants yet</p>
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100">
                {eventTickets.map((t: any) => {
                  const initials = (t.buyer_name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-3">
                      <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-neutral-500">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900">{t.buyer_name}</p>
                        <p className="text-xs text-neutral-400 font-mono">{t.reference}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                        t.statut === "valid" ? "bg-neutral-100 text-neutral-600" :
                        t.statut === "used" ? "bg-neutral-50 text-neutral-400" :
                        "bg-red-50 text-red-500"
                      }`}>
                        {t.statut === "valid" ? "Valid" : t.statut === "used" ? "Used" : t.statut}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link href={`/evenements?event=${selectedEvent.id}`}
            className="mt-6 mb-2 w-full flex items-center justify-center gap-2 text-neutral-400 text-xs py-3 hover:text-neutral-600 transition">
            Manage event <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // DASHBOARD — Luma Style
  // ═══════════════════════════════════════════
  const totalRevenue = events.reduce((sum, e) => sum + (parseFloat(String(e.revenus)) || 0), 0);
  const totalTicketsSold = events.reduce((sum, e) => sum + (e.total_vendu || 0), 0);
  const activeEvents = events.filter((e) => e.date_debut >= todayStr);
  const nextEvent = upcomingEvents[0] || todayEvents[0];

  return (
    <div className="pb-28 lg:pb-10">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-sm text-neutral-400">
          {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}
        </p>
        <h1 className="text-xl font-semibold text-neutral-900 mt-0.5">{user?.prenom || "there"}</h1>

        {events.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="border border-neutral-200 rounded-xl p-3">
              <p className="text-xs text-neutral-400">Revenue</p>
              <p className="text-sm font-semibold text-neutral-900 mt-0.5">{formatMontant(totalRevenue, devise)}</p>
            </div>
            <div className="border border-neutral-200 rounded-xl p-3">
              <p className="text-xs text-neutral-400">Sold</p>
              <p className="text-sm font-semibold text-neutral-900 mt-0.5">{totalTicketsSold}</p>
            </div>
            <div className="border border-neutral-200 rounded-xl p-3">
              <p className="text-xs text-neutral-400">Active</p>
              <p className="text-sm font-semibold text-neutral-900 mt-0.5">{activeEvents.length}</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4">
        {/* Empty */}
        {events.length === 0 ? (
          <div className="mt-12 flex flex-col items-center">
            <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
              <Ticket className="w-6 h-6 text-neutral-300" />
            </div>
            <p className="text-base font-semibold text-neutral-900 text-center">Create your first event</p>
            <p className="text-sm text-neutral-400 mt-1 text-center max-w-[260px]">Start selling tickets for your events in just a few clicks</p>
            <Link href="/evenements?action=create"
              className="mt-6 flex items-center justify-center gap-2 bg-neutral-900 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition hover:bg-neutral-800 active:scale-[0.98]"
            ><Plus className="w-4 h-4" /> Create Event</Link>
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            <div className="flex gap-2 mb-6">
              <Link href="/evenements?action=create"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-neutral-200 text-neutral-700 font-medium text-sm rounded-lg hover:bg-neutral-50 transition active:scale-[0.98]"
              ><Plus className="w-4 h-4" /> New Event</Link>
              <Link href="/evenements?action=scan"
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 text-white font-medium text-sm rounded-lg hover:bg-neutral-800 transition active:scale-[0.98]"
              ><ScanLine className="w-4 h-4" /> Scan</Link>
            </div>

            {/* Next Event — Featured Card */}
            {nextEvent && (() => {
              const nDate = new Date(nextEvent.date_debut + "T00:00:00");
              const diffDays = Math.ceil((nDate.getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000);
              const countdownLabel = diffDays === 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`;
              const totalCap = nextEvent.ticket_types?.reduce((a: number, t: TicketTypeInfo) => a + t.quantite_total, 0) || 1;
              const fillPct = Math.round(((nextEvent.total_vendu || 0) / totalCap) * 100);
              return (
                <button onClick={() => handleSelectEvent(nextEvent)}
                  className="w-full text-left mb-6 rounded-xl overflow-hidden border border-neutral-200 active:scale-[0.99] transition group"
                >
                  {nextEvent.cover_url && (
                    <div className="relative h-40 lg:h-48 overflow-hidden">
                      <img src={nextEvent.cover_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2">
                        <span className="bg-neutral-900/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-md">{countdownLabel}</span>
                      </div>
                    </div>
                  )}
                  <div className="p-3.5">
                    <div className="flex items-start gap-3">
                      {!nextEvent.cover_url && nextEvent.logo_url && (
                        <img src={nextEvent.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-neutral-900 line-clamp-1">{nextEvent.nom}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{nextEvent.lieu}</span>
                          <span>{nextEvent.total_vendu || 0} sold</span>
                        </div>
                        <div className="mt-2 h-1 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${Math.min(fillPct, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })()}

            {/* Today */}
            {todayEvents.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-neutral-900 mb-3">Today</h2>
                <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:space-y-0">
                  {todayEvents.map((evt) => {
                    const evtDate = new Date(evt.date_debut + "T00:00:00");
                    return (
                      <button key={evt.id} onClick={() => handleSelectEvent(evt)}
                        className="w-full flex items-center gap-3 border border-neutral-200 rounded-xl p-3 hover:bg-neutral-50 transition active:scale-[0.99] text-left">
                        {evt.logo_url ? (
                          <img src={evt.logo_url} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-11 h-11 bg-neutral-900 rounded-lg flex flex-col items-center justify-center shrink-0">
                            <span className="text-[8px] font-medium text-neutral-400 uppercase">{evtDate.toLocaleDateString("fr-FR", { month: "short" })}</span>
                            <span className="text-sm font-semibold text-white">{evtDate.getDate()}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{evt.nom}</p>
                          <p className="text-xs text-neutral-400 truncate">{evt.lieu}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcomingEvents.length > (nextEvent === upcomingEvents[0] ? 1 : 0) && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-neutral-900 mb-3">Upcoming</h2>
                <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:space-y-0">
                  {(nextEvent === upcomingEvents[0] ? upcomingEvents.slice(1) : upcomingEvents).map((evt) => {
                    const evtDate = new Date(evt.date_debut + "T00:00:00");
                    const diffDays = Math.ceil((evtDate.getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000);
                    return (
                      <button key={evt.id} onClick={() => handleSelectEvent(evt)}
                        className="w-full flex items-center gap-3 border border-neutral-200 rounded-xl p-3 hover:bg-neutral-50 transition active:scale-[0.99] text-left">
                        {evt.logo_url ? (
                          <img src={evt.logo_url} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-11 h-11 bg-neutral-900 rounded-lg flex flex-col items-center justify-center shrink-0">
                            <span className="text-[8px] font-medium text-neutral-400 uppercase">{evtDate.toLocaleDateString("fr-FR", { month: "short" })}</span>
                            <span className="text-sm font-semibold text-white">{evtDate.getDate()}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-neutral-900 truncate">{evt.nom}</p>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-400 shrink-0">D-{diffDays}</span>
                          </div>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">{evt.lieu}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past */}
            {pastEvents.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-neutral-400 mb-3">Past</h2>
                <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:space-y-0">
                  {pastEvents.map((evt) => {
                    const evtDate = new Date(evt.date_debut + "T00:00:00");
                    return (
                      <button key={evt.id} onClick={() => handleSelectEvent(evt)}
                        className="w-full flex items-center gap-3 border border-neutral-100 rounded-xl p-3 hover:bg-neutral-50 transition active:scale-[0.99] text-left opacity-60 hover:opacity-100">
                        {evt.logo_url ? (
                          <img src={evt.logo_url} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0 grayscale-[30%]" />
                        ) : (
                          <div className="w-11 h-11 bg-neutral-200 rounded-lg flex flex-col items-center justify-center shrink-0">
                            <span className="text-[8px] font-medium text-neutral-400 uppercase">{evtDate.toLocaleDateString("fr-FR", { month: "short" })}</span>
                            <span className="text-sm font-semibold text-neutral-500">{evtDate.getDate()}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-500 truncate">{evt.nom}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-neutral-400">{evt.total_vendu || 0} sold</span>
                            {parseFloat(String(evt.revenus)) > 0 && (
                              <span className="text-xs font-semibold text-neutral-500">{formatMontant(parseFloat(String(evt.revenus)), devise)}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-200 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
