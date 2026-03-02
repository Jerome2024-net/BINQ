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
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <Bitcoin className="w-7 h-7 text-amber-500 animate-pulse" />
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
        <p className="text-gray-500 text-sm mt-1">Voici le résumé de votre portefeuille Bitcoin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* ── Balance Card ── */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-100/30 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200/50">
                  <Bitcoin className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Solde Total</h2>
              </div>
              <button onClick={() => setShowSolde(!showSolde)} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors">
                {showSolde ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <p className="text-4xl sm:text-5xl font-black text-gray-900 tabular-nums tracking-tight">
                  {showSolde ? valeurEur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}
                </p>
                <span className="text-xl sm:text-2xl font-bold text-gray-300">€</span>
              </div>
              <p className="text-base text-amber-600 mt-1.5 font-semibold tabular-nums flex items-center gap-1.5">
                <Bitcoin className="w-4 h-4" />
                {showSolde ? btcWallet.solde.toFixed(8) : "••••••••"} BTC
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
              <Link href="/portefeuille" className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all text-sm shadow-sm">
                <TrendingUp className="w-4 h-4" />
                Acheter
              </Link>
              <Link href="/portefeuille" className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition-all text-sm">
                <TrendingDown className="w-4 h-4 text-gray-400" />
                Vendre
              </Link>
            </div>
          </div>
        </div>

        {/* ── Market Widget ── */}
        <div className="bg-white border border-gray-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Marché</h2>
              </div>
              <button onClick={fetchBtcData} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors group">
                <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${btcLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-medium text-gray-400 mb-1">Prix du Bitcoin</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">
                  {btcPrice ? `${btcPrice.toLocaleString("fr-FR")} €` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 mb-2">Variation (24h)</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${btcChange24h >= 0 ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"}`}>
                  {btcChange24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {btcChange24h >= 0 ? "+" : ""}{btcChange24h.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-100/60">
              <CreditCard className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Achat par carte bancaire via <span className="text-gray-700 font-semibold">Stripe</span>. Frais de 1.5%.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Transaction History ── */}
      <div className="bg-white border border-gray-200/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="text-base font-bold text-gray-900">Activité récente</h2>
          </div>
          <Link href="/portefeuille" className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors">
            Tout voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {btcTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
              <Bitcoin className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-900 font-bold mb-1">Aucune transaction</p>
            <p className="text-gray-400 text-sm max-w-xs">Votre historique s&apos;affichera ici après votre premier achat de Bitcoin.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {btcTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 sm:gap-4 p-4 sm:px-6 sm:py-4 hover:bg-gray-50/50 transition-colors">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  tx.type === "achat" ? "bg-amber-50 border border-amber-100" : "bg-gray-50 border border-gray-100"
                }`}>
                  {tx.type === "achat"
                    ? <TrendingUp className="w-4 h-4 text-amber-600" />
                    : <TrendingDown className="w-4 h-4 text-gray-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">
                    {tx.type === "achat" ? "Achat Bitcoin" : "Vente Bitcoin"}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {new Date(tx.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold tabular-nums ${tx.type === "achat" ? "text-amber-600" : "text-gray-900"}`}>
                    {tx.type === "achat" ? "+" : "-"}{tx.montant_crypto.toFixed(8)} BTC
                  </p>
                  <p className="text-[11px] text-gray-400 tabular-nums mt-0.5">{tx.montant_eur.toFixed(2)} €</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
