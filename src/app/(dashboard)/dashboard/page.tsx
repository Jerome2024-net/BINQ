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
      <div className="px-5 pt-10 pb-28">
        <h1 className="text-[22px] font-black tracking-tight text-gray-900">
          Salut, {user?.prenom || "là"} 👋
        </h1>

        <div className="mt-20 text-center">
          <p className="text-[44px] font-black tracking-tight text-gray-900 leading-none">0 FCFA</p>
          <p className="text-[13px] text-gray-500 font-semibold mt-3">Aujourd&apos;hui</p>
        </div>

        <div className="mt-14 flex justify-center">
          <Link
            href="/evenements"
            className="w-full max-w-[280px] flex items-center justify-center py-4 bg-emerald-500 text-white font-bold text-[15px] rounded-2xl hover:bg-emerald-400 transition-all active:scale-[0.97]"
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
  // DÉTAIL D'UN ÉVÉNEMENT
  // ═══════════════════════════════════════════
  if (selectedEvent) {
    const totalRemaining = selectedEvent.ticket_types?.reduce(
      (a, t) => a + (t.quantite_total - t.quantite_vendue), 0
    ) || 0;

    return (
      <div className="px-5 pt-8 pb-28 animate-in slide-in-from-right-4 duration-200">
        {/* Retour */}
        <button
          onClick={() => { setSelectedEvent(null); setEventTickets([]); }}
          className="flex items-center gap-1.5 text-sm text-gray-500 font-semibold mb-5 hover:text-gray-700 transition active:scale-[0.97]"
        >
          <ArrowLeft className="w-4 h-4" /> Accueil
        </button>

        {/* Cover */}
        {selectedEvent.cover_url && (
          <div className="w-full h-40 rounded-2xl overflow-hidden mb-4">
            <img src={selectedEvent.cover_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          {selectedEvent.logo_url ? (
            <img src={selectedEvent.logo_url} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
          ) : (
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex flex-col items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                {new Date(selectedEvent.date_debut + "T00:00:00").toLocaleDateString("fr-FR", { month: "short" })}
              </span>
              <span className="text-lg font-black text-white leading-none">
                {new Date(selectedEvent.date_debut + "T00:00:00").getDate()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-gray-900 leading-tight">{selectedEvent.nom}</h1>
            {!selectedEvent.is_published && (
              <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Brouillon</span>
            )}
          </div>
        </div>

        {/* Infos */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 capitalize">{formatDate(selectedEvent.date_debut)}</p>
              {selectedEvent.heure_debut && (
                <p className="text-xs text-gray-400">
                  {formatTime(selectedEvent.heure_debut)}
                  {selectedEvent.heure_fin ? ` — ${formatTime(selectedEvent.heure_fin)}` : ""}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{selectedEvent.lieu}</p>
              {selectedEvent.ville && <p className="text-xs text-gray-400">{selectedEvent.ville}</p>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-gray-900 rounded-xl p-3 text-center">
            <p className="text-sm font-black text-white">{formatMontant(parseFloat(selectedEvent.revenus) || 0, devise)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Revenus</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-gray-900">{selectedEvent.total_vendu || 0}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Vendus</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-gray-900">{totalRemaining}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Restants</p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <Link
            href={`/evenements?event=${selectedEvent.id}`}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm transition hover:bg-gray-800 active:scale-[0.97]"
          >
            <ScanLine className="w-4 h-4" /> Scanner billet
          </Link>
          <button
            onClick={() => handleShareEvent(selectedEvent)}
            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold text-sm transition hover:bg-gray-200 active:scale-[0.97]"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copié !" : "Partager"}
          </button>
        </div>

        {/* Lien page publique */}
        <a
          href={`/evenement/${selectedEvent.id}`}
          target="_blank"
          className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-3 rounded-xl font-bold text-sm mb-6 transition hover:bg-emerald-100 border border-emerald-200/50"
        >
          <Eye className="w-4 h-4" /> Voir la page publique
        </a>

        {/* Types de billets */}
        {selectedEvent.ticket_types && selectedEvent.ticket_types.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Types de billets</h3>
            <div className="space-y-2">
              {selectedEvent.ticket_types.map((tt) => (
                <div key={tt.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{tt.nom}</p>
                    <p className="text-xs text-gray-400">{tt.quantite_vendue}/{tt.quantite_total} vendus</p>
                  </div>
                  <p className="text-sm font-black text-gray-900">
                    {tt.prix > 0 ? formatMontant(tt.prix, devise) : "Gratuit"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-700">Participants</h3>
            {!loadingTickets && (
              <button onClick={() => loadEventTickets(selectedEvent.id)} className="text-xs text-emerald-600 font-semibold">
                Rafraîchir
              </button>
            )}
          </div>
          {loadingTickets ? (
            <div className="text-center py-8"><Loader2 className="w-5 h-5 text-gray-300 animate-spin mx-auto" /></div>
          ) : eventTickets.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Aucun participant pour le moment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventTickets.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.buyer_name}</p>
                    <p className="text-[11px] text-gray-400 font-mono">{t.reference}</p>
                    {t.ticket_types?.nom && <p className="text-[10px] text-gray-400">{t.ticket_types.nom}</p>}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    t.statut === "valid" ? "bg-emerald-50 text-emerald-600" :
                    t.statut === "used" ? "bg-gray-100 text-gray-500" :
                    "bg-red-50 text-red-500"
                  }`}>
                    {t.statut === "valid" ? "✓ Valide" : t.statut === "used" ? "Utilisé" : t.statut}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gérer sur Événements */}
        <Link
          href={`/evenements?event=${selectedEvent.id}`}
          className="w-full flex items-center justify-center gap-2 text-gray-400 text-xs font-semibold mt-6 py-3 hover:text-gray-600 transition"
        >
          Gérer cet événement <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // DASHBOARD EVENT-FIRST
  // ═══════════════════════════════════════════
  return (
    <div className="px-5 pt-10 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-black tracking-tight text-gray-900">
          Salut, {user?.prenom || "là"} 👋
        </h1>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          <span className="text-[10px] font-medium text-gray-400">en ligne</span>
        </div>
      </div>

      {/* Montant central — wallet */}
      <Link href="/portefeuille" className="block mt-14 text-center active:scale-[0.98] transition-transform">
        <p className="text-[44px] font-black tracking-tight text-gray-900 leading-none">
          {formatMontant(walletSolde, devise)}
        </p>
        <p className="text-[13px] text-gray-400 font-medium mt-3">Solde wallet</p>
      </Link>

      {/* CTA principal */}
      <div className="mt-10 flex justify-center">
        <Link
          href="/evenements?action=create"
          className="w-full max-w-[300px] flex items-center justify-center gap-2 py-4 bg-gray-900 text-white font-bold text-[15px] rounded-2xl hover:bg-gray-800 transition-all active:scale-[0.97]"
        >
          <Plus className="w-5 h-5" />
          Créer un événement
        </Link>
      </div>

      {/* Événements à venir */}
      {upcomingEvents.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-gray-900">Prochains événements</h2>
            <Link href="/evenements" className="text-[12px] font-semibold text-emerald-600">Voir tout</Link>
          </div>
          <div className="space-y-2">
            {upcomingEvents.map((evt) => (
              <button
                key={evt.id}
                onClick={() => handleSelectEvent(evt)}
                className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3.5 hover:border-gray-200 transition active:scale-[0.99] text-left"
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
