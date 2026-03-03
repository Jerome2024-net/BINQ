"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { getStripe } from "@/lib/stripe-client";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  ArrowDownToLine,
  CreditCard,
  CheckCircle2,
  Loader2,
  Info,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const stripePromise = getStripe();

function PaymentForm({
  montant,
  frais,
  total,
  paymentIntentId,
  onSuccess,
  onBack,
}: {
  montant: number;
  frais: number;
  total: number;
  paymentIntentId: string;
  onSuccess: (data: { montant: number; reference: string; solde: number }) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { showToast } = useToast();
  const [paying, setPaying] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });

      if (error) {
        showToast("error", "Paiement échoué", error.message || "Erreur carte");
        setPaying(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        const res = await fetch("/api/wallet/deposit-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId }),
        });
        const data = await res.json();
        if (data.success) {
          onSuccess({ montant: data.montant_credite, reference: data.reference, solde: data.nouveau_solde });
        } else {
          showToast("success", "Paiement reçu", "Votre dépôt sera crédité sous peu.");
          onSuccess({ montant, reference: paymentIntent.id, solde: 0 });
        }
      }
    } catch {
      showToast("error", "Erreur", "Erreur lors du paiement");
    } finally {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-5 space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-white/30">Montant crédité</span>
          <span className="text-white font-bold">{montant.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/30">Frais (1%)</span>
          <span className="text-white/50">{frais.toFixed(2)} €</span>
        </div>
        <div className="border-t border-white/[0.05] pt-2 flex justify-between text-sm font-bold">
          <span className="text-white/60">Total facturé</span>
          <span className="text-white">{total.toFixed(2)} €</span>
        </div>
      </div>

      <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.08] p-4">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      <div className="flex items-center gap-2 px-1 text-[11px] text-white/20">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>Paiement sécurisé par Stripe. Données chiffrées.</span>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-[1] py-4 rounded-xl border border-white/[0.08] text-white/40 font-bold hover:bg-white/[0.04] transition-colors text-sm active:scale-[0.98]"
        >
          Retour
        </button>
        <button
          type="submit"
          disabled={!stripe || paying}
          className="flex-[2] py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
        >
          {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {paying ? "Paiement..." : `Payer ${total.toFixed(2)} €`}
        </button>
      </div>
    </form>
  );
}

export default function DeposerPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<"amount" | "payment" | "success">("amount");
  const [amount, setAmount] = useState("");
  const [solde, setSolde] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [frais, setFrais] = useState(0);
  const [total, setTotal] = useState(0);
  const [result, setResult] = useState<{ montant: number; reference: string; solde: number } | null>(null);

  useEffect(() => {
    if (user) {
      fetch("/api/wallet")
        .then((r) => r.json())
        .then((data) => { if (data.wallet) setSolde(data.wallet.solde || 0); })
        .catch(() => {});
    }
  }, [user]);

  const montant = parseFloat(amount) || 0;
  const fraisCalc = Math.round(montant * 100 * 0.01) / 100;
  const totalCalc = montant + fraisCalc;

  const handleContinue = async () => {
    if (montant < 1) {
      showToast("error", "Montant minimum", "Le montant minimum est de 1,00 €");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: montant, currency: "eur", description: "Dépôt portefeuille Binq" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Impossible de créer le paiement");
        return;
      }
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setFrais(data.fraisBinq);
      setTotal(data.totalFacture);
      setStep("payment");
    } catch {
      showToast("error", "Erreur", "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (data: { montant: number; reference: string; solde: number }) => {
    setResult(data);
    if (data.solde) setSolde(data.solde);
    else setSolde((prev) => prev + data.montant);
    setStep("success");
  };

  const reset = () => {
    setStep("amount");
    setAmount("");
    setClientSecret(null);
    setPaymentIntentId(null);
    setResult(null);
  };

  return (
    <div className="space-y-5 pb-8">

      <div>
        <h1 className="text-xl font-black tracking-tight">
          Ajouter de l&apos;<span className="text-emerald-400">argent</span>
        </h1>
        <p className="text-white/30 text-sm mt-0.5">Alimentez votre portefeuille par carte.</p>
      </div>

      {/* Solde banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        <Wallet className="w-4 h-4 text-white/20 shrink-0" />
        <p className="text-sm text-white/40">
          Solde actuel : <span className="font-bold text-white">{solde.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
        </p>
      </div>

      {/* ── Step 1: Amount ── */}
      {step === "amount" && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Montant du dépôt</h3>
              <p className="text-[11px] text-white/25">Choisissez combien ajouter</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-6">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider text-center mb-4">Montant à créditer</p>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent text-5xl font-black text-white placeholder-white/10 focus:outline-none text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              autoFocus
            />
            <p className="text-center text-[11px] text-white/20 mt-2">EUR</p>
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2">
            {[10, 50, 100, 500].map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className={`py-3 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
                  amount === amt.toString()
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-white/[0.06] text-white/30 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                {amt} €
              </button>
            ))}
          </div>

          {/* Fee breakdown */}
          {montant > 0 && (
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Crédité</span>
                <span className="font-bold text-white">{montant.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Frais (1%)</span>
                <span className="text-white/50">{fraisCalc.toFixed(2)} €</span>
              </div>
              <div className="border-t border-emerald-500/10 pt-1.5 flex justify-between font-bold">
                <span className="text-white/60">Total facturé</span>
                <span className="text-white">{totalCalc.toFixed(2)} €</span>
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={montant < 1 || loading}
            className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {loading ? "Préparation..." : "Passer au paiement"}
          </button>

          <div className="flex items-start gap-2.5 text-[11px] text-white/20 px-1">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Frais de 1% par dépôt. Transferts entre utilisateurs Binq gratuits.</span>
          </div>
        </div>
      )}

      {/* ── Step 2: Stripe Payment ── */}
      {step === "payment" && clientSecret && paymentIntentId && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5">
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "night",
                variables: {
                  colorPrimary: "#10b981",
                  colorBackground: "#1a1a1a",
                  colorText: "#ffffff",
                  colorTextSecondary: "#ffffff80",
                  fontFamily: "system-ui, sans-serif",
                  borderRadius: "12px",
                },
              },
            }}
          >
            <PaymentForm
              montant={montant}
              frais={frais}
              total={total}
              paymentIntentId={paymentIntentId}
              onSuccess={handleSuccess}
              onBack={() => setStep("amount")}
            />
          </Elements>
        </div>
      )}

      {/* ── Step 3: Success ── */}
      {step === "success" && result && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 text-center py-10">
          <div className="w-20 h-20 bg-emerald-500/15 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Dépôt confirmé !</h3>
          <p className="text-base text-white/40 mb-2">
            <span className="text-white font-bold">{result.montant.toFixed(2)} €</span> crédités
          </p>
          {result.solde > 0 && (
            <p className="text-sm text-white/25">
              Nouveau solde : <span className="font-bold text-emerald-400">{result.solde.toFixed(2)} €</span>
            </p>
          )}
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl py-3 px-5 inline-block mt-4 mb-8">
            <p className="text-[10px] text-white/20 uppercase tracking-wider font-bold">Référence</p>
            <p className="font-mono text-sm text-white/40 break-all">{result.reference}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 py-4 rounded-xl border border-white/[0.08] text-white/40 font-bold hover:bg-white/[0.04] transition-colors text-sm active:scale-[0.98]">
              Nouveau dépôt
            </button>
            <a href="/portefeuille" className="flex-1 py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-colors text-sm text-center active:scale-[0.98]">
              Historique
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
