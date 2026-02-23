"use client";

import { useState, useEffect, useCallback } from "react";
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
  Send,
  LinkIcon,
  Search,
  X,
  Loader2,
  CheckCircle2,
  User,
  Copy,
  Share2,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface SearchUser {
  id: string;
  prenom: string;
  nom: string;
  avatar_url: string | null;
  email_masked: string | null;
}

interface PaymentLink {
  id: string;
  code: string;
  montant: number | null;
  description: string | null;
  statut: string;
  created_at: string;
}

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

  // ── Send Money ──
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendStep, setSendStep] = useState<"search" | "amount" | "confirm" | "success">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [sendAmount, setSendAmount] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendRef, setSendRef] = useState("");

  // ── Payment Links ──
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkAmount, setLinkAmount] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkCreating, setLinkCreating] = useState(false);
  const [myLinks, setMyLinks] = useState<PaymentLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [createdLinkCode, setCreatedLinkCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) getOrCreateWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const summary = getFinancialSummary();
  const recentTx = getTransactions({ limit: 8 });
  const soldeWallet = wallet?.solde ?? 0;

  // ── Search Users ──
  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch { setSearchResults([]); } finally { setSearchLoading(false); }
  }, []);

  // ── Payment Links fetch ──
  const fetchMyLinks = useCallback(async () => {
    setLinksLoading(true);
    try {
      const res = await fetch("/api/payment-links");
      const data = await res.json();
      setMyLinks(data.links || []);
    } catch { /* ignore */ } finally { setLinksLoading(false); }
  }, []);

  useEffect(() => {
    if (user) fetchMyLinks();
  }, [user, fetchMyLinks]);

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

  // ── Send Money ──
  const openSendModal = () => {
    setSendModalOpen(true);
    setSendStep("search");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setSendAmount("");
    setSendMessage("");
    setSendRef("");
  };

  const handleSelectUser = (u: SearchUser) => {
    setSelectedUser(u);
    setSendStep("amount");
  };

  const handleSendConfirm = async () => {
    if (!selectedUser) return;
    const montant = parseFloat(sendAmount);
    if (!montant || montant <= 0) {
      showToast("error", "Erreur", "Montant invalide");
      return;
    }
    if (montant > soldeWallet) {
      showToast("error", "Erreur", "Solde insuffisant");
      return;
    }
    setSendLoading(true);
    try {
      const res = await fetch("/api/transferts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinataire_id: selectedUser.id,
          montant,
          message: sendMessage || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Transfert échoué");
        return;
      }
      setSendRef(data.transfert.reference);
      setSendStep("success");
      showToast("success", "Envoyé !", `${montant.toFixed(2)} € envoyés à ${selectedUser.prenom}`);
      // Refresh wallet
      getOrCreateWallet();
    } catch {
      showToast("error", "Erreur", "Erreur lors du transfert");
    } finally { setSendLoading(false); }
  };

  // ── Payment Links ──
  const handleCreateLinkWithCode = async () => {
    setLinkCreating(true);
    try {
      const montant = linkAmount ? parseFloat(linkAmount) : null;
      const res = await fetch("/api/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant,
          description: linkDescription || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Erreur création lien");
        return;
      }
      setCreatedLinkCode(data.link.code);
      fetchMyLinks();
    } catch {
      showToast("error", "Erreur", "Erreur création lien");
    } finally { setLinkCreating(false); }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const res = await fetch(`/api/payment-links?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Supprimé", "Lien annulé");
        fetchMyLinks();
      }
    } catch { /* ignore */ }
  };

  const copyLinkUrl = (code: string) => {
    const url = `${window.location.origin}/pay/${code}`;
    navigator.clipboard.writeText(url);
    showToast("success", "Copié", "Lien copié dans le presse-papier");
  };

  const shareLink = async (code: string, description: string | null) => {
    const url = `${window.location.origin}/pay/${code}`;
    const text = description ? `${description} — Payer via Binq` : "Payer via Binq";
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: "Binq Pay", text, url }); } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      showToast("success", "Copié", "Lien copié !");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          Mon Portefeuille
        </h1>
        <p className="text-gray-500 mt-1">Gérez vos fonds et suivez vos mouvements</p>
      </div>

      {/* Carte Solde Principal */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-200">
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
          <p className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 sm:mb-8 tracking-tight">
            {showSolde ? formatMontant(soldeWallet) : "••••••"}
          </p>

          {/* Actions principales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={handleDeposit}
              className="flex flex-col items-center gap-2 bg-white text-blue-700 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <ArrowDownLeft className="w-6 h-6" />
              <span className="text-xs sm:text-sm">Déposer</span>
            </button>
            <button
              onClick={handleWithdraw}
              className="flex flex-col items-center gap-2 bg-white/10 text-white py-4 rounded-2xl font-bold hover:bg-white/20 transition-all border border-white/20"
            >
              <ArrowUpRight className="w-6 h-6" />
              <span className="text-xs sm:text-sm">Retirer</span>
            </button>
            <button
              onClick={openSendModal}
              className="flex flex-col items-center gap-2 bg-purple-500/90 text-white py-4 rounded-2xl font-bold hover:bg-purple-500 transition-all border border-purple-400/30"
            >
              <Send className="w-6 h-6" />
              <span className="text-xs sm:text-sm">Envoyer</span>
            </button>
            <button
              onClick={() => setLinkModalOpen(true)}
              className="flex flex-col items-center gap-2 bg-emerald-500/90 text-white py-4 rounded-2xl font-bold hover:bg-emerald-500 transition-all border border-emerald-400/30"
            >
              <ArrowDownLeft className="w-6 h-6" />
              <span className="text-xs sm:text-sm">Recevoir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Dernières transactions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
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
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Faites fructifier votre argent</h3>
              <p className="text-indigo-100 text-sm mb-5">
                Transférez vos fonds vers un compte épargne et faites fructifier votre argent en toute sécurité.
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

            </div>
          </div>
        </div>
      </div>

      {/* Demandes de paiement */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-emerald-600" />
            Demandes de paiement
          </h2>
          <button
            onClick={() => setLinkModalOpen(true)}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            + Nouvelle demande
          </button>
        </div>

        {linksLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : myLinks.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowDownLeft className="w-8 h-8 text-emerald-300" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">Aucune demande de paiement</p>
            <p className="text-sm text-gray-400">Demandez de l&apos;argent via un lien partageable</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myLinks.slice(0, 5).map((pl) => (
              <div key={pl.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  pl.statut === "actif" ? "bg-indigo-50" : pl.statut === "paye" ? "bg-green-50" : "bg-gray-50"
                }`}>
                  <LinkIcon className={`w-5 h-5 ${
                    pl.statut === "actif" ? "text-indigo-600" : pl.statut === "paye" ? "text-green-600" : "text-gray-400"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {pl.description || "Lien de paiement"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-md font-medium ${
                      pl.statut === "actif" ? "bg-indigo-50 text-indigo-700" : pl.statut === "paye" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {pl.statut === "actif" ? "Actif" : pl.statut === "paye" ? "Payé" : "Annulé"}
                    </span>
                    <span>{formatDate(pl.created_at)}</span>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-900 whitespace-nowrap mr-2">
                  {pl.montant ? `${pl.montant.toLocaleString("fr-FR")} €` : "Libre"}
                </p>
                {pl.statut === "actif" && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => copyLinkUrl(pl.code)} className="p-2 rounded-lg hover:bg-gray-100 transition" title="Copier">
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => shareLink(pl.code, pl.description)} className="p-2 rounded-lg hover:bg-gray-100 transition" title="Partager">
                      <Share2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => handleDeleteLink(pl.id)} className="p-2 rounded-lg hover:bg-red-50 transition" title="Annuler">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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

      {/* ── Modal Envoyer de l'argent ── */}
      {sendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {sendStep === "search" && "Envoyer de l'argent"}
                {sendStep === "amount" && "Montant"}
                {sendStep === "confirm" && "Confirmer"}
                {sendStep === "success" && "Envoyé !"}
              </h3>
              <button onClick={() => setSendModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5">
              {/* Step 1: Search */}
              {sendStep === "search" && (
                <div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, email..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                      autoFocus
                    />
                  </div>

                  {searchLoading && (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    </div>
                  )}

                  {!searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
                    <div className="text-center py-6">
                      <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Aucun utilisateur trouvé</p>
                    </div>
                  )}

                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-left"
                      >
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-indigo-600">
                              {(u.prenom?.[0] || "?")}{(u.nom?.[0] || "")}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{u.prenom} {u.nom}</p>
                          {u.email_masked && <p className="text-xs text-gray-400">{u.email_masked}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Amount */}
              {sendStep === "amount" && selectedUser && (
                <div>
                  <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-indigo-600">
                          {(selectedUser.prenom?.[0] || "?")}{(selectedUser.nom?.[0] || "")}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedUser.prenom} {selectedUser.nom}</p>
                      <p className="text-xs text-gray-400">Destinataire</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Montant (€)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-2xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                    />
                    <p className="text-xs text-gray-400 mt-1 text-center">Solde : {formatMontant(soldeWallet)}</p>
                  </div>

                  <div className="mb-5">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Message (optionnel)</label>
                    <input
                      type="text"
                      value={sendMessage}
                      onChange={(e) => setSendMessage(e.target.value)}
                      placeholder="Ex: Remboursement dîner"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                      maxLength={100}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSendStep("search")}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                    >
                      Retour
                    </button>
                    <button
                      onClick={() => setSendStep("confirm")}
                      disabled={!sendAmount || parseFloat(sendAmount) <= 0}
                      className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {sendStep === "confirm" && selectedUser && (
                <div>
                  <div className="bg-gray-50 rounded-2xl p-5 mb-5 text-center">
                    <p className="text-sm text-gray-500 mb-1">Vous envoyez</p>
                    <p className="text-3xl font-black text-gray-900">{parseFloat(sendAmount).toFixed(2)} €</p>
                    <p className="text-sm text-gray-500 mt-2">
                      à <span className="font-semibold text-gray-900">{selectedUser.prenom} {selectedUser.nom}</span>
                    </p>
                    {sendMessage && (
                      <p className="text-xs text-gray-400 mt-2 italic">&ldquo;{sendMessage}&rdquo;</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSendStep("amount")}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleSendConfirm}
                      disabled={sendLoading}
                      className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sendLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                      {sendLoading ? "Envoi..." : "Confirmer"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Success */}
              {sendStep === "success" && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Transfert effectué !</h3>
                  <p className="text-sm text-gray-500 mb-1">
                    {parseFloat(sendAmount).toFixed(2)} € envoyés à {selectedUser?.prenom} {selectedUser?.nom}
                  </p>
                  <p className="text-xs text-gray-400 mb-5">Réf: {sendRef}</p>
                  <button
                    onClick={() => setSendModalOpen(false)}
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Recevoir de l'argent (Request Money) ── */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                Recevoir de l&apos;argent
              </h3>
              <button onClick={() => { setLinkModalOpen(false); setCreatedLinkCode(null); }} className="p-2 rounded-xl hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5">
              {!createdLinkCode ? (
                <>
                  <p className="text-sm text-gray-500 mb-5">Créez un lien de paiement et partagez-le. Le destinataire paiera depuis son portefeuille Binq.</p>

                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Combien demandez-vous ? <span className="text-gray-400 font-normal">— vide = montant libre</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={linkAmount}
                      onChange={(e) => setLinkAmount(e.target.value)}
                      placeholder="Ex: 25.00"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-2xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                    />
                  </div>

                  <div className="mb-5">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Motif (optionnel)</label>
                    <input
                      type="text"
                      value={linkDescription}
                      onChange={(e) => setLinkDescription(e.target.value)}
                      placeholder="Ex: Part du resto, loyer, cadeau..."
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                      maxLength={120}
                    />
                  </div>

                  <button
                    onClick={handleCreateLinkWithCode}
                    disabled={linkCreating}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {linkCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rotate-180" />}
                    {linkCreating ? "Création..." : "Générer le lien"}
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">Lien prêt !</h4>
                  <p className="text-sm text-gray-500 mb-4">Partagez ce lien pour recevoir votre paiement</p>

                  <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${createdLinkCode}`}
                      className="flex-1 bg-transparent text-sm text-gray-700 outline-none font-mono truncate"
                    />
                    <button
                      onClick={() => copyLinkUrl(createdLinkCode)}
                      className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <button
                      onClick={() => { const url = `${window.location.origin}/pay/${createdLinkCode}`; window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank'); }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition"
                    >
                      <span className="text-lg">💬</span>
                      <span className="text-xs font-medium text-gray-700">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => { const url = `${window.location.origin}/pay/${createdLinkCode}`; window.open(`sms:?body=${encodeURIComponent(url)}`, '_blank'); }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition"
                    >
                      <span className="text-lg">📱</span>
                      <span className="text-xs font-medium text-gray-700">SMS</span>
                    </button>
                    <button
                      onClick={() => shareLink(createdLinkCode, linkDescription || null)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition"
                    >
                      <Share2 className="w-5 h-5 text-indigo-600" />
                      <span className="text-xs font-medium text-gray-700">Partager</span>
                    </button>
                  </div>

                  <button
                    onClick={() => { setLinkModalOpen(false); setCreatedLinkCode(null); setLinkAmount(''); setLinkDescription(''); }}
                    className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
