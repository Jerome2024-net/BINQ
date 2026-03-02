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
  Info,
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <Bitcoin className="w-7 h-7 text-amber-500 animate-pulse" />
        </div>
        <p className="text-sm text-gray-400 font-medium">Chargement du portefeuille...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 pb-12">
      
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Portefeuille <span className="text-amber-600">Bitcoin</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Gérez vos avoirs, achetez ou vendez en quelques clics.</p>
      </div>

      {/* ══════════════════════════════════════════
          MAIN BALANCE CARD (White Premium)
          ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 lg:p-10 shadow-sm hover:shadow-md transition-shadow">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-100/40 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-100/20 rounded-full blur-[50px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200/50">
                  <Bitcoin className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Solde Actuel</p>
              </div>
              <button onClick={() => setShowSolde(!showSolde)} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors md:hidden">
                {showSolde ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="mb-2">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight tabular-nums">
                  {showSolde ? btcWallet.solde.toFixed(8) : "••••••••"}
                </p>
                <span className="text-xl sm:text-3xl font-bold text-gray-300">BTC</span>
              </div>
            </div>
            <p className="text-base sm:text-lg text-amber-600 font-semibold tabular-nums">
              {showSolde
                ? `≈ ${valeurEur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                : "•••••"
              }
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:min-w-[200px]">
            <button
              onClick={() => openBtcModal("achat")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all shadow-sm text-sm"
            >
              <TrendingUp className="w-4 h-4" />
              Acheter du Bitcoin
            </button>
            <button
              onClick={() => openBtcModal("vente")}
              disabled={btcWallet.solde <= 0}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              <TrendingDown className="w-4 h-4 text-gray-400" />
              Vendre du Bitcoin
            </button>
          </div>
        </div>

        {/* Live Market Bar */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-4 sm:gap-6">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Prix BTC (Temps réel)</p>
            <p className="text-sm font-bold text-gray-900 tabular-nums">
              {btcPrice ? `${btcPrice.toLocaleString("fr-FR")} €` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Variation 24h</p>
            <span className={`text-sm font-bold flex items-center gap-1 ${btcChange24h >= 0 ? "text-green-600" : "text-red-500"}`}>
              {btcChange24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {btcChange24h >= 0 ? "+" : ""}{btcChange24h.toFixed(2)}%
            </span>
          </div>
          <button onClick={fetchBtcPrice} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors ml-auto group">
            <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${btcPriceLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50/60 border border-amber-100/60">
        <CreditCard className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-gray-500">
          L&apos;achat s&apos;effectue par carte bancaire (Visa, Mastercard). Des frais de réseau fixes de <span className="font-semibold text-gray-700">1.5%</span> s&apos;appliquent sur chaque transaction entrante.
        </p>
      </div>

      {/* ══════════════════════════════════════════
          HISTORIQUE TRANSACTIONS
          ══════════════════════════════════════════ */}
      <div className="bg-white border border-gray-200/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 sm:px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Historique d&apos;activité</h2>
          <span className="px-2.5 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">{btcTransactions.length}</span>
        </div>

        {btcDataLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin opacity-50" />
          </div>
        ) : btcTransactions.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-6">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bitcoin className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-base font-bold text-gray-900 mb-1">Aucune transaction</p>
            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">Votre historique est vide. Achetez vos premiers fractions de Bitcoin pour démarrer.</p>
            <button
              onClick={() => openBtcModal("achat")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Investir
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {btcTransactions.map((tx) => (
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
                  <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                    {new Date(tx.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    <span className="hidden sm:inline">·</span>
                    <span className="font-mono hidden sm:inline truncate text-gray-400 bg-gray-50 px-2 py-0.5 rounded text-[10px]">{tx.reference}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold tabular-nums ${tx.type === "achat" ? "text-amber-600" : "text-gray-900"}`}>
                    {tx.type === "achat" ? "+" : "-"}{tx.montant_crypto.toFixed(8)} BTC
                  </p>
                  <p className="text-[11px] text-gray-400 tabular-nums mt-0.5">
                    {tx.montant_eur.toFixed(2)} € (frais {tx.frais_eur.toFixed(2)}€)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          MODAL — Acheter / Vendre Bitcoin
          ══════════════════════════════════════════ */}
      {btcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-0 sm:p-4" onClick={() => setBtcModalOpen(false)}>
          <div
            className="bg-white border border-gray-200 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl relative max-h-[92vh] flex flex-col animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50 border border-amber-100 text-amber-500">
                <Bitcoin className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {btcStep === "success" ? "Transaction réussie" : btcStep === "confirm" ? "Résumé" : btcStep === "payment" ? "Paiement" : btcMode === "achat" ? "Acheter" : "Vendre"}
                </h3>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Chiffrement AES-256
                </p>
              </div>
              <button onClick={() => setBtcModalOpen(false)} className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Achat / Vente */}
            {btcStep === "form" && (
              <div className="flex border-b border-gray-100 flex-shrink-0">
                <button
                  onClick={() => { setBtcMode("achat"); setBtcAmount(""); }}
                  className={`flex-1 py-4 text-sm font-bold text-center transition-all relative ${btcMode === "achat" ? "text-amber-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Acheter
                  {btcMode === "achat" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
                </button>
                <button
                  onClick={() => { setBtcMode("vente"); setBtcAmount(""); }}
                  className={`flex-1 py-4 text-sm font-bold text-center transition-all relative ${btcMode === "vente" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Vendre
                  {btcMode === "vente" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
                </button>
              </div>
            )}

            <div className="px-6 py-6 overflow-y-auto">
              {/* ── Form ── */}
              {btcStep === "form" && (
                <div className="space-y-6">
                  
                  {/* Amount Input */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-4">
                      Montant en Euros
                    </p>
                    <div className="relative flex items-center justify-center">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={btcAmount}
                        onChange={(e) => setBtcAmount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-5xl font-black text-gray-900 placeholder-gray-200 focus:outline-none text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pb-2"
                        autoFocus
                      />
                    </div>
                    {btcAmount && parseFloat(btcAmount) > 0 && btcPrice && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 animate-fade-in">
                        <p className="text-center font-medium text-amber-600 font-mono text-lg">
                          ≈ {(parseFloat(btcAmount) / btcPrice).toFixed(8)} BTC
                        </p>
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          {btcMode === "achat" ? (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Total prélevé (+1.5% frais)</span>
                              <span className="font-bold text-gray-900">{(parseFloat(btcAmount) * 1.015).toFixed(2)} €</span>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Net reçu (-1.5% frais)</span>
                              <span className="font-bold text-gray-900">{(parseFloat(btcAmount) * 0.985).toFixed(2)} €</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 50, 100, 500].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setBtcAmount(amt.toString())}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                          btcAmount === amt.toString()
                            ? "border-amber-500 bg-amber-50 text-amber-600"
                            : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        }`}
                      >
                        {amt} €
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setBtcStep("confirm")}
                    disabled={!btcAmount || parseFloat(btcAmount) <= 0 || !btcPrice || (btcMode === "vente" && btcWallet.solde <= 0)}
                    className={`w-full py-4 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      btcMode === "achat" ? "bg-gray-900 text-white hover:bg-gray-800 shadow-sm" : "bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                    }`}
                  >
                    {btcMode === "achat" ? "Continuer vers le paiement" : "Confirmer le montant"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* ── Confirm ── */}
              {btcStep === "confirm" && btcPrice && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      {btcMode === "achat" ? "Vous allez acquérir" : "Vous allez vendre"}
                    </p>
                    <p className="text-4xl font-black text-gray-900 tracking-tight mb-6">
                      {(parseFloat(btcAmount) / btcPrice).toFixed(8)} <span className="text-2xl text-amber-600">BTC</span>
                    </p>
                    
                    <div className="space-y-3 pt-6 border-t border-gray-200 text-left">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Montant de base</span>
                        <span className="text-gray-900 font-bold">{parseFloat(btcAmount).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Frais réseau (1.5%)</span>
                        <span className="text-gray-600 font-medium">{(parseFloat(btcAmount) * 0.015).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-sm p-3 bg-white rounded-xl border border-gray-100 mt-2 font-bold">
                        <span className="text-gray-900">{btcMode === "achat" ? "Total à débiter" : "Net à recevoir"}</span>
                        <span className="text-amber-600">
                          {btcMode === "achat" 
                            ? (parseFloat(btcAmount) * 1.015).toFixed(2) 
                            : (parseFloat(btcAmount) * 0.985).toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-gray-400 pt-2">
                        <span>Taux garanti</span>
                        <span>1 BTC = {btcPrice.toLocaleString("fr-FR")} €</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setBtcStep("form")}
                      className="flex-[1] py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleBtcTrade}
                      disabled={btcLoading}
                      className="flex-[2] py-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                    >
                      {btcLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : btcMode === "achat" ? <CreditCard className="w-4 h-4" /> : <Bitcoin className="w-4 h-4" />}
                      {btcLoading ? "Traitement..." : btcMode === "achat" ? "Payer par carte" : "Valider la vente"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Stripe Card Payment ── */}
              {btcStep === "payment" && btcClientSecret && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total sécurisé</p>
                      <p className="font-bold text-gray-900 text-lg">{(parseFloat(btcAmount) * 1.015).toFixed(2)} €</p>
                    </div>
                  </div>
                  
                  <div className="min-h-[250px]">
                    <Elements
                      stripe={getStripe()}
                      options={{
                        clientSecret: btcClientSecret,
                        appearance: {
                          theme: "stripe",
                          variables: {
                            colorPrimary: "#f59e0b",
                            colorBackground: "#ffffff",
                            colorText: "#111827",
                            colorDanger: "#ef4444",
                            fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            borderRadius: "12px",
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
                </div>
              )}

              {/* ── Success ── */}
              {btcStep === "success" && btcResult && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">
                    {btcMode === "achat" ? "Achat réussi !" : "Vente réussie !"}
                  </h3>
                  <p className="text-base text-gray-500 mb-8">
                    Vous avez {btcMode === "achat" ? "obtenu" : "cédé"}{" "}
                    <span className="text-gray-900 font-bold">{btcResult.montant_crypto.toFixed(8)} BTC</span>
                  </p>

                  <div className="bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 inline-block mb-8 text-left space-y-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Référence</p>
                    <p className="font-mono text-sm text-gray-600">{btcResult.reference}</p>
                  </div>

                  <button
                    onClick={() => setBtcModalOpen(false)}
                    className="w-full py-4 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                  >
                    Fermer le reçu
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
// Composant : Formulaire Stripe Elements (Light)
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{ layout: "tabs" }} />

      {errorMessage && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-600 leading-relaxed">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isSubmitting}
          className="flex-[2] py-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm text-white bg-gray-900 hover:bg-gray-800 shadow-sm"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
          {isSubmitting ? "Traitement..." : "Payer en sécurité"}
        </button>
      </div>

      <p className="text-[10px] uppercase font-bold tracking-widest text-center text-gray-400 flex items-center justify-center gap-1.5 pt-2">
        <Lock className="w-3 h-3" />
        Infrastructure Stripe PCI-DSS
      </p>
    </form>
  );
}
