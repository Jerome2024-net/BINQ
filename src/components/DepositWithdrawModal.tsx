"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  X,
  Building,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Wallet,
  ExternalLink,
  Info,
  Loader2,
  CreditCard,
  ArrowLeft,
  Banknote,
} from "lucide-react";
import { usePayment } from "@/contexts/PaymentContext";
import { getStripe } from "@/lib/stripe-client";

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "depot" | "retrait";
  onRetrait: (montant: number, methode: string) => { success: boolean; error?: string } | Promise<{ success: boolean; error?: string }>;
  soldeActuel: number;
  devise: string;
}

const methodesRetrait = [
  {
    id: "virement",
    label: "Virement Bancaire",
    icon: Building,
    desc: "Vers votre compte bancaire (SEPA/SWIFT)",
  },
  {
    id: "stripe_payout",
    label: "Retrait instantané",
    icon: Banknote,
    desc: "Vers votre compte bancaire vérifié",
  },
];

const getMontantsRapides = (devise: string) => {
  if (devise === "USD") return [10, 25, 50, 100, 250, 500];
  return [10, 25, 50, 100, 250, 500]; // EUR
};

// ========================
// Composant interne pour le formulaire Stripe Elements
// ========================
function StripePaymentForm({
  montant,
  devise,
  onSuccess,
  onCancel,
}: {
  montant: number;
  devise: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deviseSymbol = devise === "USD" ? "$" : "€";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/portefeuille?payment=success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Le paiement a échoué");
      } else {
        // Paiement réussi (sans redirection)
        onSuccess();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur lors du paiement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Récapitulatif */}
      <div className="bg-white/5 rounded-2xl p-5 text-center border border-white/10">
        <p className="text-sm text-slate-400 mb-1">Montant crédité sur votre wallet</p>
        <p className="text-3xl font-bold text-white">
          {montant.toLocaleString("fr-FR")} {deviseSymbol}
        </p>
        <div className="mt-3 space-y-1">
          <p className="text-xs text-slate-500">Frais Binq (1%) : +{(montant * 0.01).toFixed(2)} {deviseSymbol}</p>
          <p className="text-sm font-semibold text-indigo-400">Total débité : {(montant * 1.01).toFixed(2)} {deviseSymbol}</p>
        </div>
      </div>

      {/* Stripe PaymentElement */}
      <div className="border border-white/10 rounded-2xl p-4 bg-white">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 rounded-xl p-3 text-sm text-red-400 flex items-center gap-2 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Boutons */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-3.5 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Retour
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isSubmitting}
          className="flex-1 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Paiement...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Payer {(montant * 1.01).toFixed(2)} {deviseSymbol}
            </>
          )}
        </button>
      </div>

      {/* Sécurité */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Paiement sécurisé · Chiffrement SSL 256 bits</span>
      </div>
    </form>
  );
}

// ========================
// Modal principal
// ========================
export default function DepositWithdrawModal({
  isOpen,
  onClose,
  mode,
  onRetrait,
  soldeActuel,
  devise,
}: DepositWithdrawModalProps) {
  const { createPaymentIntent, confirmDeposit, initierRetrait, isProcessing, isConfigured, currency } = usePayment();
  const [montant, setMontant] = useState("");
  const [methode, setMethode] = useState("virement");
  const [destination, setDestination] = useState("");
  const [step, setStep] = useState<"form" | "payment" | "done" | "error">("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [reference, setReference] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  if (!isOpen) return null;

  const montantNum = parseFloat(montant) || 0;
  const isDepassement = mode === "retrait" && montantNum > soldeActuel;
  const isDepot = mode === "depot";
  const deviseSymbol = devise === "USD" ? "$" : "€";
  const montantsRapides = getMontantsRapides(devise);

  // ========================
  // DÉPÔT : créer PaymentIntent puis afficher Stripe Elements
  // ========================
  const handleProceedToPayment = async () => {
    if (montantNum < 1) return;

    if (!isConfigured) {
      setErrorMsg("Le système de paiement n'est pas encore configuré. Contactez le support.");
      setStep("error");
      return;
    }

    setIsCreatingIntent(true);

    const result = await createPaymentIntent(montantNum, currency);

    if (result) {
      setClientSecret(result.clientSecret);
      setPaymentIntentId(result.paymentIntentId);
      setStep("payment");
    } else {
      setErrorMsg("Impossible de créer le paiement. Réessayez ou contactez le support.");
      setStep("error");
    }

    setIsCreatingIntent(false);
  };

  // ========================
  // Succès du paiement Stripe
  // ========================
  const handlePaymentSuccess = () => {
    confirmDeposit(montantNum, paymentIntentId);
    setReference(`DEP-${Date.now().toString(36).toUpperCase()}`);
    setStep("done");
  };

  // ========================
  // RETRAIT
  // ========================
  const handleRetrait = async () => {
    if (montantNum <= 0 || isDepassement) return;
    if (!destination.trim()) return;

    const result = await onRetrait(montantNum, methode);
    if (result.success) {
      initierRetrait(montantNum, methode, destination);
      setReference(`RET-${Date.now().toString(36).toUpperCase()}`);
      setStep("done");
    } else {
      setErrorMsg(result.error || "Erreur lors du retrait");
      setStep("error");
    }
  };

  const reset = () => {
    setMontant("");
    setMethode("virement");
    setDestination("");
    setStep("form");
    setErrorMsg("");
    setReference("");
    setClientSecret("");
    setPaymentIntentId("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const title = isDepot ? "Déposer de l'argent" : "Retirer de l'argent";
  const icon = isDepot ? <ArrowDownToLine className="w-6 h-6" /> : <ArrowUpFromLine className="w-6 h-6" />;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center animate-in fade-in duration-200" onClick={handleClose}>
      <div
        className="bg-[#0F172A] rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto border border-white/10 animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 sm:p-6 border-b border-white/10">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDepot ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400'}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Transaction sécurisée
            </p>
          </div>
          <button onClick={handleClose} className="ml-auto p-2 rounded-xl hover:bg-white/5 transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-5 sm:p-6 pb-8">
          {/* ============ NON CONFIGURÉ ============ */}
          {!isConfigured && step === "form" ? (
            <div className="text-center py-8 space-y-5">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-amber-500/20">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Configuration requise</h3>
                <p className="text-sm text-slate-400">
                  Pour effectuer des transactions réelles, vous devez configurer Stripe.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 text-left space-y-3 border border-white/10">
                <p className="text-sm font-semibold text-white">Étapes de configuration :</p>
                <ol className="text-xs sm:text-sm text-slate-400 space-y-2 list-decimal list-inside marker:text-slate-600">
                  <li>Créez un compte sur <strong className="text-white">stripe.com</strong></li>
                  <li>Récupérez vos clés <strong className="text-white">Publishable</strong> et <strong className="text-white">Secret</strong></li>
                  <li>
                    Ajoutez-les dans <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">.env.local</code>
                  </li>
                </ol>

                <div className="bg-black/50 rounded-xl p-3 font-mono text-xs text-emerald-400 overflow-x-auto border border-white/5">
                  <p className="whitespace-nowrap">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...</p>
                  <p className="whitespace-nowrap">STRIPE_SECRET_KEY=sk_test_...</p>
                </div>
              </div>

              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
              >
                Accéder au Dashboard Stripe <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : step === "done" ? (
            /* ============ SUCCÈS ============ */
            <div className="text-center py-6 sm:py-8 animate-in zoom-in-50 duration-300">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {isDepot ? "Dépôt confirmé !" : "Retrait initié !"}
              </h3>
              <p className="text-slate-400 mb-6">
                <span className="text-white font-semibold">{montantNum.toLocaleString("fr-FR")} {deviseSymbol}</span>
                {" "}{isDepot ? "ont été crédités sur votre compte." : "en cours de transfert vers votre compte."}
              </p>
              
              {reference && (
                <div className="bg-white/5 rounded-xl py-2 px-4 inline-block mb-6 border border-white/10">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Référence</p>
                  <p className="font-mono text-slate-300">{reference}</p>
                </div>
              )}
              
              <button 
                onClick={handleClose} 
                className="w-full py-3.5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
              >
                Fermer
              </button>
            </div>
          ) : step === "error" ? (
            /* ============ ERREUR ============ */
            <div className="text-center py-6 sm:py-8 animate-in zoom-in-50 duration-300">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-red-500/20">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Une erreur est survenue</h3>
              <p className="text-red-400/80 text-sm mb-6 max-w-[260px] mx-auto">{errorMsg}</p>
              <button 
                onClick={() => setStep("form")} 
                className="w-full py-3.5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
              >
                Réessayer
              </button>
            </div>
          ) : step === "payment" && isDepot && clientSecret ? (
            /* ============ FORMULAIRE STRIPE ELEMENTS ============ */
            <Elements
              stripe={getStripe()}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  labels: "floating",
                  variables: {
                    colorPrimary: "#6366f1", // Indigo 500
                    colorBackground: "#1e293b", // Slate 800
                    colorText: "#f8fafc", // Slate 50
                    colorDanger: "#ef4444", // Red 500
                    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    spacingUnit: "4px",
                    borderRadius: "12px",
                  },
                },
                locale: "fr",
              }}
            >
              <StripePaymentForm
                montant={montantNum}
                devise={devise}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setStep("form")}
              />
            </Elements>
          ) : isDepot ? (
            /* ============ FORMULAIRE DÉPÔT ============ */
            <div className="space-y-6">
              {/* Solde actuel */}
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-5 text-center border border-white/10">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Solde disponible</p>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {soldeActuel.toLocaleString("fr-FR")} {deviseSymbol}
                </p>
              </div>

              {/* Montant */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  Montant à déposer
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-medium group-focus-within:text-indigo-400 transition-colors">
                      {deviseSymbol}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-lg font-medium"
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    autoFocus
                  />
                </div>

                {/* Montants rapides */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {montantsRapides.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMontant(String(m))}
                      className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                        montantNum === m
                          ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                          : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Résumé avec frais */}
              {montantNum >= 1 && (
                <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/10 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Montant crédité</span>
                    <span className="text-white font-medium">{montantNum.toLocaleString("fr-FR")} {deviseSymbol}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Frais Binq (1%)</span>
                    <span className="text-slate-400">+{(montantNum * 0.01).toFixed(2)} {deviseSymbol}</span>
                  </div>
                  <div className="h-px bg-indigo-500/10 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-indigo-300">Total payé</span>
                    <span className="text-base font-bold text-white">{(montantNum * 1.01).toFixed(2)} {deviseSymbol}</span>
                  </div>
                </div>
              )}

              {/* Bouton Continuer */}
              <button
                onClick={handleProceedToPayment}
                disabled={montantNum < 1 || isProcessing || isCreatingIntent}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 group ${
                  montantNum >= 1 && !isCreatingIntent
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-500/20 hover:shadow-indigo-500/30"
                    : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                }`}
              >
                {isCreatingIntent ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Préparation du paiement...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Continuer vers le paiement</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 opacity-60">
                <ShieldCheck className="w-3.5 h-3.5" />
                Transactions sécurisées par Stripe
              </p>
            </div>
          ) : (
            /* ============ FORMULAIRE RETRAIT ============ */
            <div className="space-y-6">
              {/* Solde */}
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-5 text-center border border-white/10">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Solde disponible</p>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {soldeActuel.toLocaleString("fr-FR")} {deviseSymbol}
                </p>
              </div>

              {/* Montant */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
                  Montant à retirer
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-medium group-focus-within:text-orange-400 transition-colors">
                      {deviseSymbol}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-lg font-medium"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    autoFocus
                  />
                </div>

                {/* Montants rapides */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {montantsRapides.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMontant(String(m))}
                      className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                        montantNum === m
                          ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                          : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Méthode de retrait */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
                  Mode de réception
                </label>
                <div className="space-y-2">
                  {methodesRetrait.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethode(m.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        methode === m.id
                          ? "bg-orange-500/10 border-orange-500/30 ring-1 ring-orange-500/20"
                          : "bg-white/5 border-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          methode === m.id ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-white/5 text-slate-400"
                        }`}
                      >
                        <m.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${methode === m.id ? "text-white" : "text-slate-300"}`}>{m.label}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{m.desc}</p>
                      </div>
                      {methode === m.id && <div className="w-2 h-2 rounded-full bg-orange-500"></div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
                  IBAN / Numéro de compte
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all font-mono text-sm"
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                />
              </div>

              {/* Bouton Retirer */}
              <button
                onClick={handleRetrait}
                disabled={montantNum <= 0 || isDepassement || !destination.trim()}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 group ${
                  montantNum > 0 && !isDepassement && destination.trim()
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-orange-500/20 hover:shadow-orange-500/30"
                    : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                }`}
              >
                <ArrowUpFromLine className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                Retirer {montantNum > 0 ? `${montantNum.toLocaleString("fr-FR")} ${deviseSymbol}` : ""}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
