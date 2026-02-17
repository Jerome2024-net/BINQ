"use client";

import { useState } from "react";
import {
  X,
  Crown,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Lock,
  Sparkles,
  Users,
  BarChart3,
  Headphones,
  CreditCard,
  AlertTriangle,
  Wallet,
  Gift,
  Clock,
} from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";
import { useToast } from "@/contexts/ToastContext";
import { formatMontant } from "@/lib/data";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const avantages = [
  { icon: Sparkles, label: "Tontines illimitées", desc: "Créez autant de tontines que vous voulez" },
  { icon: Users, label: "Gestion des membres", desc: "Invitez et gérez vos participants" },
  { icon: BarChart3, label: "Tableau de bord", desc: "Suivi complet de vos tontines" },
  { icon: Headphones, label: "Support prioritaire", desc: "Assistance dédiée 7j/7" },
];

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { activerEssaiGratuit, souscrireAbonnement, souscrireAbonnementStripe, getFraisConfig, wallet, abonnement, isEssaiGratuit } = useFinance();
  const { showToast } = useToast();
  const [step, setStep] = useState<"info" | "confirm" | "processing" | "done" | "error">("info");
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState<"essai" | "payant" | "stripe">("essai");

  if (!isOpen) return null;

  const frais = getFraisConfig();
  const solde = wallet?.solde || 0;
  const prixAbonnement = frais.abonnementAnnuel;
  const soldeSuffisant = solde >= prixAbonnement;
  const dejaEuEssai = abonnement?.plan === "essai_gratuit";
  const enEssai = isEssaiGratuit();

  const handleActiverEssai = async () => {
    setMode("essai");
    setStep("processing");

    const result = await activerEssaiGratuit();
    if (result.success) {
      showToast("success", "Essai gratuit activé ! 🎉", "90 jours pour tester toutes les fonctionnalités");
      setStep("done");
      setTimeout(() => {
        reset();
        onClose();
      }, 2500);
    } else {
      setErrorMsg(result.error || "Erreur lors de l'activation");
      setStep("error");
    }
  };

  const handleSouscrire = () => {
    setMode("payant");
    if (!soldeSuffisant) {
      setErrorMsg(`Solde insuffisant. Vous avez ${formatMontant(solde)} mais l'abonnement coûte ${formatMontant(prixAbonnement)}. Déposez des fonds d'abord.`);
      setStep("error");
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setStep("processing");

    const result = await souscrireAbonnement();
    if (result.success) {
      showToast("success", "Abonnement activé ! 🎉", "Vous pouvez créer et gérer des tontines pendant 1 an");
      setStep("done");
      setTimeout(() => {
        reset();
        onClose();
      }, 2500);
    } else {
      setErrorMsg(result.error || "Erreur lors de la souscription");
      setStep("error");
    }
  };

  const handlePayerParCarte = async () => {
    setMode("stripe");
    setStep("processing");

    const result = await souscrireAbonnementStripe();
    if (result.success && result.url) {
      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } else {
      setErrorMsg(result.error || "Erreur lors de la redirection vers Stripe");
      setStep("error");
    }
  };

  const reset = () => {
    setStep("info");
    setErrorMsg("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Abonnement Organisateur</h2>
            <p className="text-xs text-gray-500">Débloquez toutes les fonctionnalités</p>
          </div>
          <button onClick={handleClose} className="ml-auto p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {step === "done" ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                {mode === "essai" ? <Gift className="w-10 h-10 text-purple-600" /> : <Crown className="w-10 h-10 text-purple-600" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {mode === "essai" ? "Essai gratuit activé ! 🎉" : "Abonnement activé ! 🎉"}
              </h3>
              <p className="text-gray-500">
                Vous pouvez maintenant créer et gérer vos propres tontines
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-purple-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>{mode === "essai" ? "Valide pendant 90 jours" : "Valide pour 1 an"}</span>
              </div>
            </div>
          ) : step === "error" ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Erreur</h3>
              <p className="text-red-500 text-sm mb-4">{errorMsg}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setStep("info")} className="btn-secondary px-6">
                  Retour
                </button>
              </div>
            </div>
          ) : step === "processing" ? (
            <div className="text-center py-12">
              <div className="relative mx-auto w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
                <div className="absolute inset-3 rounded-full bg-purple-50 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-gray-900 font-semibold text-lg">Activation en cours...</p>
              <p className="text-sm text-gray-500 mt-2">
                {mode === "essai" ? "Activation de votre essai gratuit" : mode === "stripe" ? "Redirection vers Stripe..." : "Configuration de votre abonnement organisateur"}
              </p>
              <div className="mt-4 flex items-center justify-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 rounded-full bg-purple-300 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          ) : step === "confirm" ? (
            <div className="space-y-5">
              {/* Récapitulatif */}
              <div className="bg-purple-50 rounded-xl p-4 space-y-3 border border-purple-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Abonnement</span>
                  <span className="font-semibold text-gray-900">Organisateur annuel</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Durée</span>
                  <span className="font-semibold text-gray-900">1 an</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Votre solde</span>
                  <span className="font-semibold text-gray-900">{formatMontant(solde)}</span>
                </div>
                <hr className="border-purple-200" />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Montant à débiter</span>
                  <span className="text-2xl font-bold text-purple-600">{formatMontant(prixAbonnement)}</span>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 flex items-start gap-2">
                <Wallet className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  Le montant sera prélevé directement de votre portefeuille.
                  Solde après : <strong>{formatMontant(solde - prixAbonnement)}</strong>
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("info")} className="btn-secondary flex-1">
                  Retour
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Confirmer le paiement
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Essai gratuit — CTA principal si pas encore utilisé */}
              {!dejaEuEssai && !enEssai && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-5 text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                    <Gift className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Essai gratuit 90 jours</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Testez toutes les fonctionnalités organisateur sans engagement ni carte bancaire
                    </p>
                  </div>
                  <button
                    onClick={handleActiverEssai}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-lg"
                  >
                    <Gift className="w-5 h-5" />
                    Commencer l&apos;essai gratuit
                  </button>
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    Aucun paiement requis · Se termine automatiquement
                  </p>
                </div>
              )}

              {/* Séparateur si essai dispo */}
              {!dejaEuEssai && !enEssai && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="text-xs text-gray-400 font-medium">OU</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
              )}

              {/* Plan annuel payant */}
              <div className={`${dejaEuEssai || enEssai ? '' : 'opacity-80'}`}>
                <div className="text-center mb-4">
                  <div className="inline-flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">{prixAbonnement.toLocaleString("fr-FR")}</span>
                    <span className="text-lg text-gray-500 font-normal">€/an</span>
                  </div>
                  {enEssai && (
                    <p className="text-sm text-purple-600 mt-1 font-medium">
                      Passez au plan annuel pour continuer après votre essai
                    </p>
                  )}
                </div>

                {/* Avantages */}
                <div className="space-y-3">
                  {avantages.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <a.icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{a.label}</p>
                        <p className="text-xs text-gray-500">{a.desc}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto flex-shrink-0" />
                    </div>
                  ))}
                </div>

                {/* Solde info pour plan payant */}
                {(dejaEuEssai || enEssai) && (
                  <div className={`rounded-xl p-3 text-sm flex items-center gap-2 mt-4 ${soldeSuffisant ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    <Wallet className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Solde actuel : <strong>{formatMontant(solde)}</strong>
                      {!soldeSuffisant && " — Solde insuffisant pour payer via portefeuille"}
                    </span>
                  </div>
                )}

                {/* Boutons de paiement */}
                <div className="space-y-3 mt-4">
                  {/* Payer par carte Stripe — option principale */}
                  <button
                    onClick={handlePayerParCarte}
                    className={`w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors ${dejaEuEssai || enEssai ? 'text-lg' : 'text-base'}`}
                  >
                    <CreditCard className="w-5 h-5" />
                    Payer par carte bancaire
                  </button>

                  {/* Séparateur */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="text-xs text-gray-400 font-medium">OU</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>

                  {/* Payer depuis le portefeuille */}
                  <button
                    onClick={handleSouscrire}
                    disabled={!soldeSuffisant}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors border-2 ${
                      soldeSuffisant
                        ? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Wallet className="w-5 h-5" />
                    {soldeSuffisant
                      ? `Payer avec mon portefeuille (${formatMontant(solde)})`
                      : `Solde insuffisant (${formatMontant(solde)})`
                    }
                  </button>
                </div>
              </div>

              {/* Sécurité */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Paiement sécurisé · Annulable à tout moment</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
