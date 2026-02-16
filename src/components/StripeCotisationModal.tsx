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
  Lock,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  CircleDollarSign,
  Percent,
} from "lucide-react";
import { usePayment, SupportedCurrency } from "@/contexts/PaymentContext";
import { getStripe } from "@/lib/stripe-client";

interface StripeCotisationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
  tontineId: string;
  tontineNom: string;
  tourId: string;
  tourNumero: number;
  montant: number;
  devise: string;
  beneficiaire: string;
}

// ========================
// Stripe Payment Form pour cotisation
// ========================
function CotisationPaymentForm({
  montant,
  frais,
  devise,
  beneficiaire,
  tontineNom,
  tourNumero,
  onSuccess,
  onCancel,
}: {
  montant: number;
  frais: number;
  devise: string;
  beneficiaire: string;
  tontineNom: string;
  tourNumero: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deviseSymbol = devise === "USD" ? "$" : "€";
  const total = montant + frais;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/tontines?payment=success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Le paiement a échoué");
      } else {
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
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
        <p className="text-sm font-medium text-emerald-800 mb-3">Récapitulatif de la cotisation</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tontine</span>
            <span className="font-medium text-gray-900">{tontineNom}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tour</span>
            <span className="font-medium text-gray-900">Tour {tourNumero}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Bénéficiaire</span>
            <span className="font-medium text-gray-900">{beneficiaire}</span>
          </div>
          <hr className="border-emerald-200" />
          <div className="flex justify-between">
            <span className="text-gray-600">Cotisation</span>
            <span className="font-medium">{montant.toLocaleString("fr-FR")} {deviseSymbol}</span>
          </div>
          <div className="flex justify-between text-amber-600">
            <span className="flex items-center gap-1">
              <Percent className="w-3 h-3" />
              Frais plateforme (1%)
            </span>
            <span className="font-medium">{frais.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {deviseSymbol}</span>
          </div>
          <hr className="border-emerald-200" />
          <div className="flex justify-between text-lg font-bold text-emerald-700">
            <span>Total</span>
            <span>{total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {deviseSymbol}</span>
          </div>
        </div>
      </div>

      {/* Stripe PaymentElement */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {errorMessage && (
        <div className="bg-red-50 rounded-xl p-3 text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Annuler
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isSubmitting}
          className="flex-1 py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Paiement...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Payer {total.toLocaleString("fr-FR")} {deviseSymbol}
            </>
          )}
        </button>
      </div>

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
export default function StripeCotisationModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  tontineId,
  tontineNom,
  tourId,
  tourNumero,
  montant,
  devise,
  beneficiaire,
}: StripeCotisationModalProps) {
  const { createCotisationPayment, isProcessing, currency } = usePayment();
  const [step, setStep] = useState<"confirm" | "payment" | "done" | "error">("confirm");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [applicationFee, setApplicationFee] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const deviseSymbol = devise === "USD" ? "$" : "€";
  const frais = Math.round(montant * 0.01 * 100) / 100;

  const handleProceedToPayment = async () => {
    const cur = (devise?.toLowerCase() || "eur") as SupportedCurrency;
    const result = await createCotisationPayment(
      montant + frais, // total avec frais
      cur,
      tontineId,
      tontineNom,
      tourId,
      tourNumero
    );

    if (result) {
      setClientSecret(result.clientSecret);
      setPaymentIntentId(result.paymentIntentId);
      setApplicationFee(result.applicationFee);
      setStep("payment");
    } else {
      setErrorMsg("Impossible de créer le paiement. Réessayez.");
      setStep("error");
    }
  };

  const handlePaymentSuccess = () => {
    setStep("done");
    onPaymentSuccess(paymentIntentId);
  };

  const handleClose = () => {
    setStep("confirm");
    setClientSecret("");
    setPaymentIntentId("");
    setErrorMsg("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-100 bg-emerald-50">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Payer ma cotisation</h2>
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
          {step === "confirm" ? (
            <div className="space-y-5">
              {/* Info cotisation */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tontine</span>
                  <span className="font-semibold text-gray-900">{tontineNom}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tour</span>
                  <span className="font-semibold text-gray-900">Tour {tourNumero}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bénéficiaire</span>
                  <span className="font-semibold text-gray-900">{beneficiaire}</span>
                </div>
                <hr />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cotisation</span>
                  <span className="font-bold text-gray-900">{montant.toLocaleString("fr-FR")} {deviseSymbol}</span>
                </div>
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Frais plateforme (1%)</span>
                  <span className="font-medium">{frais.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {deviseSymbol}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold text-emerald-700">
                  <span>Total à payer</span>
                  <span>{(montant + frais).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {deviseSymbol}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-lg disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Préparation...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Payer par carte
                  </>
                )}
              </button>
            </div>
          ) : step === "payment" && clientSecret ? (
            <Elements
              stripe={getStripe()}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: { colorPrimary: "#059669", borderRadius: "12px" },
                },
                locale: "fr",
              }}
            >
              <CotisationPaymentForm
                montant={montant}
                frais={frais}
                devise={devise}
                beneficiaire={beneficiaire}
                tontineNom={tontineNom}
                tourNumero={tourNumero}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setStep("confirm")}
              />
            </Elements>
          ) : step === "done" ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cotisation payée ! ✅</h3>
              <p className="text-gray-500">
                {montant.toLocaleString("fr-FR")} {deviseSymbol} versés pour {tontineNom} (Tour {tourNumero})
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Le bénéficiaire {beneficiaire} recevra le pot une fois toutes les cotisations collectées.
              </p>
              <button onClick={handleClose} className="btn-primary mt-4 px-8">
                Fermer
              </button>
            </div>
          ) : step === "error" ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Erreur</h3>
              <p className="text-red-500 text-sm mb-4">{errorMsg}</p>
              <button onClick={() => setStep("confirm")} className="btn-primary">
                Réessayer
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
