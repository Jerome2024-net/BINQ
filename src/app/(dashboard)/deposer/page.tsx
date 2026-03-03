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

// ─── Payment Form (inside Elements) ───
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
        // Confirm deposit on backend
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
      {/* Summary */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Montant à créditer</span>
          <span className="text-gray-900 font-bold">{montant.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Frais (1%)</span>
          <span className="text-gray-600">{frais.toFixed(2)} €</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
          <span className="text-gray-900">Total facturé</span>
          <span className="text-gray-900">{total.toFixed(2)} €</span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="rounded-2xl border border-gray-200 p-4">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      <div className="flex items-center gap-2 px-1 text-xs text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>Paiement sécurisé par Stripe. Vos données sont chiffrées.</span>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-[1] py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm"
        >
          Retour
        </button>
        <button
          type="submit"
          disabled={!stripe || paying}
          className="flex-[2] py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {paying ? "Paiement en cours..." : `Payer ${total.toFixed(2)} €`}
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ───
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
    <div className="max-w-lg mx-auto space-y-5 sm:space-y-6 pb-12">

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Ajouter de l&apos;<span className="text-amber-600">argent</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Alimentez votre portefeuille Binq par carte bancaire.</p>
      </div>

      {/* Solde banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
        <Wallet className="w-4 h-4 text-gray-400 shrink-0" />
        <p className="text-sm text-gray-600">
          Solde actuel : <span className="font-bold text-gray-900">{solde.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
        </p>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm">

        {/* ── Step 1: Amount ── */}
        {step === "amount" && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <ArrowDownToLine className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Montant du dépôt</h3>
                <p className="text-xs text-gray-400">Choisissez combien ajouter</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-4">Montant à créditer</p>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-5xl font-black text-gray-900 placeholder-gray-200 focus:outline-none text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
              />
              <p className="text-center text-xs text-gray-400 mt-2">EUR</p>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {[10, 50, 100, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                    amount === amt.toString()
                      ? "border-amber-500 bg-amber-50 text-amber-600"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {amt} €
                </button>
              ))}
            </div>

            {/* Fee info */}
            {montant > 0 && (
              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant crédité</span>
                  <span className="font-bold text-gray-900">{montant.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frais (1%)</span>
                  <span className="text-gray-600">{fraisCalc.toFixed(2)} €</span>
                </div>
                <div className="border-t border-amber-200/60 pt-1.5 flex justify-between font-bold">
                  <span className="text-gray-900">Total facturé</span>
                  <span className="text-gray-900">{totalCalc.toFixed(2)} €</span>
                </div>
              </div>
            )}

            <button
              onClick={handleContinue}
              disabled={montant < 1 || loading}
              className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {loading ? "Préparation..." : "Passer au paiement"}
            </button>

            <div className="flex items-start gap-2.5 text-xs text-gray-400 px-1">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Des frais de 1% s&apos;appliquent à chaque dépôt. Les transferts entre utilisateurs Binq sont gratuits.</span>
            </div>
          </div>
        )}

        {/* ── Step 2: Stripe Payment ── */}
        {step === "payment" && clientSecret && paymentIntentId && (
          <div className="p-5 sm:p-6">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#f59e0b",
                    colorBackground: "#ffffff",
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
          <div className="p-5 sm:p-6 text-center py-10">
            <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Dépôt confirmé !</h3>
            <p className="text-base text-gray-500 mb-2">
              <span className="text-gray-900 font-bold">{result.montant.toFixed(2)} €</span> ont été crédités sur votre portefeuille
            </p>
            {result.solde > 0 && (
              <p className="text-sm text-gray-400">
                Nouveau solde : <span className="font-bold text-gray-600">{result.solde.toFixed(2)} €</span>
              </p>
            )}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl py-3 px-5 inline-block mt-4 mb-8">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Référence</p>
              <p className="font-mono text-sm text-gray-600 break-all">{result.reference}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="flex-1 py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm">
                Nouveau dépôt
              </button>
              <a href="/portefeuille" className="flex-1 py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors text-sm text-center">
                Mon portefeuille
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
