"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useFinance } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import DepositWithdrawModal from "@/components/DepositWithdrawModal";
import SubscriptionModal from "@/components/SubscriptionModal";
import StripeConnectCard from "@/components/StripeConnectCard";
import { PortefeuilleSkeleton } from "@/components/Skeleton";
import { formatMontant, formatDate } from "@/lib/data";
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  ArrowRight,
  CircleDollarSign,
  Receipt,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Percent,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Crown,
  CalendarCheck,
  Sparkles,
  CreditCard,
  Settings,
} from "lucide-react";

export default function PortefeuillePage() {
  const { user } = useAuth();
  const {
    wallet,
    getOrCreateWallet,
    retirer,
    getTransactions,
    getFinancialSummary,
    getFraisConfig,
    abonnement,
    souscrireAbonnement,
    isAbonnementActif,
    isEssaiGratuit,
    getJoursRestantsAbonnement,
    rafraichirAbonnement,
  } = useFinance();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showSolde, setShowSolde] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"depot" | "retrait">("depot");
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  // Gérer le retour de Stripe Checkout
  useEffect(() => {
    const subscriptionStatus = searchParams.get("subscription");
    if (subscriptionStatus === "success") {
      showToast("success", "Paiement réussi ! 🎉", "Votre abonnement organisateur est maintenant actif");
      // Rafraîchir l'abonnement depuis Supabase (le webhook l'a activé)
      const timer = setTimeout(() => {
        rafraichirAbonnement();
      }, 2000);
      // Nettoyer l'URL
      router.replace("/portefeuille");
      return () => clearTimeout(timer);
    } else if (subscriptionStatus === "cancelled") {
      showToast("info", "Paiement annulé", "Vous pouvez réessayer à tout moment");
      router.replace("/portefeuille");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // S'assurer que le wallet existe
  useEffect(() => {
    if (user) {
      const init = async () => {
        try {
          await getOrCreateWallet();
        } catch {
          // ignore
        }
      };
      init();
    }
  }, [user, getOrCreateWallet]);

  const summary = getFinancialSummary();
  const recentTx = getTransactions({ limit: 8 });
  const frais = getFraisConfig();
  const solde = wallet?.solde || 0;
  const { isLoading: financeLoading } = useFinance();

  if (financeLoading) {
    return <PortefeuilleSkeleton />;
  }

  const handleDeposit = () => {
    setModalMode("depot");
    setModalOpen(true);
  };

  const handleWithdraw = () => {
    setModalMode("retrait");
    setModalOpen(true);
  };

  const handleRetrait = async (montant: number, methode: string) => {
    const result = await retirer(montant, methode);
    if (result.success) {
      showToast("success", "Retrait effectué !", `${montant.toLocaleString("fr-FR")} € retirés de votre portefeuille`);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const handleSouscrire = () => {
    setSubscriptionModalOpen(true);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "depot":
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case "retrait":
        return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
      case "cotisation":
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case "reception_pot":
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case "commission":
        return <Percent className="w-4 h-4 text-amber-600" />;
      case "abonnement":
        return <Crown className="w-4 h-4 text-purple-600" />;
      case "penalite":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <CircleDollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      depot: "Dépôt",
      retrait: "Retrait",
      cotisation: "Cotisation",
      reception_pot: "Réception pot",
      commission: "Commission",
      abonnement: "Abonnement",
      penalite: "Pénalité",
      remboursement: "Remboursement",
      transfert_entrant: "Transfert reçu",
      transfert_sortant: "Transfert envoyé",
    };
    return labels[type] || type;
  };

  const isCredit = (type: string) => ["depot", "reception_pot", "remboursement", "transfert_entrant"].includes(type);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary-600" />
            Mon Portefeuille
          </h1>
          <p className="text-gray-500 mt-1">Gérez vos fonds et suivez vos transactions</p>
        </div>
      </div>

      {/* Carte Solde Principal */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-300" />
              <span className="text-sm font-medium text-green-200">Portefeuille sécurisé</span>
            </div>
            <button
              onClick={() => setShowSolde(!showSolde)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {showSolde ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <p className="text-sm text-green-200 mb-1">Solde disponible</p>
          <p className="text-4xl sm:text-5xl font-bold mb-2">
            {showSolde ? `${solde.toLocaleString("fr-FR")}` : "••••••"}{" "}
            <span className="text-xl font-normal text-green-200">€</span>
          </p>

          {wallet?.soldeBloquer ? (
            <p className="text-sm text-yellow-200 flex items-center gap-1 mb-6">
              <Clock className="w-4 h-4" />
              {wallet.soldeBloquer.toLocaleString("fr-FR")} € en cours de traitement
            </p>
          ) : (
            <div className="mb-6"></div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDeposit}
              className="flex items-center justify-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-colors"
            >
              <ArrowDownToLine className="w-5 h-5" />
              Déposer
            </button>
            <button
              onClick={handleWithdraw}
              className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 px-6 py-3 rounded-xl font-semibold transition-colors border border-white/20"
            >
              <ArrowUpFromLine className="w-5 h-5" />
              Retirer
            </button>
          </div>
        </div>
      </div>

      {/* Carte Abonnement Organisateur */}
      <div className={`rounded-2xl border-2 p-5 ${isAbonnementActif() ? (isEssaiGratuit() ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50' : 'border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50') : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isAbonnementActif() ? (isEssaiGratuit() ? 'bg-emerald-100' : 'bg-purple-100') : 'bg-amber-100'}`}>
              <Crown className={`w-7 h-7 ${isAbonnementActif() ? (isEssaiGratuit() ? 'text-emerald-600' : 'text-purple-600') : 'text-amber-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Abonnement Organisateur
                {isAbonnementActif() && isEssaiGratuit() && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Essai gratuit</span>
                )}
                {isAbonnementActif() && !isEssaiGratuit() && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Actif</span>
                )}
              </h3>
              {isAbonnementActif() ? (
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <CalendarCheck className="w-4 h-4 text-purple-500" />
                    {getJoursRestantsAbonnement()} jours restants
                  </span>
                  <span>•</span>
                  <span>Expire le {abonnement ? new Date(abonnement.dateExpiration).toLocaleDateString('fr-FR') : ''}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  Essai gratuit 90 jours · Sans engagement
                </p>
              )}
            </div>
          </div>
          <div className="text-center sm:text-right w-full sm:w-auto">
            {!isAbonnementActif() ? (
              <div>
                <p className="text-lg font-bold text-emerald-600">🎁 Essai gratuit 90j</p>
                <p className="text-xs text-gray-500">Puis {formatMontant(frais.abonnementAnnuel)}/an</p>
                <button onClick={handleSouscrire} className="mt-2 flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-sm">
                  <CreditCard className="w-4 h-4" />
                  Commencer l&apos;essai
                </button>
              </div>
            ) : isEssaiGratuit() ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-semibold">Essai actif</span>
                </div>
                <button onClick={handleSouscrire} className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors font-medium">
                  Passer au plan annuel <Settings className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-600">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-semibold">Abonnement valide</span>
                </div>
                <button className="text-xs text-gray-500 hover:text-purple-600 flex items-center gap-1 transition-colors">
                  Gérer l&apos;abonnement <Settings className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
        {!isAbonnementActif() && (
          <div className="mt-4 pt-4 border-t border-amber-200">
            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <span className="flex items-center gap-1.5">✅ Créer des tontines illimitées</span>
              <span className="flex items-center gap-1.5">✅ Gérer les membres</span>
              <span className="flex items-center gap-1.5">✅ Démarrer et suivre les tours</span>
              <span className="flex items-center gap-1.5">✅ Tableau de bord organisateur</span>
            </div>
          </div>
        )}
      </div>

      {/* Compte de paiement */}
      <StripeConnectCard />

      {/* Stats financières */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card !p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium">Total déposé</p>
          <p className="text-lg font-bold text-gray-900">{formatMontant(summary.totalDepose)}</p>
        </div>

        <div className="card !p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium">Total retiré</p>
          <p className="text-lg font-bold text-gray-900">{formatMontant(summary.totalRetire)}</p>
        </div>

        <div className="card !p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium">Cotisations payées</p>
          <p className="text-lg font-bold text-gray-900">{formatMontant(summary.totalCotisationsPaye)}</p>
        </div>

        <div className="card !p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium">Pots reçus</p>
          <p className="text-lg font-bold text-gray-900">{formatMontant(summary.totalPotsRecus)}</p>
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dernières transactions */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary-600" />
                Dernières transactions
              </h2>
              <Link
                href="/transactions"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
              >
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {recentTx.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Aucune transaction pour le moment</p>
                <p className="text-sm text-gray-400 mt-1">
                  Effectuez votre premier dépôt pour commencer
                </p>
                <button onClick={handleDeposit} className="btn-primary mt-4">
                  Déposer des fonds
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTx.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCredit(tx.type) ? "bg-green-100" : "bg-red-50"
                      }`}
                    >
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          isCredit(tx.type) ? "bg-green-100 text-green-700" : "bg-red-50 text-red-700"
                        }`}>
                          {getTransactionLabel(tx.type)}
                        </span>
                        <span>{formatDate(tx.dateCreation)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isCredit(tx.type) ? "text-green-600" : "text-red-600"}`}>
                        {isCredit(tx.type) ? "+" : "-"}
                        {tx.montant.toLocaleString("fr-FR")} €
                      </p>
                      <p className="text-xs text-gray-400">{tx.reference}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Modèle tarifaire */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary-600" />
              Modèle tarifaire
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Abonnement organisateur</p>
                  <p className="text-xs text-gray-500">Annuel — pour créer des tontines</p>
                </div>
                <span className="text-sm font-bold text-purple-600">{formatMontant(frais.abonnementAnnuel)}/an</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">Frais participant</p>
                  <p className="text-xs text-gray-500">Sur chaque cotisation</p>
                </div>
                <span className="text-sm font-bold text-primary-600">{frais.fraisParticipant}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">Pénalité retard</p>
                  <p className="text-xs text-gray-500">Après {frais.joursGracePenalite} jours de grâce</p>
                </div>
                <span className="text-sm font-bold text-amber-600">
                  {frais.penaliteRetardType === "fixe"
                    ? formatMontant(frais.penaliteRetard)
                    : `${frais.penaliteRetard}%`}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Dépôt & Retrait</p>
                  <p className="text-xs text-gray-500">Entièrement gratuit</p>
                </div>
                <span className="text-sm font-bold text-green-600">GRATUIT</span>
              </div>
            </div>
          </div>

          {/* Résumé */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Récapitulatif</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Frais participant (1%)</span>
                <span className="font-medium text-amber-600">
                  {formatMontant(summary.totalFraisParticipant)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Abonnements payés</span>
                <span className="font-medium text-purple-600">
                  {formatMontant(summary.totalAbonnements)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pénalités payées</span>
                <span className="font-medium text-red-600">
                  {formatMontant(summary.totalPenalites)}
                </span>
              </div>
              <hr />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Nb. transactions</span>
                <span className="font-bold text-gray-900">{summary.nombreTransactions}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dépôt/Retrait */}
      <DepositWithdrawModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        onRetrait={handleRetrait}
        soldeActuel={solde}
        devise="EUR"
      />

      {/* Modal Abonnement in-app */}
      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
      />
    </div>
  );
}
