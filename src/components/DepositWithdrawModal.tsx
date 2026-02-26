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
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Montant crédité</p>
        <p className="text-2xl font-bold text-gray-900">
          {montant.toLocaleString("fr-FR")} {deviseSymbol}
        </p>
        <div className="mt-2 space-y-0.5">
          <p className="text-xs text-gray-400">Frais Binq (1%) : +{(montant * 0.01).toFixed(2)} {deviseSymbol}</p>
          <p className="text-sm font-semibold text-primary-600">Total débité : {(montant * 1.01).toFixed(2)} {deviseSymbol}</p>
        </div>
      </div>

      {/* Stripe PaymentElement */}
      <div className="border border-gray-200 rounded-xl p-4">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {errorMessage && (
        <div className="bg-red-50 rounded-lg p-3 text-sm text-red-600 flex items-center gap-2">
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
          className="flex-1 py-3 rounded-xl font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all text-sm"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Retour
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isSubmitting}
          className="flex-1 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
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
      <p className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3 h-3" />
        Paiement sécurisé via Stripe · SSL 256 bits
      </p>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-[420px] max-h-[92vh] sm:max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDepot ? 'bg-primary-50 text-primary-600' : 'bg-primary-50 text-primary-600'}`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Transaction sécurisée
            </p>
          </div>
          <button onClick={handleClose} className="p-2 -mr-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {/* ============ NON CONFIGURÉ ============ */}
          {!isConfigured && step === "form" ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">Configuration requise</h3>
                <p className="text-sm text-gray-500">
                  Pour effectuer des transactions, configurez votre compte Stripe.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3">
                <p className="text-sm font-semibold text-gray-800">Étapes de configuration :</p>
                <ol className="text-xs text-gray-500 space-y-2 list-decimal list-inside">
                  <li>Créez un compte sur <strong className="text-gray-800">stripe.com</strong></li>
                  <li>Récupérez vos clés <strong className="text-gray-800">Publishable</strong> et <strong className="text-gray-800">Secret</strong></li>
                  <li>
                    Ajoutez-les dans <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">.env.local</code>
                  </li>
                </ol>

                <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400 overflow-x-auto">
                  <p className="whitespace-nowrap">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...</p>
                  <p className="whitespace-nowrap">STRIPE_SECRET_KEY=sk_test_...</p>
                </div>
              </div>

              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
              >
                Accéder au Dashboard Stripe <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : step === "done" ? (
            /* ============ SUCCÈS ============ */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {isDepot ? "Dépôt confirmé !" : "Retrait initié !"}
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                <span className="text-gray-900 font-semibold">{montantNum.toLocaleString("fr-FR")} {deviseSymbol}</span>
                {" "}{isDepot ? "crédités sur votre portefeuille." : "en cours de transfert."}
              </p>
              
              {reference && (
                <div className="bg-gray-50 rounded-lg py-2 px-4 inline-block mb-5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Référence</p>
                  <p className="font-mono text-sm text-gray-700">{reference}</p>
                </div>
              )}
              
              <button 
                onClick={handleClose} 
                className="w-full py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          ) : step === "error" ? (
            /* ============ ERREUR ============ */
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Une erreur est survenue</h3>
              <p className="text-red-500 text-sm mb-5 max-w-[280px] mx-auto">{errorMsg}</p>
              <button 
                onClick={() => setStep("form")} 
                className="w-full py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
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
              <StripePaymentForm
                montant={montantNum}
                devise={devise}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setStep("form")}
              />
            </Elements>
          ) : isDepot ? (
            /* ============ FORMULAIRE DÉPÔT ============ */
            <div className="space-y-5">
              {/* Solde actuel */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Solde disponible</p>
                <p className="text-xl font-bold text-gray-900">
                  {soldeActuel.toLocaleString("fr-FR")} {deviseSymbol}
                </p>
              </div>

              {/* Montant */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 ml-0.5">
                  Montant à déposer ({deviseSymbol})
                </label>
                <input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-lg font-semibold"
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  autoFocus
                />
              </div>

              {/* Montants rapides */}
              <div className="flex flex-wrap gap-2">
                {montantsRapides.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMontant(String(m))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      montantNum === m
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-500"
                    }`}
                  >
                    {m} {deviseSymbol}
                  </button>
                ))}
              </div>

              {/* Résumé avec frais */}
              {montantNum >= 1 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Crédité sur wallet</span>
                    <span className="text-gray-900 font-medium">{montantNum.toLocaleString("fr-FR")} {deviseSymbol}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Frais Binq (1%)</span>
                    <span className="text-amber-600 font-medium">+{(montantNum * 0.01).toFixed(2)} {deviseSymbol}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Total débité</span>
                    <span className="text-base font-bold text-primary-600">{(montantNum * 1.01).toFixed(2)} {deviseSymbol}</span>
                  </div>
                </div>
              )}

              {/* Bouton Continuer */}
              <button
                onClick={handleProceedToPayment}
                disabled={montantNum < 1 || isProcessing || isCreatingIntent}
                className={`w-full py-3.5 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                  montantNum >= 1 && !isCreatingIntent
                    ? "bg-primary-600 hover:bg-primary-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isCreatingIntent ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Préparation...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Continuer vers le paiement</span>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Paiement sécurisé via Stripe · SSL 256 bits
              </p>
            </div>
          ) : (
            /* ============ FORMULAIRE RETRAIT ============ */
            <div className="space-y-5">
              {/* Solde */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Solde disponible</p>
                <p className="text-xl font-bold text-gray-900">
                  {soldeActuel.toLocaleString("fr-FR")} {deviseSymbol}
                </p>
              </div>

              {/* Montant */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 ml-0.5">
                  Montant à retirer ({deviseSymbol})
                </label>
                <input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-lg font-semibold"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  autoFocus
                />
                {isDepassement && (
                  <p className="text-xs text-red-500 ml-0.5">
                    Solde insuffisant (max : {soldeActuel.toLocaleString("fr-FR")} {deviseSymbol})
                  </p>
                )}
              </div>

              {/* Montants rapides */}
              <div className="flex flex-wrap gap-2">
                {montantsRapides.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMontant(String(m))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      montantNum === m
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-500"
                    }`}
                  >
                    {m} {deviseSymbol}
                  </button>
                ))}
              </div>

              {/* Méthode de retrait */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 ml-0.5">
                  Mode de réception
                </label>
                <div className="space-y-2">
                  {methodesRetrait.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethode(m.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        methode === m.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          methode === m.id ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <m.icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">{m.label}</p>
                        <p className="text-[11px] text-gray-400 truncate">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 ml-0.5">
                  IBAN / Numéro de compte
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono text-sm"
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                />
              </div>

              {/* Bouton Retirer */}
              <button
                onClick={handleRetrait}
                disabled={montantNum <= 0 || isDepassement || !destination.trim()}
                className={`w-full py-3.5 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                  montantNum > 0 && !isDepassement && destination.trim()
                    ? "bg-primary-600 hover:bg-primary-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <ArrowUpFromLine className="w-5 h-5" />
                Retirer {montantNum > 0 ? `${montantNum.toLocaleString("fr-FR")} ${deviseSymbol}` : ""}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
