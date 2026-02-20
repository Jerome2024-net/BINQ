"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useFinance } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import DepositWithdrawModal from "@/components/DepositWithdrawModal";
import { PortefeuilleSkeleton } from "@/components/Skeleton";
import { formatMontant, formatDate } from "@/lib/data";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  ArrowRight,
  CircleDollarSign,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3,
  RefreshCw,
  PiggyBank,
  Sparkles,
  Info,
} from "lucide-react";

export default function PortefeuillePage() {
  const { user } = useAuth();
  const {
    wallet,
    getOrCreateWallet,
    retirer,
    getTransactions,
    getFinancialSummary,
    isLoading: financeLoading,
  } = useFinance();
  const { showToast } = useToast();

  const [showSolde, setShowSolde] = useState(true);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositModalMode, setDepositModalMode] = useState<"depot" | "retrait">("depot");

  useEffect(() => {
    if (user) getOrCreateWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const summary = getFinancialSummary();
  const recentTx = getTransactions({ limit: 8 });
  const soldeWallet = wallet?.solde ?? 0;

  if (financeLoading) {
    return <PortefeuilleSkeleton />;
  }

  const handleDeposit = () => {
    setDepositModalMode("depot");
    setDepositModalOpen(true);
  };

  const handleWithdraw = () => {
    setDepositModalMode("retrait");
    setDepositModalOpen(true);
  };

  const handleRetrait = async (montant: number, methode: string): Promise<{ success: boolean; error?: string }> => {
    const result = await retirer(montant, methode);
    if (result.success) {
      showToast("success", "Retrait effectué", `${montant.toFixed(2)} € retirés avec succès`);
    } else {
      showToast("error", "Erreur retrait", result.error || "Erreur inconnue");
    }
    setDepositModalOpen(false);
    return result;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "depot":
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case "retrait":
        return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
      default:
        return <CircleDollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      depot: "Dépôt",
      retrait: "Retrait",
      remboursement: "Remboursement",
      transfert_entrant: "Transfert reçu",
      transfert_sortant: "Transfert envoyé",
    };
    return labels[type] || type;
  };

  const isCredit = (type: string) => ["depot", "remboursement", "transfert_entrant"].includes(type);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          Mon Portefeuille
        </h1>
        <p className="text-gray-500 mt-1">Gérez vos fonds et suivez vos mouvements</p>
      </div>

      {/* Carte Solde Principal */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4 text-green-300" />
              <span className="text-sm font-medium text-green-200">Sécurisé</span>
            </div>
            <button
              onClick={() => setShowSolde(!showSolde)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              {showSolde ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <p className="text-sm text-blue-200 font-medium uppercase tracking-wider mb-2">Solde disponible</p>
          <p className="text-5xl sm:text-6xl font-bold mb-8 tracking-tight">
            {showSolde ? formatMontant(soldeWallet) : "••••••"}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDeposit}
              className="flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <ArrowDownLeft className="w-5 h-5" />
              Déposer
            </button>
            <button
              onClick={handleWithdraw}
              className="flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-white/20 transition-all border border-white/20"
            >
              <ArrowUpRight className="w-5 h-5" />
              Retirer
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Total déposé</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatMontant(summary.totalDepose)}</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Total retiré</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatMontant(summary.totalRetire)}</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Transactions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.nombreTransactions}</p>
        </div>
      </div>

      {/* Grille : Transactions + Sidebar info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dernières transactions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Dernières transactions
              </h2>
              <Link
                href="/transactions"
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 hover:gap-2 transition-all text-sm"
              >
                Tout voir <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {recentTx.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-900 font-semibold mb-1">Aucune transaction</p>
                <p className="text-sm text-gray-400">
                  Effectuez votre premier dépôt pour commencer
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTx.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCredit(tx.type) ? "bg-green-50" : "bg-red-50"
                      }`}
                    >
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-md font-medium ${
                          isCredit(tx.type) ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}>
                          {getTransactionLabel(tx.type)}
                        </span>
                        <span>{formatDate(tx.dateCreation)}</span>
                      </div>
                    </div>
                    <p className={`text-sm font-bold whitespace-nowrap ${isCredit(tx.type) ? "text-green-600" : "text-red-600"}`}>
                      {isCredit(tx.type) ? "+" : "-"}
                      {tx.montant.toLocaleString("fr-FR")} €
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Infos */}
        <div className="space-y-6">
          {/* CTA Épargne */}
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Faites fructifier votre argent</h3>
              <p className="text-indigo-100 text-sm mb-5">
                Transférez vos fonds vers un compte épargne et profitez d&apos;un bonus annuel de 1%.
              </p>
              <Link
                href="/dashboard/epargne"
                className="inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Voir mes épargnes
              </Link>
            </div>
          </div>

          {/* Tarification */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600" />
              Tarification
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-2xl border border-green-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Dépôt portefeuille</p>
                  <p className="text-xs text-gray-500">Via carte ou virement</p>
                </div>
                <span className="text-sm font-bold text-green-600">Gratuit</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-2xl border border-green-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Retrait</p>
                  <p className="text-xs text-gray-500">Vers compte bancaire</p>
                </div>
                <span className="text-sm font-bold text-green-600">Gratuit</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Dépôt épargne</p>
                  <p className="text-xs text-gray-500">Frais de gestion</p>
                </div>
                <span className="text-sm font-bold text-amber-600">2%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Bonus épargne programmée</p>
                  <p className="text-xs text-gray-500">Intérêts annuels</p>
                </div>
                <span className="text-sm font-bold text-indigo-600">+1%/an</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dépôt / Retrait */}
      <DepositWithdrawModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        mode={depositModalMode}
        onRetrait={handleRetrait}
        soldeActuel={soldeWallet}
        devise="EUR"
      />
    </div>
  );
}
