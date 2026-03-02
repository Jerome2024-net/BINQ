"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { getStripe } from "@/lib/stripe-client";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Eye,
  EyeOff,
  X,
  Loader2,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Bitcoin,
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

export default function PortefeuillePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [showSolde, setShowSolde] = useState(true);

  // ── Bitcoin state ──
  const [btcModalOpen, setBtcModalOpen] = useState(false);
  const [btcMode, setBtcMode] = useState<"achat" | "vente">("achat");
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [btcChange24h, setBtcChange24h] = useState<number>(0);
  const [btcAmount, setBtcAmount] = useState("");
  const [btcLoading, setBtcLoading] = useState(false);
  const [btcStep, setBtcStep] = useState<"form" | "confirm" | "payment" | "success">("form");
  const [btcResult, setBtcResult] = useState<{ montant_crypto: number; montant_eur: number; frais: number; reference: string } | null>(null);
  const [btcWallet, setBtcWallet] = useState<{ solde: number }>({ solde: 0 });
  const [btcTransactions, setBtcTransactions] = useState<Array<{ id: string; type: string; montant_crypto: number; montant_eur: number; prix_unitaire: number; frais_eur: number; reference: string; created_at: string }>>([]);
  const [btcPriceLoading, setBtcPriceLoading] = useState(true);
  const [btcDataLoading, setBtcDataLoading] = useState(true);
  const [btcClientSecret, setBtcClientSecret] = useState<string | null>(null);
  const [btcPaymentIntentId, setBtcPaymentIntentId] = useState<string | null>(null);

  // ── Fetch BTC price ──
  const fetchBtcPrice = useCallback(async () => {
    setBtcPriceLoading(true);
    try {
      const res = await fetch("/api/crypto/price");
      const data = await res.json();
      if (data.price) {
        setBtcPrice(data.price);
        setBtcChange24h(data.change24h || 0);
      }
    } catch { /* ignore */ } finally { setBtcPriceLoading(false); }
  }, []);

  // ── Fetch BTC wallet & transactions ──
  const fetchBtcData = useCallback(async () => {
    setBtcDataLoading(true);
    try {
      const res = await fetch("/api/crypto/trade");
      const data = await res.json();
      if (data.wallet) setBtcWallet(data.wallet);
      if (data.transactions) setBtcTransactions(data.transactions);
    } catch { /* ignore */ } finally { setBtcDataLoading(false); }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBtcPrice();
      fetchBtcData();
    }
  }, [user, fetchBtcPrice, fetchBtcData]);

  // Auto-refresh price every 30s
  useEffect(() => {
    const interval = setInterval(fetchBtcPrice, 30000);
    return () => clearInterval(interval);
  }, [fetchBtcPrice]);

  // ── Open modal ──
  const openBtcModal = (mode: "achat" | "vente" = "achat") => {
    setBtcModalOpen(true);
    setBtcMode(mode);
    setBtcStep("form");
    setBtcAmount("");
    setBtcResult(null);
    setBtcClientSecret(null);
    setBtcPaymentIntentId(null);
    fetchBtcPrice();
  };

  // ── Trade handler ──
  const handleBtcTrade = async () => {
    const montant = parseFloat(btcAmount);
    if (!montant || montant <= 0 || !btcPrice) return;

    setBtcLoading(true);

    if (btcMode === "vente") {
      try {
        const res = await fetch("/api/crypto/trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "vente", montant_eur: montant, prix_btc: btcPrice }),
        });
        const data = await res.json();
        if (!res.ok) { showToast("error", "Erreur", data.error || "Transaction échouée"); return; }
        setBtcResult(data.transaction);
        setBtcStep("success");
        fetchBtcData();
        showToast("success", "Vente confirmée", `Transaction ${data.transaction.reference} effectuée`);
      } catch { showToast("error", "Erreur", "Erreur lors de la transaction"); }
      finally { setBtcLoading(false); }
    } else {
      try {
        const res = await fetch("/api/crypto/trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "achat", montant_eur: montant, prix_btc: btcPrice }),
        });
        const data = await res.json();
        if (!res.ok) { showToast("error", "Erreur", data.error || "Erreur création paiement"); return; }
        setBtcClientSecret(data.clientSecret);
        setBtcPaymentIntentId(data.paymentIntentId);
        setBtcStep("payment");
      } catch { showToast("error", "Erreur", "Erreur lors de la création du paiement"); }
      finally { setBtcLoading(false); }
    }
  };

  const handleBtcCardSuccess = async () => {
    if (!btcPaymentIntentId) return;
    setBtcLoading(true);
    try {
      const res = await fetch("/api/crypto/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: btcPaymentIntentId }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", "Erreur", data.error || "Erreur confirmation"); return; }
      setBtcResult(data.transaction);
      setBtcStep("success");
      fetchBtcData();
      showToast("success", "Achat confirmé", `Transaction ${data.transaction.reference} effectuée`);
    } catch { showToast("error", "Erreur", "Erreur lors de la confirmation"); }
    finally { setBtcLoading(false); }
  };

  // ── Computed ──
  const valeurEur = btcPrice ? btcWallet.solde * btcPrice : 0;
  const isPageLoading = btcPriceLoading && btcDataLoading;

  if (isPageLoading) {
    return (
      <div className="max-w-2xl mx-auto pt-20 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
          <Bitcoin className="w-6 h-6 text-amber-600 animate-pulse" />
        </div>
        <p className="text-sm text-gray-400">Chargement Bitcoin...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">

      {/* ══════════════════════════════════════════
          1. HERO — Solde Bitcoin
          ══════════════════════════════════════════ */}
      <div className="pt-8 pb-4">
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl" />

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Bitcoin className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Bitcoin Wallet</p>
                  <p className="text-[11px] text-gray-500">BTC</p>
                </div>
              </div>
              <button onClick={() => setShowSolde(!showSolde)} className="p-2 rounded-lg hover:bg-white/5 transition">
                {showSolde ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
              </button>
            </div>

            {/* Solde BTC */}
            <div className="mb-1">
              <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
                {showSolde ? `${btcWallet.solde.toFixed(8)} BTC` : "••••••••"}
              </p>
            </div>
            <p className="text-sm text-gray-400 tabular-nums mb-6">
              {showSolde
                ? `≈ ${valeurEur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                : "•••••"
              }
            </p>

            {/* Prix + variation */}
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
              <button onClick={fetchBtcPrice} className="p-2 rounded-lg hover:bg-white/5 transition" title="Actualiser">
                <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${btcPriceLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          2. ACTIONS — Acheter / Vendre
          ══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => openBtcModal("achat")}
          className="flex items-center justify-center gap-3 py-4 sm:py-5 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-sm"
        >
          <TrendingUp className="w-5 h-5" />
          <span>Acheter du BTC</span>
        </button>
        <button
          onClick={() => openBtcModal("vente")}
          disabled={btcWallet.solde <= 0}
          className="flex items-center justify-center gap-3 py-4 sm:py-5 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <TrendingDown className="w-5 h-5" />
          <span>Vendre du BTC</span>
        </button>
      </div>

      {/* Info carte */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary-50/60 border border-primary-100">
        <CreditCard className="w-4 h-4 text-primary-500 flex-shrink-0" />
        <p className="text-xs text-primary-700">
          Achat par carte bancaire (Visa, Mastercard) — <span className="font-semibold">frais 1.5%</span>
        </p>
      </div>

      {/* ══════════════════════════════════════════
          3. HISTORIQUE TRANSACTIONS BTC
          ══════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Historique</h2>
          <span className="text-xs text-gray-400">{btcTransactions.length} transaction{btcTransactions.length !== 1 ? "s" : ""}</span>
        </div>

        {btcDataLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        ) : btcTransactions.length === 0 ? (
          <div className="text-center py-14 px-5">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bitcoin className="w-7 h-7 text-amber-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">Aucune transaction</p>
            <p className="text-xs text-gray-400 mb-5">Commencez par acheter du Bitcoin</p>
            <button
              onClick={() => openBtcModal("achat")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Acheter du BTC
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {btcTransactions.map((tx) => (
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
                  <p className="text-[10px] text-gray-400 tabular-nums">{tx.montant_eur.toFixed(2)} € · frais {tx.frais_eur.toFixed(2)} €</p>
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
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-gray-500">Frais de transaction</span>
            <span className="text-sm font-semibold text-gray-900">1.5%</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MODAL — Acheter / Vendre Bitcoin
          ══════════════════════════════════════════ */}
      {btcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setBtcModalOpen(false)}>
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-[420px] shadow-2xl relative max-h-[92vh] sm:max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50 text-amber-600">
                <Bitcoin className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900">
                  {btcStep === "success" ? "Transaction confirmée !" : btcStep === "confirm" ? "Confirmation" : btcStep === "payment" ? "Paiement par carte" : btcMode === "achat" ? "Acheter du Bitcoin" : "Vendre du Bitcoin"}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Transaction sécurisée
                  </p>
                  {btcPrice && btcStep === "form" && (
                    <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${btcChange24h >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {btcChange24h >= 0 ? "+" : ""}{btcChange24h.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setBtcModalOpen(false)} className="p-2 -mr-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs Achat / Vente */}
            {btcStep === "form" && (
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => { setBtcMode("achat"); setBtcAmount(""); }}
                  className={`flex-1 py-3 text-sm font-semibold text-center transition-all relative ${btcMode === "achat" ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Acheter
                  {btcMode === "achat" && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-green-600 rounded-full" />}
                </button>
                <button
                  onClick={() => { setBtcMode("vente"); setBtcAmount(""); }}
                  className={`flex-1 py-3 text-sm font-semibold text-center transition-all relative ${btcMode === "vente" ? "text-red-500" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Vendre
                  {btcMode === "vente" && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-red-500 rounded-full" />}
                </button>
              </div>
            )}

            <div className="px-5 py-5 sm:px-6 sm:py-6">
              {/* ── Form ── */}
              {btcStep === "form" && (
                <div className="space-y-5">
                  {/* BTC Price */}
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Prix Bitcoin</p>
                      {btcPriceLoading ? (
                        <Loader2 className="w-5 h-5 text-gray-300 animate-spin mt-1" />
                      ) : (
                        <p className="text-lg font-bold text-gray-900 tabular-nums">{btcPrice ? `${btcPrice.toLocaleString("fr-FR")} €` : "—"}</p>
                      )}
                    </div>
                    <button onClick={fetchBtcPrice} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                      Actualiser
                    </button>
                  </div>

                  {/* Solde BTC */}
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Votre solde Bitcoin</p>
                    <p className="text-sm font-bold text-gray-900 tabular-nums mt-0.5">{btcWallet.solde.toFixed(8)} BTC</p>
                    {btcPrice && btcWallet.solde > 0 && (
                      <p className="text-[10px] text-gray-400 tabular-nums">≈ {(btcWallet.solde * btcPrice).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 ml-0.5">
                      Montant en EUR
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={btcAmount}
                      onChange={(e) => setBtcAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-2xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                    />
                    {btcAmount && btcPrice && parseFloat(btcAmount) > 0 && (
                      <div className="text-center space-y-1">
                        <p className="text-sm text-gray-500">
                          ≈ <span className="font-semibold text-gray-900">{((parseFloat(btcAmount) * (1 - 0.015)) / btcPrice).toFixed(8)} BTC</span>
                        </p>
                        <p className="text-xs text-gray-400">Frais : {(parseFloat(btcAmount) * 0.015).toFixed(2)} € (1.5%)</p>
                      </div>
                    )}
                  </div>

                  {/* Paiement par carte — achat only */}
                  {btcMode === "achat" && (
                    <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-primary-200 bg-primary-50/50">
                      <CreditCard className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-primary-700">Paiement par carte bancaire</p>
                        <p className="text-[10px] text-gray-400">Visa, Mastercard — frais 1.5%</p>
                      </div>
                    </div>
                  )}

                  {/* Quick amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setBtcAmount(amt.toString())}
                        className={`py-2 rounded-lg border text-sm font-semibold transition-all ${
                          btcAmount === amt.toString()
                            ? "border-primary-300 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {amt} €
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setBtcStep("confirm")}
                    disabled={!btcAmount || parseFloat(btcAmount) <= 0 || !btcPrice}
                    className={`w-full py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white ${
                      btcMode === "achat" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {btcMode === "achat" ? <CreditCard className="w-5 h-5" /> : <Bitcoin className="w-5 h-5" />}
                    {btcMode === "achat" ? "Acheter du Bitcoin" : "Vendre du Bitcoin"}
                  </button>
                </div>
              )}

              {/* ── Confirm ── */}
              {btcStep === "confirm" && btcPrice && (
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-xl p-5 text-center space-y-3">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                      {btcMode === "achat" ? "Vous achetez" : "Vous vendez"}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 tracking-tight">
                      {btcMode === "achat"
                        ? ((parseFloat(btcAmount) * (1 - 0.015)) / btcPrice).toFixed(8)
                        : (parseFloat(btcAmount) / btcPrice).toFixed(8)
                      } <span className="text-amber-600">BTC</span>
                    </p>
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Montant</span>
                        <span className="text-gray-900 font-medium">{parseFloat(btcAmount).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Frais (1.5%)</span>
                        <span className="text-gray-900 font-medium">{(parseFloat(btcAmount) * 0.015).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Prix BTC</span>
                        <span className="text-gray-900 font-medium">{btcPrice.toLocaleString("fr-FR")} €</span>
                      </div>
                      {btcMode === "achat" && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Paiement</span>
                          <span className="text-gray-900 font-medium flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" />
                            Carte bancaire
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setBtcStep("form")}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={handleBtcTrade}
                      disabled={btcLoading}
                      className={`flex-[2] py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm text-white ${
                        btcMode === "achat" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      {btcLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : btcMode === "achat" ? <CreditCard className="w-4 h-4" /> : <Bitcoin className="w-4 h-4" />}
                      {btcLoading ? "En cours..." : btcMode === "achat" ? "Payer par carte" : "Confirmer la vente"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Stripe Card Payment ── */}
              {btcStep === "payment" && btcClientSecret && (
                <div className="space-y-4">
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-amber-700 font-medium">
                      Achat de {btcPrice ? ((parseFloat(btcAmount) * (1 - 0.015)) / btcPrice).toFixed(8) : "..."} BTC pour {parseFloat(btcAmount).toFixed(2)} €
                    </p>
                  </div>
                  <Elements
                    stripe={getStripe()}
                    options={{
                      clientSecret: btcClientSecret,
                      appearance: {
                        theme: "stripe",
                        variables: {
                          colorPrimary: "#4f46e5",
                          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                          spacingUnit: "4px",
                          borderRadius: "10px",
                        },
                      },
                      locale: "fr",
                    }}
                  >
                    <BtcCardPaymentForm
                      onSuccess={handleBtcCardSuccess}
                      onCancel={() => { setBtcStep("confirm"); setBtcClientSecret(null); }}
                    />
                  </Elements>
                </div>
              )}

              {/* ── Success ── */}
              {btcStep === "success" && btcResult && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {btcMode === "achat" ? "Achat confirmé !" : "Vente confirmée !"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-5">
                    <span className="text-gray-900 font-semibold">{btcResult.montant_crypto.toFixed(8)} BTC</span>
                    {btcMode === "achat" ? " achetés" : " vendus"} pour{" "}
                    <span className="text-gray-900 font-semibold">{btcResult.montant_eur.toFixed(2)} €</span>
                  </p>

                  <div className="bg-gray-50 rounded-lg py-2 px-4 inline-block mb-5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Référence</p>
                    <p className="font-mono text-sm text-gray-700">{btcResult.reference}</p>
                  </div>

                  <button
                    onClick={() => setBtcModalOpen(false)}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================
// Composant : Formulaire Stripe Elements pour achat BTC par carte
// ========================
function BtcCardPaymentForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/portefeuille?btc_payment=success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Le paiement a échoué");
      } else {
        onSuccess();
      }
    } catch {
      setErrorMessage("Erreur lors du paiement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {errorMessage && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
          <p className="text-xs text-red-600">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 transition-colors text-sm"
        >
          Retour
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isSubmitting}
          className="flex-[2] py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm text-white bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {isSubmitting ? "Paiement en cours..." : "Payer"}
        </button>
      </div>

      <p className="text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" />
        Paiement sécurisé via Stripe
      </p>
    </form>
  );
}
