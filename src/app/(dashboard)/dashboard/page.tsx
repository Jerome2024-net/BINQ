"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Wallet,
  SendHorizonal,
  ArrowDownToLine,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  History,
  RefreshCw,
} from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  montant: number;
  devise: string;
  description: string;
  reference: string;
  statut: string;
  created_at: string;
}

interface Transfer {
  id: string;
  montant: number;
  devise: string;
  message: string | null;
  direction: "sortant" | "entrant";
  expediteur: { prenom: string; nom: string };
  destinataire: { prenom: string; nom: string };
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [showSolde, setShowSolde] = useState(true);
  const [solde, setSolde] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transferts, setTransferts] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet");
      const data = await res.json();
      if (data.wallet) setSolde(data.wallet.solde || 0);
      if (data.transactions) setTransactions(data.transactions);
      if (data.transferts) setTransferts(data.transferts);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // Merge transactions and transfers into a unified activity list
  const activity = [
    ...transactions.map((t) => ({
      id: t.id,
      type: t.type,
      montant: t.montant,
      label:
        t.type === "depot" ? "Dépôt par carte" :
        t.type === "transfert_sortant" ? "Envoi" :
        t.type === "transfert_entrant" ? "Reçu" :
        t.type === "retrait" ? "Retrait" :
        t.description || t.type,
      description: t.description,
      date: t.created_at,
      isCredit: ["depot", "transfert_entrant"].includes(t.type),
    })),
    ...transferts
      .filter((tr) => !transactions.some((t) => t.reference === tr.id))
      .map((tr) => ({
        id: tr.id,
        type: tr.direction === "sortant" ? "transfert_sortant" : "transfert_entrant",
        montant: tr.montant,
        label: tr.direction === "sortant"
          ? `Envoi à ${tr.destinataire.prenom} ${tr.destinataire.nom}`
          : `Reçu de ${tr.expediteur.prenom} ${tr.expediteur.nom}`,
        description: tr.message || "",
        date: tr.created_at,
        isCredit: tr.direction === "entrant",
      })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <Wallet className="w-7 h-7 text-amber-500 animate-pulse" />
        </div>
        <p className="text-sm text-gray-400 font-medium">Synchronisation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">

      {/* Greeting */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Bonjour, <span className="text-amber-600">{user?.prenom || "là"}</span> 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Voici le résumé de votre portefeuille.</p>
      </div>

      {/* ── Balance Card ── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-100/30 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200/50">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Solde disponible</h2>
            </div>
            <button onClick={() => setShowSolde(!showSolde)} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors">
              {showSolde ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <p className="text-4xl sm:text-5xl font-black text-gray-900 tabular-nums tracking-tight">
                {showSolde ? solde.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}
              </p>
              <span className="text-xl sm:text-2xl font-bold text-gray-300">€</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-100">
            <Link href="/deposer" className="flex flex-col items-center gap-2 py-3 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-all">
              <ArrowDownToLine className="w-5 h-5" />
              <span className="text-xs font-bold">Ajouter</span>
            </Link>
            <Link href="/envoyer" className="flex flex-col items-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all">
              <SendHorizonal className="w-5 h-5 text-gray-500" />
              <span className="text-xs font-bold">Envoyer</span>
            </Link>
            <Link href="/portefeuille" className="flex flex-col items-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all">
              <History className="w-5 h-5 text-gray-500" />
              <span className="text-xs font-bold">Historique</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50/60 border border-amber-100/60">
        <CreditCard className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-gray-500">
          Ajoutez de l&apos;argent par carte bancaire (Visa, Mastercard). Frais de dépôt de <span className="font-semibold text-gray-700">1%</span>. Envois entre utilisateurs <span className="font-semibold text-gray-700">gratuits</span>.
        </p>
      </div>

      {/* ── Recent Activity ── */}
      <div className="bg-white border border-gray-200/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="text-base font-bold text-gray-900">Activité récente</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors group">
              <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link href="/portefeuille" className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors">
              Tout voir <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
              <Wallet className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-900 font-bold mb-1">Aucune activité</p>
            <p className="text-gray-400 text-sm max-w-xs">Votre historique apparaîtra ici après votre premier dépôt ou transfert.</p>
            <Link href="/deposer" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all">
              <ArrowDownToLine className="w-4 h-4" />
              Ajouter de l&apos;argent
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activity.map((item) => (
              <div key={item.id} className="flex items-center gap-3 sm:gap-4 p-4 sm:px-6 sm:py-4 hover:bg-gray-50/50 transition-colors">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  item.isCredit ? "bg-green-50 border border-green-100" : "bg-gray-50 border border-gray-100"
                }`}>
                  {item.isCredit
                    ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                    : <ArrowUpRight className="w-4 h-4 text-gray-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold tabular-nums ${item.isCredit ? "text-green-600" : "text-gray-900"}`}>
                    {item.isCredit ? "+" : "-"}{item.montant.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
