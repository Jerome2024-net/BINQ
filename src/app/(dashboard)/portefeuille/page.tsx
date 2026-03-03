"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Wallet,
  SendHorizonal,
  ArrowDownToLine,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  montant: number;
  devise: string;
  description: string;
  reference: string;
  statut: string;
  meta_frais?: number;
  created_at: string;
}

interface Transfer {
  id: string;
  montant: number;
  devise: string;
  message: string | null;
  reference: string;
  direction: "sortant" | "entrant";
  expediteur: { prenom: string; nom: string };
  destinataire: { prenom: string; nom: string };
  created_at: string;
}

type FilterType = "all" | "depot" | "envoi" | "recu";

export default function PortefeuillePage() {
  const { user } = useAuth();
  const [showSolde, setShowSolde] = useState(true);
  const [solde, setSolde] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transferts, setTransferts] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Build unified activity list
  const allActivity = [
    ...transactions.map((t) => ({
      id: t.id,
      type: t.type,
      montant: t.montant,
      label:
        t.type === "depot" ? "Dépôt par carte" :
        t.type === "transfert_sortant" ? "Envoi" :
        t.type === "transfert_entrant" ? "Reçu" :
        t.type === "retrait" ? "Retrait" :
        t.type === "commission" ? "Frais" :
        t.description || t.type,
      description: t.description,
      reference: t.reference,
      date: t.created_at,
      isCredit: ["depot", "transfert_entrant"].includes(t.type),
      frais: t.meta_frais || 0,
    })),
    ...transferts
      .filter((tr) => !transactions.some((t) => t.reference === tr.reference))
      .map((tr) => ({
        id: tr.id,
        type: tr.direction === "sortant" ? "transfert_sortant" : "transfert_entrant",
        montant: tr.montant,
        label: tr.direction === "sortant"
          ? `Envoi à ${tr.destinataire.prenom} ${tr.destinataire.nom}`
          : `Reçu de ${tr.expediteur.prenom} ${tr.expediteur.nom}`,
        description: tr.message || "",
        reference: tr.reference || "",
        date: tr.created_at,
        isCredit: tr.direction === "entrant",
        frais: 0,
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Apply filters
  const filtered = allActivity.filter((item) => {
    if (filter === "depot" && item.type !== "depot") return false;
    if (filter === "envoi" && item.type !== "transfert_sortant") return false;
    if (filter === "recu" && item.type !== "transfert_entrant") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.reference.toLowerCase().includes(q);
    }
    return true;
  });

  // Stats
  const totalDepose = allActivity.filter((a) => a.type === "depot").reduce((s, a) => s + a.montant, 0);
  const totalEnvoye = allActivity.filter((a) => a.type === "transfert_sortant").reduce((s, a) => s + a.montant, 0);
  const totalRecu = allActivity.filter((a) => a.type === "transfert_entrant").reduce((s, a) => s + a.montant, 0);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <Wallet className="w-7 h-7 text-amber-500 animate-pulse" />
        </div>
        <p className="text-sm text-gray-400 font-medium">Chargement du portefeuille...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 pb-12">

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Mon <span className="text-amber-600">Portefeuille</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Gérez votre argent, envoyez et recevez en toute simplicité.</p>
      </div>

      {/* ── Balance Card ── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-sm">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-100/40 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200/50">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Solde disponible</p>
              </div>
              <button onClick={() => setShowSolde(!showSolde)} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors">
                {showSolde ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight tabular-nums">
                {showSolde ? solde.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}
              </p>
              <span className="text-xl sm:text-3xl font-bold text-gray-300">€</span>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:min-w-[200px]">
            <Link href="/deposer" className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all shadow-sm text-sm">
              <ArrowDownToLine className="w-4 h-4" />
              Ajouter de l&apos;argent
            </Link>
            <Link href="/envoyer" className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition-all text-sm">
              <SendHorizonal className="w-4 h-4 text-gray-400" />
              Envoyer de l&apos;argent
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Total déposé</p>
            <p className="text-sm font-bold text-gray-900 tabular-nums">{totalDepose.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Total envoyé</p>
            <p className="text-sm font-bold text-gray-900 tabular-nums">{totalEnvoye.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Total reçu</p>
            <p className="text-sm font-bold text-green-600 tabular-nums">{totalRecu.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
          </div>
        </div>
      </div>

      {/* ── Transaction History ── */}
      <div className="bg-white border border-gray-200/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6 border-b border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Historique des transactions</h2>
            <button onClick={fetchData} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors group">
              <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Filters + Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              />
            </div>
            <div className="flex gap-1.5">
              {([
                { key: "all", label: "Tout" },
                { key: "depot", label: "Dépôts" },
                { key: "envoi", label: "Envoyés" },
                { key: "recu", label: "Reçus" },
              ] as { key: FilterType; label: string }[]).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    filter === f.key
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-base font-bold text-gray-900 mb-1">Aucune transaction</p>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              {filter !== "all" || searchQuery
                ? "Aucun résultat pour ces filtres."
                : "Votre historique apparaîtra ici après votre premier dépôt."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((item) => (
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
                  <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                    {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {item.reference && (
                      <>
                        <span className="hidden sm:inline">·</span>
                        <span className="font-mono hidden sm:inline text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded truncate">{item.reference}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold tabular-nums ${item.isCredit ? "text-green-600" : "text-gray-900"}`}>
                    {item.isCredit ? "+" : "-"}{item.montant.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                  </p>
                  {item.frais > 0 && (
                    <p className="text-[10px] text-gray-400 mt-0.5">frais {item.frais.toFixed(2)}€</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
