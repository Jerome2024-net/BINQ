"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePayment } from "@/contexts/PaymentContext";
import {
  Shield,
  CheckCircle2,
  ExternalLink,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";

interface StripeVerificationGuardProps {
  children: React.ReactNode;
  action?: string; // "effectuer un paiement" | "recevoir un paiement"
}

/**
 * Wraps a button/action to require Stripe Connect KYC verification.
 * If verified → renders children normally.
 * If not → intercepts click and shows verification modal.
 */
export default function StripeVerificationGuard({
  children,
  action = "continuer",
}: StripeVerificationGuardProps) {
  const { user } = useAuth();
  const { createConnectAccount, getOnboardingLink, isProcessing } = usePayment();
  const [showModal, setShowModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Vérification basée sur les données du profil user (pas d'appel API)
  const isVerified = !!(
    user?.stripeAccountId &&
    user?.stripeChargesEnabled
  );
  const isPending = !!(
    user?.stripeAccountId &&
    user?.stripeOnboardingComplete &&
    !user?.stripeChargesEnabled
  );
  const hasAccount = !!user?.stripeAccountId;

  // Si vérifié → rendre les children normalement
  if (isVerified) {
    return <>{children}</>;
  }

  const startVerification = async () => {
    if (!user) return;
    setIsRedirecting(true);
    setErrorMessage("");

    try {
      // Si pas de compte Stripe → en créer un d'abord
      if (!hasAccount) {
        const result = await createConnectAccount();
        if (!result) {
          setErrorMessage("Impossible de créer le compte de vérification. Réessayez.");
          setIsRedirecting(false);
          return;
        }
      }

      // Obtenir le lien d'onboarding
      const url = await getOnboardingLink();
      if (url) {
        window.location.href = url;
      } else {
        setErrorMessage("Impossible d'obtenir le lien de vérification. Réessayez.");
        setIsRedirecting(false);
      }
    } catch {
      setErrorMessage("Erreur de connexion. Réessayez.");
      setIsRedirecting(false);
    }
  };

  return (
    <>
      {/* Intercepte le clic et ouvre la modal */}
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowModal(true);
        }}
        style={{ cursor: "pointer" }}
      >
        {children}
      </div>

      {/* Modal de vérification */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-center relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
                {isPending ? (
                  <AlertTriangle className="w-8 h-8 text-amber-300" />
                ) : (
                  <Shield className="w-8 h-8 text-white" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white">
                {isPending
                  ? "Vérification en cours"
                  : "Vérification d'identité requise"}
              </h2>
              <p className="text-white/70 text-sm mt-1">
                {isPending
                  ? "Votre dossier est en cours de validation"
                  : "Rapide, sécurisé et obligatoire"}
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <p className="text-gray-600 text-sm leading-relaxed">
                {isPending
                  ? `Votre vérification d'identité est en cours de traitement par Stripe. Vous pourrez ${action} une fois validée.`
                  : `Pour ${action}, nous devons vérifier votre identité. C'est une mesure de sécurité obligatoire qui protège tous les membres.`}
              </p>

              {/* Avantages */}
              {!isPending && (
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 space-y-3">
                  {[
                    { emoji: "🔒", text: "Sécurisation de vos transactions" },
                    { emoji: "🏦", text: "Retraits vers votre compte bancaire" },
                    { emoji: "✅", text: "Confiance entre membres" },
                    { emoji: "⏱️", text: "Prend moins de 2 minutes" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-lg">{item.emoji}</span>
                      <span className="text-sm text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents nécessaires */}
              {!isPending && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    <strong>Préparez</strong> une pièce d&apos;identité (CNI, passeport ou permis de conduire) et un IBAN pour le virement.
                  </p>
                </div>
              )}

              {/* Error */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">{errorMessage}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2.5">
                <button
                  onClick={startVerification}
                  disabled={isRedirecting || isProcessing}
                  className="w-full py-3.5 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRedirecting || isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {hasAccount ? "Redirection..." : "Création du compte..."}
                    </>
                  ) : isPending ? (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Compléter ma vérification
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Vérifier mon identité
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 rounded-xl font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Plus tard
                </button>
              </div>

              {/* Footer sécurité */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-gray-400">
                  Propulsé par Stripe · Données chiffrées et sécurisées
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
