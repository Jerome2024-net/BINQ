"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFinance } from "@/contexts/FinanceContext";
import { DashboardSkeleton } from "@/components/Skeleton";
import { formatMontant } from "@/lib/data";
import {
  TrendingUp,
  ArrowRight,
  Wallet,
  ArrowDownToLine,
  PiggyBank,
  Plus,
  Target,
  Sparkles,
  CreditCard,
  History,
} from "lucide-react";

interface Epargne {
  id: string;
  nom: string;
  type_epargne: string;
  solde: number;
  devise: string;
  objectif_montant: number | null;
  statut: string;
  couleur: string;
  icone: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { wallet, getOrCreateWallet, isLoading: financeLoading } = useFinance();

  const [epargnes, setEpargnes] = useState<Epargne[]>([]);
  const [epargneLoading, setEpargneLoading] = useState(true);

  // Initialiser le wallet
  useEffect(() => {
    if (user) {
      getOrCreateWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Charger les comptes épargne
  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetch("/api/epargne");
        const data = await res.json();
        if (res.ok) setEpargnes(data.epargnes || []);
      } catch {
        /* ignore */
      } finally {
        setEpargneLoading(false);
      }
    };
    charger();
  }, []);

  const totalEpargneEUR = epargnes
    .filter((e) => (e.devise || "EUR") === "EUR")
    .reduce((acc, e) => acc + Number(e.solde), 0);
  
  const totalEpargneUSD = epargnes
    .filter((e) => e.devise === "USD")
    .reduce((acc, e) => acc + Number(e.solde), 0);

  const comptesActifs = epargnes.filter((e) => e.statut === "active");

  if (financeLoading || epargneLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header with Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white shadow-xl shadow-indigo-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            {new Date().getHours() < 12 ? "Bonjour" : new Date().getHours() < 18 ? "Bon après-midi" : "Bonsoir"}, {user?.prenom || "là"} 👋
          </h1>
          <p className="text-indigo-100 max-w-lg mb-6 text-lg">
            Heureux de vous revoir. Voici un aperçu de vos finances aujourd&apos;hui.
          </p>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[200px]">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Portefeuille</p>
                <p className="text-2xl font-bold">{formatMontant(wallet?.solde ?? 0)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[200px]">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Épargne Total</p>
                <div className="flex flex-col">
                  {/* Si on a des EUR */}
                  {(totalEpargneEUR > 0 || totalEpargneUSD === 0) && (
                    <span className="text-xl font-bold">{formatMontant(totalEpargneEUR, "EUR")}</span>
                  )}
                  {/* Si on a des USD */}
                  {totalEpargneUSD > 0 && (
                    <span className="text-xl font-bold">{formatMontant(totalEpargneUSD, "USD")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <h2 className="text-lg font-bold text-gray-900">Actions Rapides</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/dashboard/epargne" className="group flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 transition-all group-hover:scale-110 duration-300">
            <Plus className="w-7 h-7 text-indigo-600" />
          </div>
          <span className="font-semibold text-gray-700 group-hover:text-indigo-700 transition-colors">Nouvelle Épargne</span>
        </Link>
        
        <Link href="/portefeuille" className="group flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all duration-300">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-100 transition-all group-hover:scale-110 duration-300">
            <ArrowDownToLine className="w-7 h-7 text-emerald-600" />
          </div>
          <span className="font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors">Déposer</span>
        </Link>
        
        <Link href="/transactions" className="group flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-100 transition-all duration-300">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:bg-amber-100 transition-all group-hover:scale-110 duration-300">
            <History className="w-7 h-7 text-amber-600" />
          </div>
          <span className="font-semibold text-gray-700 group-hover:text-amber-700 transition-colors">Historique</span>
        </Link>

        {/* Placeholder for future feature or Card Setup */}
        <Link href="/dashboard/parametres" className="group flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300">
           <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-gray-100 transition-all group-hover:scale-110 duration-300">
             <CreditCard className="w-7 h-7 text-gray-600" />
           </div>
           <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Gérer Cartes</span>
        </Link>
      </div>

      {/* Mes Comptes Épargne Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Mes Comptes
          </h2>
          <Link href="/dashboard/epargne" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 hover:gap-2 transition-all">
            Tout voir <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {epargnes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Commencez votre aventure</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Créez votre premier compte épargne pour commencer à mettre de l&apos;argent de côté et réaliser vos projets.
            </p>
            <Link href="/dashboard/epargne" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:-translate-y-1">
              <Plus className="w-6 h-6" />
              Créer un compte
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comptesActifs.map((ep) => {
              const progression = ep.objectif_montant
                ? Math.min(100, Math.round((Number(ep.solde) / ep.objectif_montant) * 100))
                : 0;
              
              const isEUR = (ep.devise || "EUR") === "EUR";

              return (
                <Link
                  key={ep.id}
                  href="/dashboard/epargne"
                  className="group relative overflow-hidden bg-white p-6 rounded-3xl border border-gray-100 hover:border-indigo-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-gray-50 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: (ep.couleur || "#6366f1") + "15", color: ep.couleur || "#6366f1" }}>
                      {ep.icone || "💰"}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      ep.type_epargne === "objectif" ? "bg-amber-50 text-amber-700" : 
                      ep.type_epargne === "programmee" ? "bg-purple-50 text-purple-700" : 
                      "bg-indigo-50 text-indigo-700"
                    }`}>
                      {ep.devise || "EUR"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{ep.nom}</h3>
                  <p className="text-sm text-gray-500 mb-4 capitalize">{ep.type_epargne.replace("_", " ")}</p>
                  
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatMontant(ep.solde, ep.devise)}
                    </span>
                  </div>

                  {ep.objectif_montant && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-gray-500">
                        <span>Progression</span>
                        <span className="text-indigo-600">{progression}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-100"
                          style={{ 
                            width: `${progression}%`, 
                            backgroundColor: ep.couleur || "#6366f1" 
                          }} 
                        />
                      </div>
                    </div>
                  )}

                  {!ep.objectif_montant && (
                    <div className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 px-3 py-2 rounded-lg w-fit">
                      <Sparkles className="w-3 h-3" />
                      Épargne libre
                    </div>
                  )}
                </Link>
              );
            })}
            
            {/* Carte "Créer nouveau" à la fin de la liste */}
            <Link href="/dashboard/epargne" className="group flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-300 min-h-[200px]">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 mb-4 text-indigo-600">
                <Plus className="w-8 h-8" />
              </div>
              <span className="font-semibold text-gray-600 group-hover:text-indigo-700">Créer un nouveau compte</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
