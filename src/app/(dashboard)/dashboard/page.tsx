"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Bitcoin,
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw,
  Activity,
  History,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [showSolde, setShowSolde] = useState(true);

  const [btcWallet, setBtcWallet] = useState<{ solde: number }>({ solde: 0 });
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [btcChange24h, setBtcChange24h] = useState<number>(0);
  const [btcTransactions, setBtcTransactions] = useState<Array<{ id: string; type: string; montant_crypto: number; montant_eur: number; frais_eur: number; reference: string; created_at: string }>>([]);
  const [btcLoading, setBtcLoading] = useState(true);

  const fetchBtcData = useCallback(async () => {
    setBtcLoading(true);
    try {
      const [priceRes, tradeRes] = await Promise.all([
        fetch("/api/crypto/price"),
        fetch("/api/crypto/trade"),
      ]);
      const priceData = await priceRes.json();
      const tradeData = await tradeRes.json();
      if (priceData.price) {
        setBtcPrice(priceData.price);
        setBtcChange24h(priceData.change24h || 0);
      }
      if (tradeData.wallet) setBtcWallet(tradeData.wallet);
      if (tradeData.transactions) setBtcTransactions(tradeData.transactions);
    } catch { /* ignore */ } finally { setBtcLoading(false); }
  }, []);

  useEffect(() => {
    if (user) fetchBtcData();
  }, [user, fetchBtcData]);

  // Auto-refresh price every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/crypto/price");
        const data = await res.json();
        if (data.price) { setBtcPrice(data.price); setBtcChange24h(data.change24h || 0); }
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const valeurEur = btcPrice ? btcWallet.solde * btcPrice : 0;

  if (btcLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center relative z-10">
            <Bitcoin className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
        </div>
        <p className="text-sm text-zinc-500 font-medium tracking-widest uppercase">Synchronisation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* HEADER / GREETING */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">{user?.prenom || "là"}</span>
        </h1>
        <p className="text-zinc-400 mt-1">Voici le résumé de votre portefeuille Bitcoin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ============================================================
            MAIN BALANCE CARD (Span 2 columns on lg)
            ============================================================ */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-zinc-900 to-[#0a0a0a] border border-white/10 p-8 sm:p-10 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[60px]" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <Bitcoin className="w-6 h-6 text-zinc-950" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Solde Total</h2>
                </div>
              </div>
              <button 
                onClick={() => setShowSolde(!showSolde)} 
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
              >
                {showSolde ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <p className="text-5xl sm:text-6xl font-black text-white tabular-nums tracking-tighter">
                  {showSolde ? valeurEur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}
                </p>
                <span className="text-2xl font-bold text-zinc-500">€</span>
              </div>
              <p className="text-lg text-amber-500 mt-2 font-medium tabular-nums flex items-center gap-2">
                <Bitcoin className="w-5 h-5" />
                {showSolde ? btcWallet.solde.toFixed(8) : "••••••••"}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/10">
              <Link
                href="/portefeuille"
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 hover:scale-[1.02] transition-all"
              >
                <TrendingUp className="w-5 h-5" />
                Acheter du Bitcoin
              </Link>
              <Link
                href="/portefeuille"
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
              >
                <TrendingDown className="w-5 h-5 text-zinc-400" />
                Vendre
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================
            MARKET DATA WIDGET
            ============================================================ */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-zinc-500" />
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Marché</h2>
              </div>
              <button onClick={fetchBtcData} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors group">
                <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${btcLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-1">Prix du Bitcoin</p>
                <p className="text-3xl font-bold text-white tabular-nums">
                  {btcPrice ? `${btcPrice.toLocaleString("fr-FR")} €` : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500 mb-2">Variation (24h)</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm ${btcChange24h >= 0 ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                  {btcChange24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {btcChange24h >= 0 ? "+" : ""}{btcChange24h.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
             <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
               <CreditCard className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
               <p className="text-xs text-zinc-400 leading-relaxed">
                 Achat instantané par carte bancaire. Fonds garantis par l&apos;infrastructure <span className="text-zinc-200 font-semibold">Stripe</span>. Frais uniques de 1.5%.
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          TRANSACTION HISTORY
          ============================================================ */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-zinc-500" />
            <h2 className="text-lg font-bold text-white">Activité récente</h2>
          </div>
          <Link
            href="/portefeuille"
            className="text-sm font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            Tout voir <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {btcTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4 border border-white/5">
              <Bitcoin className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-300 font-bold mb-2">Aucune transaction</p>
            <p className="text-zinc-500 text-sm max-w-sm">Votre historique s&apos;affichera ici une fois que vous aurez effectué votre premier achat de Bitcoin.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {btcTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 p-4 sm:px-8 sm:py-5 hover:bg-white/[0.02] transition-colors">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                  tx.type === "achat" ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5 border-white/10"
                }`}>
                  {tx.type === "achat"
                    ? <TrendingUp className={`w-5 h-5 ${tx.type === "achat" ? "text-amber-500" : "text-zinc-400"}`} />
                    : <TrendingDown className="w-5 h-5 text-zinc-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white">
                    {tx.type === "achat" ? "Achat Bitcoin" : "Vente Bitcoin"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-500">
                      {new Date(tx.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                    <span className="text-xs text-zinc-600 font-mono truncate">{tx.reference}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-bold tabular-nums ${tx.type === "achat" ? "text-amber-500" : "text-white"}`}>
                    {tx.type === "achat" ? "+" : "-"}{tx.montant_crypto.toFixed(8)} BTC
                  </p>
                  <p className="text-sm text-zinc-500 tabular-nums font-medium mt-0.5">{tx.montant_eur.toFixed(2)} €</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
