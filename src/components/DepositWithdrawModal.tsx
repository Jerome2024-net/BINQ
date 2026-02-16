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
    label: "Stripe Payout",
    icon: Banknote,
    desc: "Vers votre compte Stripe Connect",
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
      <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
        <p className="text-sm text-green-600 mb-1">Montant à payer</p>
        <p className="text-3xl font-bold text-green-700">
          {montant.toLocaleString("fr-FR")} {deviseSymbol}
        </p>
        <p className="text-xs text-green-500 mt-1">Dépôt sans frais</p>
      </div>

      {/* Stripe PaymentElement (vrai formulaire Stripe) */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {errorMessage && (
        <div className="bg-red-50 rounded-xl p-3 text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Boutons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Retour
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isSubmitting}
          className="flex-1 py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Paiement...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Payer {montant.toLocaleString("fr-FR")} {deviseSymbol}
            </>
          )}
        </button>
      </div>

      {/* Sécurité */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Paiement sécurisé via Stripe · Chiffrement SSL 256 bits</span>
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
      setErrorMsg("Configurez vos clés Stripe dans .env.local pour effectuer de vrais paiements");
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
      setErrorMsg("Impossible de créer le paiement. Vérifiez votre configuration Stripe.");
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
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 p-6 border-b border-gray-100 ${isDepot ? "bg-green-50" : "bg-blue-50"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDepot ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Paiement sécurisé via Stripe
            </p>
          </div>
          <button onClick={handleClose} className="ml-auto p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* ============ NON CONFIGURÉ ============ */}
          {!isConfigured && step === "form" ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Configuration requise</h3>
                <p className="text-sm text-gray-500">
                  Pour effectuer de vrais paiements, vous devez configurer votre compte Stripe.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3">
                <p className="text-sm font-semibold text-gray-700">🔧 Étapes de configuration :</p>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Créez un compte sur <strong>stripe.com</strong></li>
                  <li>Récupérez vos clés <strong>Publishable</strong> et <strong>Secret</strong></li>
                  <li>
                    Ajoutez-les dans le fichier <code className="bg-gray-200 px-1 rounded text-xs">.env.local</code> :
                  </li>
                </ol>
                <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-green-400">
                  <p>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...</p>
                  <p>STRIPE_SECRET_KEY=sk_test_...</p>
                </div>
                <p className="text-xs text-gray-400">Redémarrez le serveur après modification.</p>
              </div>

              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Aller sur Stripe Dashboard <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : step === "done" ? (
            /* ============ SUCCÈS ============ */
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {isDepot ? "Dépôt confirmé !" : "Retrait initié !"}
              </h3>
              <p className="text-gray-500">
                {montantNum.toLocaleString("fr-FR")} {deviseSymbol}{" "}
                {isDepot ? "ajoutés à votre portefeuille" : `vers ${methode === "virement" ? "votre banque" : "Stripe"}`}
              </p>
              {reference && <p className="text-sm text-gray-400 mt-2">Réf: {reference}</p>}
              {!isDepot && <p className="text-xs text-gray-400 mt-3">Traitement sous 24-48h ouvrées</p>}
              <button onClick={handleClose} className="btn-primary mt-4 px-8">
                Fermer
              </button>
            </div>
          ) : step === "error" ? (
            /* ============ ERREUR ============ */
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Erreur</h3>
              <p className="text-red-500 text-sm mb-4">{errorMsg}</p>
              <button onClick={() => setStep("form")} className="btn-primary">
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
                    colorPrimary: "#059669",
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
            /* ============ FORMULAIRE DÉPÔT (saisie montant) ============ */
            <div className="space-y-5">
              {/* Info Stripe */}
              <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  Payez en toute sécurité par <strong>carte bancaire</strong> via Stripe.
                  Vos informations de paiement ne sont jamais stockées sur nos serveurs.
                </p>
              </div>

              {/* Solde actuel */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">Solde actuel</p>
                <p className="text-2xl font-bold text-gray-900">
                  {soldeActuel.toLocaleString("fr-FR")} {deviseSymbol}
                </p>
              </div>

              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Montant à déposer ({deviseSymbol})
                </label>
                <input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="input-field text-lg"
                  placeholder="Ex: 100"
                  min="1"
                  step="0.01"
                />
                {montantNum > 0 && montantNum < 1 && (
                  <p className="text-sm text-red-500 mt-1">Montant minimum : 1 {deviseSymbol}</p>
                )}
              </div>

              {/* Montants rapides */}
              <div className="flex flex-wrap gap-2">
                {montantsRapides.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMontant(String(m))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      montantNum === m
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {m.toLocaleString("fr-FR")} {deviseSymbol}
                  </button>
                ))}
              </div>

              {/* Résumé */}
              {montantNum >= 1 && (
                <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Dépôt <strong>sans frais</strong> · {montantNum.toLocaleString("fr-FR")} {deviseSymbol}
                  </span>
                </div>
              )}

              {/* Bouton Continuer vers le paiement */}
              <button
                onClick={handleProceedToPayment}
                disabled={montantNum < 1 || isProcessing || isCreatingIntent}
                className={`w-full py-3.5 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 text-lg ${
                  montantNum >= 1 && !isCreatingIntent
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {isCreatingIntent ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Préparation du paiement...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Continuer vers le paiement
                  </>
                )}
              </button>

              {/* Sécurité */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Paiement sécurisé via Stripe · SSL 256 bits</span>
              </div>
            </div>
          ) : (
            /* ============ FORMULAIRE RETRAIT ============ */
            <div className="space-y-5">
              {/* Solde */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">Solde disponible</p>
                <p className="text-2xl font-bold text-gray-900">
                  {soldeActuel.toLocaleString("fr-FR")} {deviseSymbol}
                </p>
              </div>

              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Montant à retirer ({deviseSymbol})
                </label>
                <input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="input-field text-lg"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {isDepassement && (
                  <p className="text-sm text-red-500 mt-1">
                    Solde insuffisant (max: {soldeActuel.toLocaleString("fr-FR")} {deviseSymbol})
                  </p>
                )}
              </div>

              {/* Montants rapides */}
              <div className="flex flex-wrap gap-2">
                {montantsRapides.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMontant(String(m))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      montantNum === m
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {m.toLocaleString("fr-FR")} {deviseSymbol}
                  </button>
                ))}
              </div>

              {/* Méthode de retrait */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          methode === m.id ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <m.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{m.label}</p>
                        <p className="text-xs text-gray-500">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  IBAN / Numéro de compte
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="input-field"
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                />
              </div>

              {/* Bouton Retirer */}
              <button
                onClick={handleRetrait}
                disabled={montantNum <= 0 || isDepassement || !destination.trim()}
                className={`w-full py-3.5 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                  montantNum > 0 && !isDepassement && destination.trim()
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                <ArrowUpFromLine className="w-5 h-5" />
                Retirer {montantNum > 0 ? `${montantNum.toLocaleString("fr-FR")} ${deviseSymbol}` : ""}
              </button>

              {/* Sécurité */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Retrait sécurisé · Traitement sous 24-48h</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
