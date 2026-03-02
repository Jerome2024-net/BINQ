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
  Loader2,
  CreditCard,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const [showSolde, setShowSolde] = useState(true);

  // ── Bitcoin ──
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
      <div className="max-w-2xl mx-auto pt-20 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
          <Bitcoin className="w-6 h-6 text-amber-600 animate-pulse" />
        </div>
        <p className="text-sm text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">

      {/* ══════════════════════════════════════════
          1. HERO — Bienvenue + Solde BTC
          ══════════════════════════════════════════ */}
      <div className="pt-8 pb-2">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1 text-center">
          Bonjour, {user?.prenom || "là"} 👋
        </p>

        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden mt-4">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl" />

          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Bitcoin className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Portefeuille Bitcoin</p>
                </div>
              </div>
              <button onClick={() => setShowSolde(!showSolde)} className="p-2 rounded-lg hover:bg-white/5 transition">
                {showSolde ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
              </button>
            </div>

            <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
              {showSolde ? `${btcWallet.solde.toFixed(8)} BTC` : "••••••••"}
            </p>
            <p className="text-sm text-gray-400 tabular-nums mt-1 mb-5">
              {showSolde
                ? `≈ ${valeurEur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                : "•••••"
              }
            </p>

            <div className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-3">
              <div className="flex-1">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-0.5">Prix BTC</p>
                <p className="text-sm font-bold text-white tabular-nums">
                  {btcPrice ? `${btcPrice.toLocaleString("fr-FR")} €` : "—"}
                </p>
              </div>
              <div className="flex-1 text-right">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-0.5">24h</p>
                <span className={`text-sm font-bold flex items-center justify-end gap-1 ${btcChange24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {btcChange24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {btcChange24h >= 0 ? "+" : ""}{btcChange24h.toFixed(2)}%
                </span>
              </div>
              <button onClick={fetchBtcData} className="p-2 rounded-lg hover:bg-white/5 transition" title="Actualiser">
                <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${btcLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          2. ACTIONS — Acheter / Vendre
          ══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/portefeuille"
          className="flex items-center justify-center gap-3 py-4 sm:py-5 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-sm"
        >
          <TrendingUp className="w-5 h-5" />
          <span>Acheter du BTC</span>
        </Link>
        <Link
          href="/portefeuille"
          className="flex items-center justify-center gap-3 py-4 sm:py-5 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors shadow-sm"
        >
          <TrendingDown className="w-5 h-5" />
          <span>Vendre du BTC</span>
        </Link>
      </div>

      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary-50/60 border border-primary-100">
        <CreditCard className="w-4 h-4 text-primary-500 flex-shrink-0" />
        <p className="text-xs text-primary-700">
          Achat par carte bancaire sécurisé via Stripe — <span className="font-semibold">frais 1.5%</span>
        </p>
      </div>

      {/* ══════════════════════════════════════════
          3. DERNIÈRES TRANSACTIONS
          ══════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Dernières transactions
          </h2>
          <Link
            href="/portefeuille"
            className="text-xs font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          >
            Tout voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {btcTransactions.length === 0 ? (
          <div className="text-center py-14 px-5">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bitcoin className="w-7 h-7 text-amber-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">Aucune transaction</p>
            <p className="text-xs text-gray-400 mb-5">Commencez par acheter du Bitcoin</p>
            <Link
              href="/portefeuille"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Acheter du BTC
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {btcTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  tx.type === "achat" ? "bg-green-50" : "bg-red-50"
                }`}>
                  {tx.type === "achat"
                    ? <TrendingUp className="w-4 h-4 text-green-600" />
                    : <TrendingDown className="w-4 h-4 text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {tx.type === "achat" ? "Achat Bitcoin" : "Vente Bitcoin"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(tx.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}
                    <span className="font-mono">{tx.reference}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold tabular-nums ${tx.type === "achat" ? "text-green-600" : "text-red-500"}`}>
                    {tx.type === "achat" ? "+" : "-"}{tx.montant_crypto.toFixed(8)} BTC
                  </p>
                  <p className="text-[10px] text-gray-400 tabular-nums">{tx.montant_eur.toFixed(2)} €</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          4. INFOS MARCHÉ
          ══════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Marché Bitcoin</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-gray-500">Prix actuel</span>
            <span className="text-sm font-semibold text-gray-900 tabular-nums">{btcPrice ? `${btcPrice.toLocaleString("fr-FR")} €` : "—"}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-gray-500">Variation 24h</span>
            <span className={`text-sm font-semibold flex items-center gap-1 ${btcChange24h >= 0 ? "text-green-600" : "text-red-500"}`}>
              {btcChange24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {btcChange24h >= 0 ? "+" : ""}{btcChange24h.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-gray-500">Votre solde</span>
            <span className="text-sm font-semibold text-gray-900 tabular-nums">{btcWallet.solde.toFixed(8)} BTC</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-gray-500">Valeur estimée</span>
            <span className="text-sm font-semibold text-gray-900 tabular-nums">{valeurEur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
          </div>
        </div>
      </div>
    </div>
  );
}
