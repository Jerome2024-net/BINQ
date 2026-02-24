"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePayment } from "@/contexts/PaymentContext";
import {
  ShieldCheck,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Banknote,
  CreditCard,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

export default function StripeConnectCard() {
  const { user } = useAuth();
  const {
    createConnectAccount,
    getOnboardingLink,
    refreshAccountStatus,
    connectAccount,
    isProcessing,
    isConfigured,
  } = usePayment();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Rafraîchir le statut au chargement
  useEffect(() => {
    if (user?.stripeAccountId) {
      refreshAccountStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.stripeAccountId]);

  const handleCreateAccount = async () => {
    const result = await createConnectAccount();
    if (result) {
      // Automatiquement ouvrir l'onboarding
      const url = await getOnboardingLink();
      if (url) {
        window.open(url, "_blank");
      }
    }
  };

  const handleOnboarding = async () => {
    const url = await getOnboardingLink();
    if (url) {
      window.open(url, "_blank");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAccountStatus();
    setIsRefreshing(false);
  };

  if (!isConfigured) return null;

  const hasAccount = !!user?.stripeAccountId;
  const isVerified = user?.stripeOnboardingComplete && user?.stripeChargesEnabled;

  return (
    <div className={`rounded-2xl border-2 p-5 ${
      isVerified
        ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
        : hasAccount
        ? "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50"
        : "border-primary-200 bg-gradient-to-r from-primary-50 to-primary-50/50"
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isVerified ? "bg-green-100" : hasAccount ? "bg-amber-100" : "bg-primary-100"
          }`}>
            {isVerified ? (
              <ShieldCheck className="w-7 h-7 text-green-600" />
            ) : hasAccount ? (
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            ) : (
              <CreditCard className="w-7 h-7 text-primary-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Compte de paiement
              {isVerified && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  Actif ✓
                </span>
              )}
              {hasAccount && !isVerified && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                  En attente
                </span>
              )}
            </h3>
            {isVerified ? (
              <p className="text-sm text-gray-600 mt-1">
                Vos paiements sont activés. Vous pouvez recevoir des pots et effectuer des retraits.
              </p>
            ) : hasAccount ? (
              <p className="text-sm text-gray-600 mt-1">
                Complétez la vérification d&apos;identité pour activer les paiements.
              </p>
            ) : (
              <p className="text-sm text-gray-600 mt-1">
                Configurez votre compte pour recevoir les pots de tontine et retirer vers votre banque.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasAccount && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg border border-gray-200 hover:bg-white transition-colors"
              title="Rafraîchir le statut"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}

          {!hasAccount ? (
            <button
              onClick={handleCreateAccount}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors text-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Activer les paiements
            </button>
          ) : !isVerified ? (
            <button
              onClick={handleOnboarding}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-amber-700 transition-colors text-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Finaliser la vérification
            </button>
          ) : null}
        </div>
      </div>

      {/* Détails du compte vérifié */}
      {isVerified && connectAccount && (
        <div className="mt-4 pt-4 border-t border-green-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/70 rounded-xl p-3 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Identité</p>
              <p className="text-sm font-bold text-green-600">Vérifiée</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3 text-center">
              <CreditCard className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Paiements</p>
              <p className="text-sm font-bold text-green-600">Activés</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3 text-center">
              <Banknote className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Solde disponible</p>
              <p className="text-sm font-bold text-gray-900">
                {connectAccount.balance.available.toLocaleString("fr-FR")} €
              </p>
            </div>
            <div className="bg-white/70 rounded-xl p-3 text-center">
              <UserCheck className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">En attente</p>
              <p className="text-sm font-bold text-gray-900">
                {connectAccount.balance.pending.toLocaleString("fr-FR")} €
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Avantages (non vérifié) */}
      {!isVerified && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3 text-green-500" />
              Recevoir les pots de tontine
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3 text-green-500" />
              Retrait SEPA vers votre banque
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3 text-green-500" />
              Vérification d&apos;identité sécurisée
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3 text-green-500" />
              Conforme aux régulations
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
