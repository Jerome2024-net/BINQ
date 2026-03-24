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
} from "lucide-react";
import { type DeviseCode, DEFAULT_DEVISE, formatMontant } from "@/lib/currencies";

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
  const [walletSolde, setWalletSolde] = useState<number>(0);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null);
  const [eventTickets, setEventTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [copied, setCopied] = useState(false);
  const [devise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("binq_devise") as DeviseCode) || DEFAULT_DEVISE;
    }
    return DEFAULT_DEVISE;
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, walletRes] = await Promise.all([
          fetch("/api/boutiques/me"),
          fetch(`/api/wallet?devise=${devise}`),
        ]);
        const [meData, walletData] = await Promise.all([meRes.json(), walletRes.json()]);

        if (meData.boutique) {
          setBoutique(meData.boutique);
          try {
            const evtRes = await fetch(`/api/events?boutique_id=${meData.boutique.id}`);
            const evtData = await evtRes.json();
            setEvents(Array.isArray(evtData) ? evtData : []);
          } catch { /* ignore */ }
        }
        if (walletData.wallet) {
          setWalletSolde(walletData.wallet.solde || 0);
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
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // PAS DE BOUTIQUE → Onboarding
  // ═══════════════════════════════════════════
  if (!boutique) {
    return (
      <div className="px-5 pt-10 pb-28 lg:pb-10">
        <h1 className="text-[22px] lg:text-[28px] font-black tracking-tight text-gray-900">
          Salut, {user?.prenom || "là"} 👋
        </h1>

        <div className="mt-20 text-center">
          <p className="text-[44px] lg:text-[56px] font-black tracking-tight text-gray-900 leading-none">0 FCFA</p>
          <p className="text-[13px] lg:text-sm text-gray-500 font-semibold mt-3">Aujourd&apos;hui</p>
        </div>

        <div className="mt-14 flex justify-center">
          <Link
            href="/evenements"
            className="w-full max-w-[280px] lg:max-w-[320px] flex items-center justify-center py-4 bg-emerald-500 text-white font-bold text-[15px] rounded-2xl hover:bg-emerald-400 transition-all active:scale-[0.97]"
          >
            Commencer
          </Link>
        </div>
      </div>
    );
  }

  // Prochains événements
  const now = new Date().toISOString().split("T")[0];
  const upcomingEvents = events
    .filter((e) => e.date_debut >= now && e.is_published)
    .sort((a, b) => a.date_debut.localeCompare(b.date_debut))
    .slice(0, 3);

  // ═══════════════════════════════════════════
  // DÉTAIL D'UN ÉVÉNEMENT — Design Premium
  // ═══════════════════════════════════════════
  if (selectedEvent) {
    const totalRemaining = selectedEvent.ticket_types?.reduce(
      (a, t) => a + (t.quantite_total - t.quantite_vendue), 0
    ) || 0;
    const totalCapacity = selectedEvent.ticket_types?.reduce((a, t) => a + t.quantite_total, 0) || 1;
    const soldPercent = Math.round(((selectedEvent.total_vendu || 0) / totalCapacity) * 100);
    const eventDate = new Date(selectedEvent.date_debut + "T00:00:00");
    const monthShort = eventDate.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase();
    const dayNum = eventDate.getDate();

    return (
      <div className="pb-28 lg:pb-10 animate-in slide-in-from-right-4 duration-300">
        {/* ── Hero Section ── */}
        <div className="relative">
          {/* Cover / Gradient Hero */}
          <div className="relative h-56 lg:h-72 xl:h-80 overflow-hidden lg:rounded-2xl">
            {selectedEvent.cover_url ? (
              <>
                <img src={selectedEvent.cover_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700" />
            )}

            {/* Floating back button */}
            <button
              onClick={() => { setSelectedEvent(null); setEventTickets([]); }}
              className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition active:scale-[0.93]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Status badge */}
            {!selectedEvent.is_published && (
              <div className="absolute top-4 right-4 bg-orange-500/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
                Brouillon
              </div>
            )}

            {/* Event name on hero */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
              <div className="flex items-end gap-3">
                {selectedEvent.logo_url ? (
                  <img src={selectedEvent.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0 border-2 border-white/30 shadow-lg" />
                ) : (
                  <div className="w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center shrink-0 border border-white/20">
                    <span className="text-[10px] font-bold text-white/70 leading-none">{monthShort}</span>
                    <span className="text-2xl font-black text-white leading-none">{dayNum}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0 pb-0.5">
                  <h1 className="text-[22px] lg:text-[28px] font-black text-white leading-tight drop-shadow-lg">{selectedEvent.nom}</h1>
                  {selectedEvent.is_published && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-[11px] font-semibold text-emerald-300">En ligne</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5">
          {/* ── Infos Date & Lieu ── */}
          <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3.5 px-4 py-3.5 border-b border-gray-50">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                <Calendar className="w-[18px] h-[18px] text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-gray-900 capitalize">{formatDate(selectedEvent.date_debut)}</p>
                {selectedEvent.heure_debut && (
                  <p className="text-[12px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatTime(selectedEvent.heure_debut)}
                    {selectedEvent.heure_fin ? ` — ${formatTime(selectedEvent.heure_fin)}` : ""}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3.5 px-4 py-3.5">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="w-[18px] h-[18px] text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-gray-900">{selectedEvent.lieu}</p>
                {(selectedEvent.adresse || selectedEvent.ville) && (
                  <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                    {[selectedEvent.adresse, selectedEvent.ville].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Stats Cards ── */}
          <div className="mt-4 grid grid-cols-3 gap-2.5 lg:gap-4">
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-3.5 text-center shadow-sm">
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-white/10 rounded-full" />
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Revenus</p>
              <p className="text-[15px] font-black text-white mt-1 leading-tight">{formatMontant(parseFloat(selectedEvent.revenus) || 0, devise)}</p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3.5 text-center shadow-sm">
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-white/10 rounded-full" />
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">Vendus</p>
              <p className="text-2xl font-black text-white mt-1 leading-tight">{selectedEvent.total_vendu || 0}</p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-3.5 text-center shadow-sm">
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-white/10 rounded-full" />
              <p className="text-[10px] font-bold text-violet-100 uppercase tracking-wider">Restants</p>
              <p className="text-2xl font-black text-white mt-1 leading-tight">{totalRemaining}</p>
            </div>
          </div>

          {/* Jauge de ventes */}
          <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold text-gray-600">Progression des ventes</span>
              <span className="text-[12px] font-black text-emerald-600">{soldPercent}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(soldPercent, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">{selectedEvent.total_vendu || 0} sur {totalCapacity} billets vendus</p>
          </div>

          {/* ── Actions rapides ── */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 lg:gap-4">
            <Link
              href={`/evenements?event=${selectedEvent.id}`}
              className="flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-2xl font-bold text-[14px] transition hover:bg-gray-800 active:scale-[0.97] shadow-sm"
            >
              <ScanLine className="w-[18px] h-[18px]" /> Scanner
            </Link>
            <button
              onClick={() => handleShareEvent(selectedEvent)}
              className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-[14px] transition hover:border-gray-300 hover:bg-gray-50 active:scale-[0.97]"
            >
              {copied ? <Check className="w-[18px] h-[18px] text-emerald-500" /> : <Share2 className="w-[18px] h-[18px]" />}
              {copied ? "Copié !" : "Partager"}
            </button>
          </div>

          {/* Voir page publique */}
          <a
            href={`/evenement/${selectedEvent.id}`}
            target="_blank"
            className="mt-2.5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 py-3.5 rounded-2xl font-bold text-[13px] transition hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/60"
          >
            <Eye className="w-4 h-4" /> Voir la page publique
          </a>

          {/* ── Types de billets ── */}
          {selectedEvent.ticket_types && selectedEvent.ticket_types.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Ticket className="w-4 h-4 text-gray-400" />
                <h3 className="text-[14px] font-bold text-gray-900">Billets</h3>
              </div>
              <div className="space-y-2.5">
                {selectedEvent.ticket_types.map((tt) => {
                  const ttSoldPct = tt.quantite_total > 0 ? Math.round((tt.quantite_vendue / tt.quantite_total) * 100) : 0;
                  return (
                    <div key={tt.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-[14px] font-bold text-gray-900">{tt.nom}</p>
                          <p className="text-[12px] text-gray-400 mt-0.5">{tt.quantite_vendue} / {tt.quantite_total} vendus</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[15px] font-black text-gray-900">
                            {tt.prix > 0 ? formatMontant(tt.prix, devise) : "Gratuit"}
                          </p>
                          {tt.prix > 0 && (
                            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                              {formatMontant(tt.prix * tt.quantite_vendue, devise)} gagnés
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(ttSoldPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Participants ── */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <h3 className="text-[14px] font-bold text-gray-900">Participants</h3>
                {!loadingTickets && eventTickets.length > 0 && (
                  <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full">{eventTickets.length}</span>
                )}
              </div>
              {!loadingTickets && (
                <button onClick={() => loadEventTickets(selectedEvent.id)} className="text-[12px] text-emerald-600 font-bold hover:text-emerald-700 transition">
                  Rafraîchir
                </button>
              )}
            </div>

            {loadingTickets ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-10">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
              </div>
            ) : eventTickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-10 text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-[13px] font-semibold text-gray-500">Aucun participant</p>
                <p className="text-[11px] text-gray-400 mt-1">Partagez votre événement pour vendre des billets</p>
              </div>
            ) : (
              <div className="space-y-2">
                {eventTickets.map((t: any, idx: number) => {
                  const initials = (t.buyer_name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                  const colors = [
                    "from-emerald-400 to-emerald-500",
                    "from-blue-400 to-blue-500",
                    "from-violet-400 to-violet-500",
                    "from-amber-400 to-amber-500",
                    "from-rose-400 to-rose-500",
                    "from-cyan-400 to-cyan-500",
                  ];
                  const colorClass = colors[idx % colors.length];

                  return (
                    <div key={t.id} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5">
                      <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center shrink-0`}>
                        <span className="text-[12px] font-black text-white">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-gray-900">{t.buyer_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-gray-400 font-mono">{t.reference}</p>
                          {t.ticket_types?.nom && (
                            <>
                              <span className="text-gray-200">·</span>
                              <p className="text-[11px] text-gray-400">{t.ticket_types.nom}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl ${
                        t.statut === "valid" ? "bg-emerald-50 text-emerald-600" :
                        t.statut === "used" ? "bg-gray-100 text-gray-500" :
                        "bg-red-50 text-red-500"
                      }`}>
                        {t.statut === "valid" ? "✓ Valide" : t.statut === "used" ? "Utilisé" : t.statut}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Gérer sur Événements ── */}
          <Link
            href={`/evenements?event=${selectedEvent.id}`}
            className="mt-6 mb-2 w-full flex items-center justify-center gap-2 text-gray-400 text-[12px] font-semibold py-3 hover:text-gray-600 transition"
          >
            Gérer cet événement <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // DASHBOARD EVENT-FIRST
  // ═══════════════════════════════════════════
  return (
    <div className="px-5 pt-10 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] lg:text-[28px] font-black tracking-tight text-gray-900">
          Salut, {user?.prenom || "là"} 👋
        </h1>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          <span className="text-[10px] font-medium text-gray-400">en ligne</span>
        </div>
      </div>

      {/* Montant central — wallet */}
      <Link href="/portefeuille" className="block mt-14 lg:mt-10 text-center active:scale-[0.98] transition-transform">
        <p className="text-[44px] lg:text-[56px] font-black tracking-tight text-gray-900 leading-none">
          {formatMontant(walletSolde, devise)}
        </p>
        <p className="text-[13px] lg:text-sm text-gray-400 font-medium mt-3">Solde wallet</p>
      </Link>

      {/* CTA principal */}
      <div className="mt-10 flex justify-center">
        <Link
          href="/evenements?action=create"
          className="w-full max-w-[300px] lg:max-w-[360px] flex items-center justify-center gap-2 py-4 bg-gray-900 text-white font-bold text-[15px] rounded-2xl hover:bg-gray-800 transition-all active:scale-[0.97]"
        >
          <Plus className="w-5 h-5" />
          Créer un événement
        </Link>
      </div>

      {/* Événements à venir */}
      {upcomingEvents.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] lg:text-lg font-bold text-gray-900">Prochains événements</h2>
            <Link href="/evenements" className="text-[12px] font-semibold text-emerald-600">Voir tout</Link>
          </div>
          <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:space-y-0">
            {upcomingEvents.map((evt) => (
              <button
                key={evt.id}
                onClick={() => handleSelectEvent(evt)}
                className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3.5 hover:border-gray-200 hover:shadow-sm transition active:scale-[0.99] text-left"
              >
                {evt.logo_url ? (
                  <img src={evt.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                      {new Date(evt.date_debut + "T00:00:00").toLocaleDateString("fr-FR", { month: "short" })}
                    </span>
                    <span className="text-lg font-black text-white leading-none">
                      {new Date(evt.date_debut + "T00:00:00").getDate()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{evt.nom}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-400 truncate">{evt.lieu}</p>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">{evt.total_vendu || 0} billet{(evt.total_vendu || 0) > 1 ? "s" : ""}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pas d'événements */}
      {events.length === 0 && (
        <div className="mt-12 text-center py-8">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">Aucun événement encore</p>
          <p className="text-xs text-gray-400 mt-1">Créez votre premier événement et vendez des billets</p>
        </div>
      )}
    </div>
  );
}
