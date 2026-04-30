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
  QrCode,
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
  // NO BOUTIQUE → Premium Onboarding
  // ═══════════════════════════════════════════
  if (!boutique) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f9fe] via-[#fafbff] to-[#f3f5fd] flex flex-col items-center justify-center px-4 relative overflow-hidden pb-28 lg:pb-10">
        {/* Halos de fond */}
        <div className="absolute -top-32 -left-40 w-96 h-96 bg-blue-300/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-32 w-80 h-80 bg-indigo-300/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-200/40 backdrop-blur-sm">
            <Sparkles className="w-10 h-10 text-blue-600" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Bienvenue, {user?.prenom || "explorez"} 👋</h1>
          <p className="text-base text-gray-600 mt-3">Créez votre première billetterie en moins d&apos;une minute</p>
          
          <Link
            href="/evenements"
            className="mt-8 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" /> Commencer
          </Link>
          
          <div className="mt-12 space-y-3">
            <div className="flex items-center gap-3 text-left bg-white/50 backdrop-blur-sm border border-white/80 rounded-lg p-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Créez vos billetteries</p>
                <p className="text-xs text-gray-600">Configurez événements et billets</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-left bg-white/50 backdrop-blur-sm border border-white/80 rounded-lg p-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Générez des QR codes</p>
                <p className="text-xs text-gray-600">Un QR par billetterie</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-left bg-white/50 backdrop-blur-sm border border-white/80 rounded-lg p-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Scannez les billets</p>
                <p className="text-xs text-gray-600">Validez l&apos;accès instantanément</p>
              </div>
            </div>
          </div>
        </div>
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
  // EVENT DETAIL — Premium Design
  // ═══════════════════════════════════════════
  if (selectedEvent) {
    const totalRemaining = selectedEvent.ticket_types?.reduce(
      (a, t) => a + (t.quantite_total - t.quantite_vendue), 0
    ) || 0;
    const totalCapacity = selectedEvent.ticket_types?.reduce((a, t) => a + t.quantite_total, 0) || 1;
    const soldPercent = Math.round(((selectedEvent.total_vendu || 0) / totalCapacity) * 100);

    return (
      <div className="pb-28 lg:pb-10 animate-fade-in bg-gradient-to-br from-[#f7f9fe] via-[#fafbff] to-[#f3f5fd] min-h-screen relative overflow-hidden">
        {/* Halos */}
        <div className="absolute -top-32 -right-40 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-blue-300/8 rounded-full blur-3xl pointer-events-none" />

        {/* Back Button */}
        <div className="relative z-10 px-4 sm:px-6 py-3">
          <button
            onClick={() => { setSelectedEvent(null); setEventTickets([]); }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          {/* Cover Image */}
          {selectedEvent.cover_url && (
            <div className="rounded-2xl overflow-hidden h-48 sm:h-64 mb-6 border border-white/50 shadow-lg">
              <img src={selectedEvent.cover_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Event Header */}
          <div className="flex items-start gap-4 mb-6">
            {selectedEvent.logo_url && (
              <img src={selectedEvent.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/50 shadow-md" />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{selectedEvent.nom}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-500" /> {formatDate(selectedEvent.date_debut)}</span>
                {selectedEvent.heure_debut && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-500" /> {formatTime(selectedEvent.heure_debut)}</span>}
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-violet-500" /> {selectedEvent.lieu}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid Premium */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="group bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-200/40 rounded-xl p-4 backdrop-blur-lg">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Revenus</p>
              <p className="text-lg sm:text-xl font-black text-gray-900">{formatMontant(parseFloat(selectedEvent.revenus) || 0, devise)}</p>
            </div>
            <div className="group bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-200/40 rounded-xl p-4 backdrop-blur-lg">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Vendus</p>
              <p className="text-lg sm:text-xl font-black text-gray-900">{selectedEvent.total_vendu || 0}</p>
            </div>
            <div className="group bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-200/40 rounded-xl p-4 backdrop-blur-lg">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Restants</p>
              <p className="text-lg sm:text-xl font-black text-gray-900">{totalRemaining}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">Avancement des ventes</span>
              <span className="text-sm font-black text-blue-600">{soldPercent}%</span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700" 
                style={{ width: `${Math.min(soldPercent, 100)}%` }} 
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link href={`/evenements?event=${selectedEvent.id}`}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]">
              <ScanLine className="w-4 h-4" /> Scanner
            </Link>
            <button onClick={() => handleShareEvent(selectedEvent)}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-900 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-gray-50 active:scale-[0.98]">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Copié !" : "Partager"}
            </button>
          </div>

          <a href={`/evenement/${selectedEvent.id}`} target="_blank"
            className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-900 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-white/60 mb-3">
            <Eye className="w-4 h-4" /> Voir la page publique
          </a>

          <button onClick={() => handleDownloadPoster(selectedEvent)} disabled={generatingPoster}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 text-gray-600 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-white/40 disabled:opacity-50 mb-6">
            {generatingPoster ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération...</> : <><Printer className="w-4 h-4" /> Télécharger l&apos;affiche QR</>}
          </button>

          {/* Ticket Types */}
          {selectedEvent.ticket_types && selectedEvent.ticket_types.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-600" />
                Types de billets
              </h3>
              <div className="space-y-2">
                {selectedEvent.ticket_types.map((tt) => {
                  const ttSoldPct = tt.quantite_total > 0 ? Math.round((tt.quantite_vendue / tt.quantite_total) * 100) : 0;
                  return (
                    <div key={tt.id} className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-xl p-3 hover:bg-white/80 transition-all duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{tt.nom}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{tt.quantite_vendue} / {tt.quantite_total} vendus</p>
                        </div>
                        <p className="text-sm font-black text-gray-900">{tt.prix > 0 ? formatMontant(tt.prix, devise) : "Gratuit"}</p>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(ttSoldPct, 100)}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Participants {!loadingTickets && eventTickets.length > 0 && <span className="text-gray-600 font-normal text-xs">({eventTickets.length})</span>}
              </h3>
              {!loadingTickets && (
                <button onClick={() => loadEventTickets(selectedEvent.id)} className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition">Actualiser</button>
              )}
            </div>

            {loadingTickets ? (
              <div className="bg-white/60 border border-white/80 rounded-xl py-10 flex justify-center">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              </div>
            ) : eventTickets.length === 0 ? (
              <div className="bg-white/60 border border-white/80 rounded-xl py-10 text-center">
                <Users className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun participant encore</p>
              </div>
            ) : (
              <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-xl divide-y divide-gray-200 overflow-hidden">
                {eventTickets.map((t: any) => {
                  const initials = (t.buyer_name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-3 hover:bg-white/40 transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{t.buyer_name}</p>
                        <p className="text-xs text-gray-600 font-mono">{t.reference}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                        t.statut === "valid" ? "bg-green-100 text-green-700" :
                        t.statut === "used" ? "bg-gray-100 text-gray-600" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {t.statut === "valid" ? "Valide" : t.statut === "used" ? "Utilisé" : t.statut}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // DASHBOARD — Premium Design
  // ═══════════════════════════════════════════
  const totalRevenue = events.reduce((sum, e) => sum + (parseFloat(String(e.revenus)) || 0), 0);
  const totalTicketsSold = events.reduce((sum, e) => sum + (e.total_vendu || 0), 0);
  const activeEvents = events.filter((e) => e.date_debut >= todayStr);
  const nextEvent = upcomingEvents[0] || todayEvents[0];

  return (
    <div className="pb-28 lg:pb-10 bg-gradient-to-br from-[#f7f9fe] via-[#fafbff] to-[#f3f5fd] relative overflow-hidden min-h-screen">
      {/* Halos de fond */}
      <div className="absolute -top-24 -left-32 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-16 -right-40 w-80 h-80 bg-indigo-300/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-violet-300/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header Premium */}
        <div className="px-4 sm:px-6 pt-6 pb-6 border-b border-white/40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wide">
              {new Date().getHours() < 12 ? "Bonjour" : new Date().getHours() < 18 ? "Bon après-midi" : "Bon soir"}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1 tracking-tight">{user?.prenom || "là"}, bienvenue 👋</h1>
          </div>
        </div>

        {/* Stats Cards Premium */}
        {events.length > 0 && (
          <div className="px-4 sm:px-6 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Revenue */}
                <div className="group bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-200/40 rounded-2xl p-4 sm:p-5 backdrop-blur-lg hover:from-blue-500/15 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Revenus</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-gray-900">{formatMontant(totalRevenue, devise)}</p>
                  <p className="text-xs text-gray-500 mt-2">Total généré</p>
                </div>

                {/* Tickets Sold */}
                <div className="group bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-200/40 rounded-2xl p-4 sm:p-5 backdrop-blur-lg hover:from-indigo-500/15 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Ventes</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-gray-900">{totalTicketsSold}</p>
                  <p className="text-xs text-gray-500 mt-2">billets vendus</p>
                </div>

                {/* Active Events */}
                <div className="group bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-200/40 rounded-2xl p-4 sm:p-5 backdrop-blur-lg hover:from-violet-500/15 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Actifs</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-gray-900">{activeEvents.length}</p>
                  <p className="text-xs text-gray-500 mt-2">événements en cours</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Empty State */}
          {events.length === 0 ? (
            <div className="mt-16 flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-3xl flex items-center justify-center mb-6 border border-blue-200/40">
                <Ticket className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-gray-900 text-center">Créez votre premier événement</h2>
              <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">Commencez à vendre des billets en seulement quelques clics</p>
              <Link href="/evenements?action=create"
                className="mt-8 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
              ><Plus className="w-5 h-5" /> Nouvelle billetterie</Link>
            </div>
          ) : (
            <div className="py-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <Link href="/evenements?action=create"
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 text-gray-900 font-semibold text-sm rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 active:scale-[0.98] backdrop-blur-sm"
                ><Plus className="w-4 h-4" /> Nouvelle billetterie</Link>
                <Link href="/evenements"
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
                ><ScanLine className="w-4 h-4" /> Scanner</Link>
              </div>

              {/* Featured Event Card */}
              {nextEvent && (() => {
                const nDate = new Date(nextEvent.date_debut + "T00:00:00");
                const diffDays = Math.ceil((nDate.getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000);
                const countdownLabel = diffDays === 0 ? "Aujourd'hui" : diffDays === 1 ? "Demain" : `Dans ${diffDays}j`;
                const totalCap = nextEvent.ticket_types?.reduce((a: number, t: TicketTypeInfo) => a + t.quantite_total, 0) || 1;
                const fillPct = Math.round(((nextEvent.total_vendu || 0) / totalCap) * 100);
                return (
                  <button onClick={() => handleSelectEvent(nextEvent)}
                    className="w-full text-left mb-8 rounded-2xl overflow-hidden bg-white border border-gray-200/50 active:scale-[0.99] transition-all duration-300 group hover:shadow-xl hover:shadow-gray-900/5 backdrop-blur-sm"
                  >
                    {nextEvent.cover_url && (
                      <div className="relative h-40 sm:h-48 overflow-hidden">
                        <img src={nextEvent.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-lg">
                            <Sparkles className="w-3 h-3" /> {countdownLabel}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        {!nextEvent.cover_url && nextEvent.logo_url && (
                          <img src={nextEvent.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-200" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{nextEvent.nom}</h3>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-500" /> {nextEvent.lieu}</span>
                            <span className="flex items-center gap-1"><Ticket className="w-3.5 h-3.5 text-indigo-500" /> {nextEvent.total_vendu || 0} vendus</span>
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(fillPct, 100)}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{fillPct}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })()}

              {/* Today Events */}
              {todayEvents.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    Événements d&apos;aujourd&apos;hui
                  </h2>
                  <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:space-y-0">
                    {todayEvents.map((evt) => {
                      const evtDate = new Date(evt.date_debut + "T00:00:00");
                      return (
                        <button key={evt.id} onClick={() => handleSelectEvent(evt)}
                          className="w-full text-left flex items-center gap-3 bg-white border border-gray-200/50 rounded-xl p-3 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300 active:scale-[0.99] group"
                        >
                          {evt.logo_url ? (
                            <img src={evt.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-200" />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex flex-col items-center justify-center shrink-0">
                              <span className="text-[9px] font-semibold text-white/70 uppercase">{evtDate.toLocaleDateString("fr-FR", { month: "short" })}</span>
                              <span className="text-sm font-black text-white">{evtDate.getDate()}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{evt.nom}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{evt.lieu}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-blue-500 transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upcoming Events */}
              {upcomingEvents.length > (nextEvent === upcomingEvents[0] ? 1 : 0) && (
                <div className="mb-8">
                  <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    À venir
                  </h2>
                  <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:space-y-0">
                    {(nextEvent === upcomingEvents[0] ? upcomingEvents.slice(1) : upcomingEvents).map((evt) => {
                      const evtDate = new Date(evt.date_debut + "T00:00:00");
                      const diffDays = Math.ceil((evtDate.getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000);
                      return (
                        <button key={evt.id} onClick={() => handleSelectEvent(evt)}
                          className="w-full text-left flex items-center gap-3 bg-white border border-gray-200/50 rounded-xl p-3 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-300 active:scale-[0.99] group"
                        >
                          {evt.logo_url ? (
                            <img src={evt.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-200" />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex flex-col items-center justify-center shrink-0">
                              <span className="text-[9px] font-semibold text-white/70 uppercase">{evtDate.toLocaleDateString("fr-FR", { month: "short" })}</span>
                              <span className="text-sm font-black text-white">{evtDate.getDate()}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 truncate">{evt.nom}</p>
                              <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-lg bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 shrink-0">D-{diffDays}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{evt.lieu}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-indigo-500 transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Past Events */}
              {pastEvents.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">Passé</h2>
                  <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:space-y-0">
                    {pastEvents.map((evt) => {
                      const evtDate = new Date(evt.date_debut + "T00:00:00");
                      return (
                        <button key={evt.id} onClick={() => handleSelectEvent(evt)}
                          className="w-full text-left flex items-center gap-3 bg-white/40 border border-gray-100 rounded-xl p-3 hover:bg-white/60 transition-all duration-300 active:scale-[0.99] group opacity-60 hover:opacity-100"
                        >
                          {evt.logo_url ? (
                            <img src={evt.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 grayscale-[30%]" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex flex-col items-center justify-center shrink-0">
                              <span className="text-[9px] font-semibold text-gray-400 uppercase">{evtDate.toLocaleDateString("fr-FR", { month: "short" })}</span>
                              <span className="text-sm font-black text-gray-500">{evtDate.getDate()}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-600 truncate">{evt.nom}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500">{evt.total_vendu || 0} vendus</span>
                              {parseFloat(String(evt.revenus)) > 0 && (
                                <span className="text-xs font-semibold text-gray-600">{formatMontant(parseFloat(String(evt.revenus)), devise)}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-200 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
