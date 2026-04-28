"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";
import {
  TrendingUp,
  Ticket,
  Calendar,
  Plus,
  ChevronRight,
  Loader2,
  Sparkles,
  Zap,
  BarChart3,
} from "lucide-react";

interface EventSale {
  id: string;
  nom: string;
  date_debut: string;
  lieu: string;
  ville: string | null;
  total_vendu: number;
  revenus: string;
  logo_url: string | null;
}

export default function VentesPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [devise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("binq_devise") as DeviseCode) || "XOF";
    }
    return "XOF";
  });

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch("/api/boutiques/me");
        const meData = await meRes.json();
        if (meData.boutique) {
          const evtRes = await fetch(`/api/events?boutique_id=${meData.boutique.id}`);
          const evtData = await evtRes.json();
          setEvents(Array.isArray(evtData) ? evtData : []);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalRevenus = events.reduce((sum, e) => sum + (parseFloat(e.revenus) || 0), 0);
  const totalBillets = events.reduce((sum, e) => sum + (e.total_vendu || 0), 0);
  const eventsWithSales = events
    .filter((e) => (parseFloat(e.revenus) || 0) > 0 || (e.total_vendu || 0) > 0)
    .sort((a, b) => (parseFloat(b.revenus) || 0) - (parseFloat(a.revenus) || 0));

  const avgRevenuePerTicket = totalBillets > 0 ? totalRevenus / totalBillets : 0;
  const bestEvent = eventsWithSales[0] || null;

  return (
    <div className="px-5 pt-8 pb-28 lg:pb-10 min-h-screen bg-gradient-to-br from-[#f7f9fe] via-[#fafbff] to-[#f3f5fd] relative overflow-hidden">
      <div className="absolute -top-24 -left-32 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-36 w-80 h-80 bg-indigo-300/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Performance</p>
        </div>
        <h1 className="text-[24px] lg:text-[32px] font-black tracking-tight text-gray-900">Ventes</h1>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-200" />
              <span className="text-xs text-blue-100 font-semibold uppercase tracking-wide">Total généré</span>
            </div>
            <p className="text-[28px] font-black leading-none">{formatMontant(totalRevenus, devise)}</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/80">
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">Billets</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{totalBillets}</p>
            <p className="text-xs text-gray-500 mt-1">vendus</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/80">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-violet-500" />
              <span className="text-xs text-violet-600 font-semibold uppercase tracking-wide">Ticket moyen</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{formatMontant(avgRevenuePerTicket, devise)}</p>
            <p className="text-xs text-gray-500 mt-1">par billet vendu</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/80">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600 font-semibold uppercase tracking-wide">Top event</span>
            </div>
            <p className="text-sm font-black text-gray-900 truncate">{bestEvent?.nom || "Aucun"}</p>
            <p className="text-xs text-gray-500 mt-1">meilleure billetterie</p>
          </div>
        </div>

      {/* Liste des transactions par événement */}
      {eventsWithSales.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Par billetterie</h2>
          <div className="space-y-2">
            {eventsWithSales.map((evt) => (
              <Link
                key={evt.id}
                href="/evenements"
                className="flex items-center gap-3 bg-white/75 backdrop-blur-sm rounded-xl border border-white/80 p-3.5 hover:border-blue-200 hover:bg-blue-50/40 transition-all duration-300 active:scale-[0.99]"
              >
                {/* Logo ou date */}
                {evt.logo_url ? (
                  <img src={evt.logo_url} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-white/80" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{evt.nom}</p>
                  <p className="text-[11px] text-gray-500">
                    {evt.total_vendu} billet{evt.total_vendu > 1 ? "s" : ""}
                  </p>
                </div>
                <p className="text-sm font-black text-gray-900 shrink-0">
                  {formatMontant(parseFloat(evt.revenus) || 0, devise)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : events.length > 0 ? (
        /* Événements existent mais aucune vente */
        <div className="mt-12 text-center py-8 bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl">
          <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">Aucune vente encore</p>
          <p className="text-xs text-gray-400 mt-1">Partagez vos billetteries pour vendre des billets</p>
        </div>
      ) : (
        /* Aucun événement */
        <div className="mt-12 text-center py-8 bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">Aucune billetterie</p>
          <p className="text-xs text-gray-400 mt-1">Créez une billetterie pour commencer à vendre</p>
          <Link
            href="/evenements?action=create"
            className="inline-flex items-center gap-2 mt-5 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-sm transition hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            Créer une billetterie
          </Link>
        </div>
      )}

      {/* Tous les événements — incluant ceux sans ventes */}
      {events.length > 0 && eventsWithSales.length < events.length && eventsWithSales.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Sans ventes</h2>
          <div className="space-y-2">
            {events
              .filter((e) => (parseFloat(e.revenus) || 0) === 0 && (e.total_vendu || 0) === 0)
              .map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center gap-3 bg-white/45 border border-white/70 rounded-xl p-3.5"
                >
                  <div className="w-11 h-11 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-500 truncate">{evt.nom}</p>
                    <p className="text-[11px] text-gray-300">0 billet</p>
                  </div>
                  <p className="text-sm font-bold text-gray-300 shrink-0">
                    {formatMontant(0, devise)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
