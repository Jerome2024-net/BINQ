"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, MapPin, ChevronRight, Plus } from "lucide-react";
import { type DeviseCode, DEFAULT_DEVISE, formatMontant } from "@/lib/currencies";

interface BoutiqueInfo {
  id: string;
  nom: string;
  slug: string;
}

interface EventInfo {
  id: string;
  nom: string;
  date_debut: string;
  heure_debut: string | null;
  lieu: string;
  ville: string | null;
  total_vendu: number;
  revenus: string;
  is_published: boolean;
  logo_url: string | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [boutique, setBoutique] = useState<BoutiqueInfo | null>(null);
  const [walletSolde, setWalletSolde] = useState<number>(0);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);
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
              <Link
                key={evt.id}
                href="/evenements"
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3.5 hover:border-gray-200 transition active:scale-[0.99]"
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
              </Link>
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
