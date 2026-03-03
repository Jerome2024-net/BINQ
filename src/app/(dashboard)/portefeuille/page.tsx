"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { type DeviseCode, DEVISE_LIST, DEVISES, DEFAULT_DEVISE, formatMontant } from "@/lib/currencies";
import {
  Wallet,
  ArrowDownToLine,
  SendHorizonal,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
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

type FilterType = "all" | "depot" | "envoi" | "recu";

export default function PortefeuillePage() {
  const { user } = useAuth();
  const [showSolde, setShowSolde] = useState(true);
  const [devise, setDevise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("binq_devise") as DeviseCode) || DEFAULT_DEVISE;
    }
    return DEFAULT_DEVISE;
  });
  const [solde, setSolde] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transferts, setTransferts] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const switchDevise = (d: DeviseCode) => {
    setDevise(d);
    localStorage.setItem("binq_devise", d);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet?devise=${devise}`);
      const data = await res.json();
      if (data.wallet) setSolde(data.wallet.solde || 0);
      if (data.transactions) setTransactions(data.transactions);
      if (data.transferts) setTransferts(data.transferts);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [devise]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // Calculate stats
  const totalDeposits = transactions.filter((t) => t.type === "depot").reduce((s, t) => s + t.montant, 0);
  const totalSent = transferts.filter((t) => t.direction === "sortant").reduce((s, t) => s + t.montant, 0);
  const totalReceived = transferts.filter((t) => t.direction === "entrant").reduce((s, t) => s + t.montant, 0);

  // Merge activity
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
        t.description || t.type,
      reference: t.reference,
      date: t.created_at,
      isCredit: ["depot", "transfert_entrant"].includes(t.type),
      filterTag: t.type === "depot" ? "depot" as const : t.type === "transfert_sortant" ? "envoi" as const : t.type === "transfert_entrant" ? "recu" as const : "all" as const,
    })),
    ...transferts
      .filter((tr) => !transactions.some((t) => t.reference === tr.id))
      .map((tr) => ({
        id: tr.id,
        type: tr.direction === "sortant" ? "transfert_sortant" : "transfert_entrant",
        montant: tr.montant,
        label: tr.direction === "sortant"
          ? `→ ${tr.destinataire.prenom} ${tr.destinataire.nom}`
          : `← ${tr.expediteur.prenom} ${tr.expediteur.nom}`,
        reference: tr.id,
        date: tr.created_at,
        isCredit: tr.direction === "entrant",
        filterTag: (tr.direction === "sortant" ? "envoi" : "recu") as FilterType,
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredActivity = allActivity
    .filter((a) => filter === "all" || a.filterTag === filter)
    .filter((a) => !searchQuery || a.label.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400 animate-pulse" />
        </div>
        <p className="text-sm text-white/30 font-medium">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight">Portefeuille</h1>
          <p className="text-white/30 text-sm mt-0.5">Historique complet</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors">
          <RefreshCw className={`w-4 h-4 text-white/20 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Balance */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/20 uppercase tracking-wider">Solde disponible</span>
            <div className="flex items-center bg-white/[0.05] rounded-lg overflow-hidden">
              {DEVISE_LIST.map((d) => (
                <button key={d} onClick={() => switchDevise(d)} className={`px-2 py-1 text-[9px] font-bold transition-all ${devise === d ? "bg-emerald-500/20 text-emerald-400" : "text-white/25 hover:text-white/40"}`}>{DEVISES[d].flag} {d}</button>
              ))}
            </div>
          </div>
          <button onClick={() => setShowSolde(!showSolde)} className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors">
            {showSolde ? <EyeOff className="w-3.5 h-3.5 text-white/30" /> : <Eye className="w-3.5 h-3.5 text-white/30" />}
          </button>
        </div>
        <p className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-4">
          {showSolde ? formatMontant(solde, devise) : "••••••"}
        </p>
        <div className="flex gap-2">
          <Link href="/deposer" className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-xs sm:text-sm font-bold hover:bg-emerald-400 transition-all active:scale-95">
            <ArrowDownToLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Déposer
          </Link>
          <Link href="/envoyer" className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-xl bg-white/[0.06] text-white/60 text-xs sm:text-sm font-bold hover:bg-white/[0.1] transition-all active:scale-95">
            <SendHorizonal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Envoyer
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Déposé", value: totalDeposits, color: "text-emerald-400" },
          { label: "Envoyé", value: totalSent, color: "text-white/60" },
          { label: "Reçu", value: totalReceived, color: "text-cyan-400" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-2.5 sm:p-3 text-center">
            <p className={`text-sm sm:text-base font-black tabular-nums ${s.color}`}>{formatMontant(s.value, devise)}</p>
            <p className="text-[9px] sm:text-[10px] text-white/20 font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all"
          />
        </div>

        <div className="flex gap-2">
          {(["all", "depot", "envoi", "recu"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "bg-white/[0.03] text-white/30 border border-white/[0.05] hover:text-white/50"
              }`}
            >
              {f === "all" ? "Tout" : f === "depot" ? "Dépôts" : f === "envoi" ? "Envoyés" : "Reçus"}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      {filteredActivity.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-8 text-center">
          <Filter className="w-8 h-8 text-white/10 mx-auto mb-2" />
          <p className="text-sm text-white/30">Aucune transaction trouvée</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
          {filteredActivity.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors active:bg-white/[0.04]">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                item.isCredit ? "bg-emerald-500/15" : "bg-white/[0.05]"
              }`}>
                {item.isCredit
                  ? <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  : <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/30" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white/80 truncate">{item.label}</p>
                <p className="text-[10px] text-white/20 mt-0.5">
                  {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <p className={`text-sm font-bold tabular-nums ${item.isCredit ? "text-emerald-400" : "text-white/50"}`}>
                {item.isCredit ? "+" : "-"}{formatMontant(item.montant, devise)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
