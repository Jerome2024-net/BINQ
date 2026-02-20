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
} from "lucide-react";

interface Epargne {
  id: string;
  nom: string;
  type_epargne: string;
  solde: number;
  objectif_montant: number | null;
  statut: string;
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

  const totalEpargne = epargnes.reduce((acc, e) => acc + Number(e.solde), 0);
  const comptesActifs = epargnes.filter((e) => e.statut === "active");

  if (financeLoading || epargneLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {new Date().getHours() < 12 ? "Bonjour" : new Date().getHours() < 18 ? "Bon après-midi" : "Bonsoir"}, {user?.prenom || "là"} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {epargnes.length === 0
            ? "Bienvenue sur Binq ! Commencez par créer votre premier compte épargne."
            : `Vous avez ${comptesActifs.length} compte${comptesActifs.length > 1 ? "s" : ""} d'épargne actif${comptesActifs.length > 1 ? "s" : ""}.`}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link href="/dashboard/epargne" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
            <PiggyBank className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Mon Épargne</span>
        </Link>
        <Link href="/portefeuille" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
            <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Déposer</span>
        </Link>
        <Link href="/transactions" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all group">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Historique</span>
        </Link>
      </div>

      {/* Onboarding Banner for new users */}
      {epargnes.length === 0 && (
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💰</span>
              <h2 className="text-xl font-bold text-gray-900">Bienvenue sur Binq !</h2>
            </div>
            <p className="text-gray-600 mb-6 max-w-lg">
              Épargnez simplement et à votre rythme. Créez un compte épargne libre, avec objectif ou programmé, et regardez votre argent fructifier avec un bonus mensuel de 1%/an.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { step: "1", title: "Créez un compte", desc: "Libre, avec objectif ou épargne programmée", icon: Plus },
                { step: "2", title: "Déposez de l'argent", desc: "Via portefeuille ou carte bancaire", icon: ArrowDownToLine },
                { step: "3", title: "Gagnez des intérêts", desc: "Bonus mensuel de 1%/an sur votre solde", icon: Sparkles },
              ].map((item) => (
                <div key={item.step} className="bg-white/70 rounded-xl p-4 border border-indigo-100">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm mb-2">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/epargne" className="btn-primary flex items-center gap-2">
                <PiggyBank className="w-5 h-5" />
                Créer mon premier compte épargne
              </Link>
              <Link href="/portefeuille" className="btn-secondary flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Alimenter mon portefeuille
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Quick View */}
      <Link href="/portefeuille" className="block">
        <div className="relative overflow-hidden bg-gray-900 rounded-xl p-6 text-white shadow-lg shadow-gray-200/50 transition-transform active:scale-[0.99]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Solde portefeuille</p>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{formatMontant(wallet?.solde ?? 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
              <ArrowDownToLine className="w-4 h-4" />
              Déposer
            </div>
          </div>
        </div>
      </Link>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total épargné</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{totalEpargne.toLocaleString("fr-FR")} F</p>
            <p className="text-xs text-indigo-600 font-medium mt-1">Tous comptes confondus</p>
          </div>
          <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
            <PiggyBank className="w-5 h-5 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Comptes actifs</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{comptesActifs.length}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">sur {epargnes.length} créé{epargnes.length > 1 ? "s" : ""}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Portefeuille</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{formatMontant(wallet?.solde ?? 0)}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Disponible</p>
          </div>
          <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <Wallet className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Mes Comptes Épargne */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-indigo-600" />
            Mes Comptes Épargne
          </h2>
          <Link href="/dashboard/epargne" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1">
            Gérer <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {epargnes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <PiggyBank className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun compte épargne</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Créez votre premier compte épargne pour commencer à mettre de l&apos;argent de côté.
            </p>
            <Link href="/dashboard/epargne" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Créer un compte épargne
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {comptesActifs.map((ep) => {
              const progression = ep.objectif_montant
                ? Math.min(100, Math.round((Number(ep.solde) / ep.objectif_montant) * 100))
                : null;

              return (
                <Link
                  key={ep.id}
                  href="/dashboard/epargne"
                  className="block p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        ep.type_epargne === "objectif" ? "bg-amber-100" : ep.type_epargne === "programmee" ? "bg-purple-100" : "bg-indigo-100"
                      }`}>
                        {ep.type_epargne === "objectif" ? (
                          <Target className="w-5 h-5 text-amber-600" />
                        ) : ep.type_epargne === "programmee" ? (
                          <Sparkles className="w-5 h-5 text-purple-600" />
                        ) : (
                          <PiggyBank className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{ep.nom}</h3>
                        <p className="text-xs text-gray-500 capitalize">{ep.type_epargne === "programmee" ? "Programmée" : ep.type_epargne === "objectif" ? "Objectif" : "Libre"}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{Number(ep.solde).toLocaleString("fr-FR")} F</span>
                  </div>

                  {progression !== null && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">Objectif : {ep.objectif_montant!.toLocaleString("fr-FR")} F</span>
                        <span className="text-xs font-bold text-indigo-600">{progression}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progression}%` }}></div>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
