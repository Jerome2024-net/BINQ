"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess } from "@/lib/haptics";
import { getStripe } from "@/lib/stripe-client";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { type DeviseCode, DEVISE_LIST, DEVISES, DEFAULT_DEVISE, formatMontant, calcDepositStripeAmount } from "@/lib/currencies";
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
  montantCredite,
  devise,
  fraisEur,
  totalEur,
  paymentIntentId,
  onSuccess,
  onBack,
}: {
  montantCredite: number;
  devise: DeviseCode;
  fraisEur: number;
  totalEur: number;
  paymentIntentId: string;
  onSuccess: (data: { montant: number; reference: string; solde: number; devise: DeviseCode }) => void;
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
          onSuccess({ montant: data.montant_credite, reference: data.reference, solde: data.nouveau_solde, devise: data.devise || devise });
        } else {
          hapticSuccess();
          showToast("success", "Paiement reçu", "Votre dépôt sera crédité sous peu.");
          onSuccess({ montant: montantCredite, reference: paymentIntent.id, solde: 0, devise });
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
      <div className="rounded-2xl bg-gray-50/50 border border-gray-200/50 p-5 space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">Montant crédité</span>
          <span className="text-gray-900 font-bold">{formatMontant(montantCredite, devise)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">Frais (1%)</span>
          <span className="text-gray-600">{fraisEur.toFixed(2)} €</span>
        </div>
        <div className="border-t border-gray-200/50 pt-2 flex justify-between text-sm font-bold">
          <span className="text-gray-700">Total facturé</span>
          <span className="text-gray-900">{totalEur.toFixed(2)} €</span>
        </div>
      </div>

      <div className="rounded-2xl bg-gray-50 border border-gray-200/60 p-4">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      <div className="flex items-center gap-2 px-1 text-[11px] text-gray-700">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>Paiement sécurisé par Stripe. Données chiffrées.</span>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-[1] py-4 rounded-xl border border-gray-200/60 text-gray-600 font-bold hover:bg-gray-50/80 transition-colors text-sm active:scale-[0.98]"
        >
          Retour
        </button>
        <button
          type="submit"
          disabled={!stripe || paying}
          className="flex-[2] py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
        >
          {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {paying ? "Paiement..." : `Payer ${totalEur.toFixed(2)} €`}
        </button>
      </div>
    </form>
  );
}

export default function DeposerPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<"amount" | "payment" | "success">("amount");
  const [devise, setDevise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("binq_devise") as DeviseCode) || DEFAULT_DEVISE;
    }
    return DEFAULT_DEVISE;
  });
  const [amount, setAmount] = useState("");
  const [solde, setSolde] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [depositInfo, setDepositInfo] = useState<{ montantCredite: number; fraisEur: number; totalEur: number } | null>(null);
  const [result, setResult] = useState<{ montant: number; reference: string; solde: number; devise: DeviseCode } | null>(null);

  const switchDevise = (d: DeviseCode) => {
    setDevise(d);
    setAmount("");
    localStorage.setItem("binq_devise", d);
  };

  useEffect(() => {
    if (user) {
      fetch(`/api/wallet?devise=${devise}`)
        .then((r) => r.json())
        .then((data) => { if (data.wallet) setSolde(data.wallet.solde || 0); })
        .catch(() => {});
    }
  }, [user, devise]);

  const montant = parseFloat(amount) || 0;
  const deviseConfig = DEVISES[devise];
  const calc = montant > 0 ? calcDepositStripeAmount(montant, devise) : null;

  const quickAmounts = devise === "XOF" ? [1000, 5000, 10000, 50000] : [10, 50, 100, 500];

  const handleContinue = async () => {
    if (montant < deviseConfig.minDeposit) {
      showToast("error", "Montant minimum", `Le montant minimum est de ${formatMontant(deviseConfig.minDeposit, devise)}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: montant, devise, description: `Dépôt portefeuille Binq (${devise})` }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Impossible de créer le paiement");
        return;
      }
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setDepositInfo({ montantCredite: data.montantCredite, fraisEur: data.fraisBinq, totalEur: data.totalFacture });
      setStep("payment");
    } catch {
      showToast("error", "Erreur", "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (data: { montant: number; reference: string; solde: number; devise: DeviseCode }) => {
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
    setDepositInfo(null);
    setResult(null);
  };

  return (
    <div className="space-y-5 pb-8">

      <div>
        <h1 className="text-xl font-black tracking-tight">
          Ajouter de l&apos;<span className="text-emerald-600">argent</span>
        </h1>
        <p className="text-gray-700 text-sm mt-0.5">Alimentez votre portefeuille par carte.</p>
      </div>

      {/* Currency Switcher */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-200/50">
        <Wallet className="w-4 h-4 text-gray-600 shrink-0" />
        <p className="text-sm text-gray-600">
          Solde : <span className="font-bold text-gray-900">{formatMontant(solde, devise)}</span>
        </p>
        <div className="ml-auto flex items-center bg-gray-50/80 rounded-lg overflow-hidden">
          {DEVISE_LIST.map((d) => (
            <button
              key={d}
              onClick={() => switchDevise(d)}
              className={`px-2.5 py-1.5 text-[10px] sm:text-xs font-bold transition-all ${
                devise === d
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-gray-600 hover:text-gray-700"
              }`}
            >
              {DEVISES[d].flag} {d}
            </button>
          ))}
        </div>
      </div>

      {/* ── Step 1: Amount ── */}
      {step === "amount" && (
        <div className="rounded-2xl bg-gray-50/50 border border-gray-200/50 p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Montant du dépôt</h3>
              <p className="text-[11px] text-gray-600">Choisissez combien ajouter en {deviseConfig.label}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50/50 border border-gray-200/50 p-4 sm:p-6">
            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider text-center mb-3 sm:mb-4">Montant à créditer</p>
            <input
              type="number"
              min={deviseConfig.minDeposit}
              step={devise === "XOF" ? "1" : "0.01"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent text-3xl sm:text-5xl font-black text-gray-900 placeholder-gray-300 focus:outline-none text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              autoFocus
            />
            <p className="text-center text-[11px] text-gray-700 mt-2">{deviseConfig.symbol}</p>
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className={`py-3 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
                  amount === amt.toString()
                    ? "border-emerald-200/60 bg-emerald-50 text-emerald-600"
                    : "border-gray-200/50 text-gray-600 bg-gray-50/50 hover:bg-gray-50/80"
                }`}
              >
                {devise === "XOF" ? `${amt.toLocaleString("fr-FR")}` : `${amt} €`}
              </button>
            ))}
          </div>

          {/* Fee breakdown */}
          {calc && montant >= deviseConfig.minDeposit && (
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Crédité</span>
                <span className="font-bold text-gray-900">{formatMontant(calc.montantCredite, devise)}</span>
              </div>
              {devise === "XOF" && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Équivalent EUR</span>
                  <span className="text-gray-600">{calc.montantEur.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Frais (1%)</span>
                <span className="text-gray-600">{calc.fraisEur.toFixed(2)} €</span>
              </div>
              <div className="border-t border-emerald-500/10 pt-1.5 flex justify-between font-bold">
                <span className="text-gray-700">Total facturé (carte)</span>
                <span className="text-gray-900">{calc.totalEur.toFixed(2)} €</span>
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={montant < deviseConfig.minDeposit || loading}
            className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {loading ? "Préparation..." : "Passer au paiement"}
          </button>

          <div className="flex items-start gap-2.5 text-[11px] text-gray-700 px-1">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              {devise === "XOF"
                ? "Votre carte est débitée en EUR au taux fixe 1 € = 655,957 FCFA. Frais 1%."
                : "Frais de 1% par dépôt. Transferts entre utilisateurs Binq gratuits."}
            </span>
          </div>
        </div>
      )}

      {/* ── Step 2: Stripe Payment ── */}
      {step === "payment" && clientSecret && paymentIntentId && depositInfo && (
        <div className="rounded-2xl bg-gray-50/50 border border-gray-200/50 p-5">
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#10b981",
                  colorBackground: "#f9fafb",
                  colorText: "#111827",
                  colorTextSecondary: "#6b7280",
                  fontFamily: "system-ui, sans-serif",
                  borderRadius: "12px",
                },
              },
            }}
          >
            <PaymentForm
              montantCredite={depositInfo.montantCredite}
              devise={devise}
              fraisEur={depositInfo.fraisEur}
              totalEur={depositInfo.totalEur}
              paymentIntentId={paymentIntentId}
              onSuccess={handleSuccess}
              onBack={() => setStep("amount")}
            />
          </Elements>
        </div>
      )}

      {/* ── Step 3: Success ── */}
      {step === "success" && result && (
        <div className="rounded-2xl bg-gray-50/50 border border-gray-200/50 p-5 text-center py-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-6">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">Dépôt confirmé !</h3>
          <p className="text-base text-gray-600 mb-2">
            <span className="text-gray-900 font-bold">{formatMontant(result.montant, result.devise)}</span> crédités
          </p>
          {result.solde > 0 && (
            <p className="text-sm text-gray-600">
              Nouveau solde : <span className="font-bold text-emerald-600">{formatMontant(result.solde, result.devise)}</span>
            </p>
          )}
          <div className="bg-gray-50/50 border border-gray-200/50 rounded-2xl py-3 px-5 inline-block mt-4 mb-8">
            <p className="text-[10px] text-gray-700 uppercase tracking-wider font-bold">Référence</p>
            <p className="font-mono text-sm text-gray-600 break-all">{result.reference}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 py-4 rounded-xl border border-gray-200/60 text-gray-600 font-bold hover:bg-gray-50/80 transition-colors text-sm active:scale-[0.98]">
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
