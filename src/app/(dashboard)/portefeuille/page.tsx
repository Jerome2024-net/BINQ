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
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center relative z-10">
            <Bitcoin className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
        </div>
        <p className="text-sm text-zinc-500 font-medium tracking-widest uppercase">Chargement Wallet...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Portefeuille <span className="text-amber-500">Bitcoin</span>
        </h1>
        <p className="text-zinc-400 mt-1">Gérez vos avoirs, achetez ou vendez en quelques clics.</p>
      </div>

      {/* ══════════════════════════════════════════
          MAIN BALANCE CARD (Premium UI)
          ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-zinc-900 to-[#111] border border-white/10 p-8 sm:p-10 shadow-2xl">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                  <Bitcoin className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Solde Actuel</p>
                </div>
              </div>
              <button onClick={() => setShowSolde(!showSolde)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 transition-colors md:hidden">
                {showSolde ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="mb-2">
              <p className="text-4xl sm:text-6xl font-black text-white tracking-tighter tabular-nums">
                {showSolde ? `${btcWallet.solde.toFixed(8)}` : "••••••••"} <span className="text-2xl sm:text-4xl text-zinc-600">BTC</span>
              </p>
            </div>
            <p className="text-lg text-amber-500 font-medium tabular-nums">
              {showSolde
                ? `≈ ${valeurEur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                : "•••••"
              }
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 min-w-[200px]">
             <button
                onClick={() => openBtcModal("achat")}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                <TrendingUp className="w-5 h-5" />
                Acheter du Bitcoin
              </button>
              <button
                onClick={() => openBtcModal("vente")}
                disabled={btcWallet.solde <= 0}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <TrendingDown className="w-5 h-5" />
                Vendre du Bitcoin
              </button>
          </div>
        </div>

        {/* Live Market Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Prix BTC (Temps réel)</p>
            <p className="text-sm font-bold text-white tabular-nums">
              {btcPrice ? `${btcPrice.toLocaleString("fr-FR")} €` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Variation 24h</p>
            <span className={`text-sm font-bold flex items-center gap-1 ${btcChange24h >= 0 ? "text-green-400" : "text-red-400"}`}>
              {btcChange24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {btcChange24h >= 0 ? "+" : ""}{btcChange24h.toFixed(2)}%
            </span>
          </div>
          <button onClick={fetchBtcPrice} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors ml-auto group">
            <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${btcPriceLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
        <CreditCard className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-zinc-400">
          L&apos;achat s&apos;effectue par carte bancaire (Visa, Mastercard). Des frais de réseau fixes de <span className="font-semibold text-white">1.5%</span> s&apos;appliquent sur chaque transaction entrante.
        </p>
      </div>

      {/* ══════════════════════════════════════════
          HISTORIQUE TRANSACTIONS
          ══════════════════════════════════════════ */}
      <div className="bg-zinc-900/50 backdrop-blur-xl rounded-[2rem] border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 sm:px-8 py-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Historique d&apos;activité</h2>
          <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-zinc-400">{btcTransactions.length}</span>
        </div>

        {btcDataLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin opacity-50" />
          </div>
        ) : btcTransactions.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Bitcoin className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-lg font-bold text-white mb-2">Aucune transaction</p>
            <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">Votre historique est vide. Achetez vos premiers fractions de Bitcoin pour démarrer.</p>
            <button
              onClick={() => openBtcModal("achat")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-zinc-950 text-sm font-bold hover:bg-amber-400 hover:scale-105 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Investir
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {btcTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 p-4 sm:px-8 sm:py-5 hover:bg-white/[0.02] transition-colors">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                  tx.type === "achat" ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5 border-white/10"
                }`}>
                  {tx.type === "achat"
                    ? <TrendingUp className="w-5 h-5 text-amber-500" />
                    : <TrendingDown className="w-5 h-5 text-zinc-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white">
                    {tx.type === "achat" ? "Achat Bitcoin" : "Vente Bitcoin"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                    {new Date(tx.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: '2-digit', minute:'2-digit' })}
                    <span className="hidden sm:inline">·</span>
                    <span className="font-mono hidden sm:inline truncate text-zinc-600 bg-white/5 px-2 py-0.5 rounded">{tx.reference}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-base font-bold tabular-nums ${tx.type === "achat" ? "text-amber-500" : "text-white"}`}>
                    {tx.type === "achat" ? "+" : "-"}{tx.montant_crypto.toFixed(8)} BTC
                  </p>
                  <p className="text-[11px] text-zinc-500 tabular-nums mt-1">
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/80 backdrop-blur-md p-0 sm:p-4" onClick={() => setBtcModalOpen(false)}>
          <div
            className="bg-zinc-900 border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl relative max-h-[92vh] flex flex-col animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-500/10 text-amber-500">
                <Bitcoin className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-white">
                  {btcStep === "success" ? "Transaction réussie" : btcStep === "confirm" ? "Résumé" : btcStep === "payment" ? "Paiement" : btcMode === "achat" ? "Acheter" : "Vendre"}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Chiffrement AES-256
                  </p>
                </div>
              </div>
              <button onClick={() => setBtcModalOpen(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Achat / Vente */}
            {btcStep === "form" && (
              <div className="flex border-b border-white/5 flex-shrink-0">
                <button
                  onClick={() => { setBtcMode("achat"); setBtcAmount(""); }}
                  className={`flex-1 py-4 text-sm font-bold text-center transition-all relative ${btcMode === "achat" ? "text-amber-500" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  Acheter
                  {btcMode === "achat" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
                </button>
                <button
                  onClick={() => { setBtcMode("vente"); setBtcAmount(""); }}
                  className={`flex-1 py-4 text-sm font-bold text-center transition-all relative ${btcMode === "vente" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  Vendre
                  {btcMode === "vente" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
                </button>
              </div>
            )}

            <div className="px-6 py-6 overflow-y-auto">
              {/* ── Form ── */}
              {btcStep === "form" && (
                <div className="space-y-6">
                  
                  {/* Amount Input */}
                  <div className="bg-zinc-950/50 rounded-2xl p-6 border border-white/5 relative">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-center mb-4">
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
                        className="w-full bg-transparent text-5xl font-black text-white placeholder-zinc-800 focus:outline-none text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pb-2"
                        autoFocus
                      />
                    </div>
                    {btcAmount && parseFloat(btcAmount) > 0 && btcPrice && (
                       <div className="mt-4 pt-4 border-t border-white/5 space-y-2 animate-fade-in">
                          <p className="text-center font-medium text-amber-500 font-mono text-lg">
                            ≈ {(parseFloat(btcAmount) / btcPrice).toFixed(8)} BTC
                          </p>
                          <div className="bg-white/5 rounded-xl p-3">
                             {btcMode === "achat" ? (
                               <div className="flex justify-between items-center text-xs">
                                 <span className="text-zinc-400">Total prélevé (+1.5% frais)</span>
                                 <span className="font-bold text-white">{(parseFloat(btcAmount) * 1.015).toFixed(2)} €</span>
                               </div>
                             ) : (
                               <div className="flex justify-between items-center text-xs">
                                 <span className="text-zinc-400">Net reçu (-1.5% frais)</span>
                                 <span className="font-bold text-white">{(parseFloat(btcAmount) * 0.985).toFixed(2)} €</span>
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
                            ? "border-amber-500 bg-amber-500/10 text-amber-500"
                            : "border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white"
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
                      btcMode === "achat" ? "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]" : "bg-white text-zinc-950 hover:bg-zinc-200"
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
                  <div className="bg-zinc-950/50 rounded-2xl p-6 border border-white/5 text-center">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      {btcMode === "achat" ? "Vous allez acquérir" : "Vous allez vendre"}
                    </p>
                    <p className="text-4xl font-black text-white tracking-tight mb-6">
                       {(parseFloat(btcAmount) / btcPrice).toFixed(8)} <span className="text-2xl text-amber-500">BTC</span>
                    </p>
                    
                    <div className="space-y-3 pt-6 border-t border-white/5 text-left">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Montant de base</span>
                        <span className="text-white font-bold">{parseFloat(btcAmount).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Frais réseau (1.5%)</span>
                        <span className="text-zinc-300 font-medium">+(parseFloat(btcAmount) * 0.015).toFixed(2) €</span>
                      </div>
                      <div className="flex justify-between text-sm p-3 bg-white/5 rounded-xl mt-2 font-bold">
                        <span className="text-white">{btcMode === "achat" ? "Total à débiter" : "Net à recevoir"}</span>
                        <span className="text-amber-500">
                          {btcMode === "achat" 
                            ? (parseFloat(btcAmount) * 1.015).toFixed(2) 
                            : (parseFloat(btcAmount) * 0.985).toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-zinc-500 pt-2">
                        <span>Taux garanti</span>
                        <span>1 BTC = {btcPrice.toLocaleString("fr-FR")} €</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setBtcStep("form")}
                      className="flex-[1] py-4 rounded-xl border border-white/10 text-zinc-300 font-bold hover:bg-white/5 transition-colors text-sm"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleBtcTrade}
                      disabled={btcLoading}
                      className={`flex-[2] py-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm ${
                        btcMode === "achat" ? "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]" : "bg-white text-zinc-950 hover:bg-zinc-200"
                      }`}
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
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                       <Lock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Total sécurisé</p>
                      <p className="font-bold text-white text-lg">{(parseFloat(btcAmount) * 1.015).toFixed(2)} €</p>
                    </div>
                  </div>
                  
                  <div className="min-h-[250px]">
                    <Elements
                      stripe={getStripe()}
                      options={{
                        clientSecret: btcClientSecret,
                        appearance: {
                          theme: "night",
                          variables: {
                            colorPrimary: "#f59e0b",
                            colorBackground: "#18181b",
                            colorText: "#ffffff",
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
                  <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">
                    {btcMode === "achat" ? "Achat réussi !" : "Vente réussie !"}
                  </h3>
                  <p className="text-base text-zinc-400 mb-8">
                    Vous avez {btcMode === "achat" ? "obtenu" : "cédé"}{" "}
                    <span className="text-white font-bold">{btcResult.montant_crypto.toFixed(8)} BTC</span>
                  </p>

                  <div className="bg-zinc-950/50 border border-white/5 rounded-2xl py-4 px-6 inline-block mb-8 text-left space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Référence</p>
                    <p className="font-mono text-sm text-zinc-300">{btcResult.reference}</p>
                  </div>

                  <button
                    onClick={() => setBtcModalOpen(false)}
                    className="w-full py-4 rounded-xl font-bold text-zinc-950 bg-white hover:bg-zinc-200 transition-colors"
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
// Composant : Formulaire Stripe Elements (Dark Mode)
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
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-200 leading-relaxed">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 rounded-xl border border-white/10 text-zinc-300 font-bold hover:bg-white/5 transition-colors text-sm"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isSubmitting}
          className="flex-[2] py-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm text-zinc-950 bg-amber-500 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
          {isSubmitting ? "Traitement..." : "Payer en sécurité"}
        </button>
      </div>

      <p className="text-[10px] uppercase font-bold tracking-widest text-center text-zinc-600 flex items-center justify-center gap-1.5 pt-2">
        <Lock className="w-3 h-3" />
        Infrastructure Stripe PCI-DSS
      </p>
    </form>
  );
}
