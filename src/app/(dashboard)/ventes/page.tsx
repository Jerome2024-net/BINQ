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
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalRevenus = events.reduce((sum, e) => sum + (parseFloat(e.revenus) || 0), 0);
  const totalBillets = events.reduce((sum, e) => sum + (e.total_vendu || 0), 0);
  const eventsWithSales = events
    .filter((e) => (parseFloat(e.revenus) || 0) > 0 || (e.total_vendu || 0) > 0)
    .sort((a, b) => (parseFloat(b.revenus) || 0) - (parseFloat(a.revenus) || 0));

  return (
    <div className="px-5 pt-8 pb-28">
      {/* Header */}
      <h1 className="text-[22px] font-black tracking-tight text-gray-900">Ventes</h1>

      {/* Total généré — carte principale */}
      <div className="mt-6 bg-gray-900 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Total généré</span>
        </div>
        <p className="text-[32px] font-black text-white leading-none">
          {formatMontant(totalRevenus, devise)}
        </p>
      </div>

      {/* Billets vendus */}
      <div className="mt-3 bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
          <Ticket className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className="text-xl font-black text-gray-900">{totalBillets}</p>
          <p className="text-xs text-gray-400 font-medium">billets vendus</p>
        </div>
      </div>

      {/* Liste des transactions par événement */}
      {eventsWithSales.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Par événement</h2>
          <div className="space-y-2">
            {eventsWithSales.map((evt) => (
              <Link
                key={evt.id}
                href="/evenements"
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3.5 hover:border-gray-200 transition active:scale-[0.99]"
              >
                {/* Logo ou date */}
                {evt.logo_url ? (
                  <img src={evt.logo_url} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 bg-gray-900 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{evt.nom}</p>
                  <p className="text-[11px] text-gray-400">
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
        <div className="mt-12 text-center py-8">
          <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">Aucune vente encore</p>
          <p className="text-xs text-gray-400 mt-1">Partagez vos événements pour vendre des billets</p>
        </div>
      ) : (
        /* Aucun événement */
        <div className="mt-12 text-center py-8">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">Aucun événement</p>
          <p className="text-xs text-gray-400 mt-1">Créez un événement pour commencer à vendre</p>
          <Link
            href="/evenements?action=create"
            className="inline-flex items-center gap-2 mt-5 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm transition hover:bg-gray-800 active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            Créer un événement
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
                  className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5"
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
  );
}
