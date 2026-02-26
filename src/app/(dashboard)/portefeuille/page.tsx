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
  Eye,
  EyeOff,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
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
  Plus,
  Minus,
  Lock,
  Info,
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
  const [sendMode, setSendMode] = useState<"direct" | "link">("direct");
  const [sendStep, setSendStep] = useState<"search" | "amount" | "confirm" | "success">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [sendAmount, setSendAmount] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendRef, setSendRef] = useState("");
  // Send via link
  const [sendLinkStep, setSendLinkStep] = useState<"form" | "success">("form");
  const [sendLinkAmount, setSendLinkAmount] = useState("");
  const [sendLinkDesc, setSendLinkDesc] = useState("");
  const [sendLinkCreating, setSendLinkCreating] = useState(false);
  const [sendLinkCode, setSendLinkCode] = useState<string | null>(null);

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
    setSendMode("direct");
    setSendStep("search");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setSendAmount("");
    setSendMessage("");
    setSendRef("");
    setSendLinkStep("form");
    setSendLinkAmount("");
    setSendLinkDesc("");
    setSendLinkCode(null);
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

  // ── Send via Link ──
  const handleSendViaLink = async () => {
    const montant = parseFloat(sendLinkAmount);
    if (!montant || montant <= 0) {
      showToast("error", "Erreur", "Montant invalide");
      return;
    }
    if (montant > soldeWallet) {
      showToast("error", "Erreur", "Solde insuffisant");
      return;
    }
    setSendLinkCreating(true);
    try {
      const res = await fetch("/api/payment-links/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant,
          description: sendLinkDesc || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Erreur création");
        return;
      }
      setSendLinkCode(data.link.code);
      setSendLinkStep("success");
      getOrCreateWallet();
    } catch {
      showToast("error", "Erreur", "Erreur création du lien");
    } finally { setSendLinkCreating(false); }
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
    <div className="max-w-2xl mx-auto space-y-8 pb-12">

      {/* ── Solde Hero ── */}
      <div className="pt-8 pb-2 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Solde disponible</p>
        <div className="flex items-center justify-center gap-3">
          <p className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight tabular-nums">
            {showSolde ? formatMontant(soldeWallet) : "••••••"}
          </p>
          <button
            onClick={() => setShowSolde(!showSolde)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            {showSolde ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={handleDeposit}
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-semibold">Déposer</span>
        </button>
        <button
          onClick={openSendModal}
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          <Send className="w-5 h-5" />
          <span className="text-xs font-semibold">Envoyer</span>
        </button>
        <button
          onClick={handleWithdraw}
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <Minus className="w-5 h-5" />
          <span className="text-xs font-semibold">Retirer</span>
        </button>
        <button
          onClick={() => setLinkModalOpen(true)}
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <ArrowDownLeft className="w-5 h-5" />
          <span className="text-xs font-semibold">Recevoir</span>
        </button>
      </div>

      {/* ── Résumé financier ── */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Résumé</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-gray-500">Total déposé</span>
            <span className="text-sm font-semibold text-gray-900">{formatMontant(summary.totalDepose)}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-gray-500">Total retiré</span>
            <span className="text-sm font-semibold text-gray-900">{formatMontant(summary.totalRetire)}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-gray-500">Transactions</span>
            <span className="text-sm font-semibold text-gray-900">{summary.nombreTransactions}</span>
          </div>
        </div>
      </div>

      {/* ── Dernières transactions ── */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Transactions récentes</h2>
          <Link
            href="/transactions"
            className="text-xs font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          >
            Tout voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTx.length === 0 ? (
          <div className="text-center py-14 px-5">
            <p className="text-sm font-medium text-gray-900 mb-1">Aucune transaction</p>
            <p className="text-xs text-gray-400">Effectuez votre premier dépôt pour commencer</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCredit(tx.type) ? "bg-green-50" : "bg-gray-100"
                }`}>
                  {isCredit(tx.type)
                    ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                    : <ArrowUpRight className="w-4 h-4 text-gray-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {getTransactionLabel(tx.type)} · {formatDate(tx.dateCreation)}
                  </p>
                </div>
                <p className={`text-sm font-semibold tabular-nums whitespace-nowrap ${isCredit(tx.type) ? "text-green-600" : "text-gray-900"}`}>
                  {isCredit(tx.type) ? "+" : "-"}{tx.montant.toLocaleString("fr-FR")} €
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tarification ── */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Tarification</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Dépôt portefeuille</p>
              <p className="text-xs text-gray-400">Via carte ou virement</p>
            </div>
            <span className="text-sm font-semibold text-green-600">Gratuit</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Retrait</p>
              <p className="text-xs text-gray-400">Vers compte bancaire</p>
            </div>
            <span className="text-sm font-semibold text-green-600">Gratuit</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Dépôt épargne</p>
              <p className="text-xs text-gray-400">Frais de gestion</p>
            </div>
            <span className="text-sm font-semibold text-gray-900">2 %</span>
          </div>
        </div>
      </div>

      {/* ── Liens de paiement ── */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Liens de paiement</h2>
          <button
            onClick={() => setLinkModalOpen(true)}
            className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            + Nouveau
          </button>
        </div>

        {linksLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        ) : myLinks.length === 0 ? (
          <div className="text-center py-14 px-5">
            <p className="text-sm font-medium text-gray-900 mb-1">Aucun lien de paiement</p>
            <p className="text-xs text-gray-400">Demandez de l&apos;argent via un lien partageable</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {myLinks.slice(0, 5).map((pl) => (
              <div key={pl.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  pl.statut === "actif" ? "bg-primary-600" : pl.statut === "paye" ? "bg-green-50" : "bg-gray-100"
                }`}>
                  <LinkIcon className={`w-4 h-4 ${
                    pl.statut === "actif" ? "text-white" : pl.statut === "paye" ? "text-green-600" : "text-gray-400"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {pl.description || "Lien de paiement"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {pl.statut === "actif" ? "Actif" : pl.statut === "paye" ? "Payé" : "Annulé"} · {formatDate(pl.created_at)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900 tabular-nums whitespace-nowrap mr-2">
                  {pl.montant ? `${pl.montant.toLocaleString("fr-FR")} €` : "Libre"}
                </p>
                {pl.statut === "actif" && (
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => copyLinkUrl(pl.code)} className="p-2 rounded-lg hover:bg-gray-100 transition" title="Copier">
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button onClick={() => shareLink(pl.code, pl.description)} className="p-2 rounded-lg hover:bg-gray-100 transition" title="Partager">
                      <Share2 className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button onClick={() => handleDeleteLink(pl.id)} className="p-2 rounded-lg hover:bg-red-50 transition" title="Annuler">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200 bg-black/70 backdrop-blur-sm" onClick={() => setSendModalOpen(false)}>
          <div 
            className="bg-[#0F172A] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl relative max-h-[92vh] overflow-y-auto border border-white/10 animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-indigo-500/15 text-indigo-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {sendMode === "link" ? (
                      sendLinkStep === "success" ? "Lien prêt !" : "Envoyer via lien"
                    ) : (
                      <>
                        {sendStep === "search" && "Envoyer de l'argent"}
                        {sendStep === "amount" && "Montant à envoyer"}
                        {sendStep === "confirm" && "Confirmer l'envoi"}
                        {sendStep === "success" && "Envoyé avec succès !"}
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Transaction sécurisée
                  </p>
                </div>
              </div>
              <button onClick={() => setSendModalOpen(false)} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Tabs: Direct / Via lien — visible only at initial steps */}
            {((sendMode === "direct" && sendStep === "search") || (sendMode === "link" && sendLinkStep === "form")) && (
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => { setSendMode("direct"); setSendStep("search"); }}
                  className={`flex-1 py-4 text-sm font-semibold text-center transition-all relative ${
                    sendMode === "direct" 
                      ? "text-white" 
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Search className="w-4 h-4 inline mr-2 -mt-0.5" />
                  Rechercher
                  {sendMode === "direct" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_-2px_10px_rgba(99,102,241,0.5)]"></div>
                  )}
                </button>
                <button
                  onClick={() => { setSendMode("link"); setSendLinkStep("form"); }}
                  className={`flex-1 py-4 text-sm font-semibold text-center transition-all relative ${
                    sendMode === "link" 
                      ? "text-white" 
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <LinkIcon className="w-4 h-4 inline mr-2 -mt-0.5" />
                  Via lien
                  {sendMode === "link" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_-2px_10px_rgba(99,102,241,0.5)]"></div>
                  )}
                </button>
              </div>
            )}

            <div className="p-5 sm:p-6 pb-8">
              {/* ═══ Mode Direct: rechercher un user ═══ */}
              {sendMode === "direct" && (
                <>
              {/* Step 1: Search */}
              {sendStep === "search" && (
                <div className="space-y-4">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white placeholder-slate-600 transition-all font-medium"
                      autoFocus
                    />
                  </div>

                  {searchLoading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                  )}

                  {!searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="w-8 h-8 text-slate-600" />
                      </div>
                      <p className="text-sm text-slate-500">Aucun utilisateur trouvé</p>
                    </div>
                  )}

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-left group"
                      >
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-indigo-500/50 transition-all" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center ring-2 ring-white/10 group-hover:ring-indigo-500/50 transition-all">
                            <span className="text-sm font-bold text-indigo-400">
                              {(u.prenom?.[0] || "?")}{(u.nom?.[0] || "")}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">{u.prenom} {u.nom}</p>
                          {u.email_masked && <p className="text-xs text-slate-500">{u.email_masked}</p>}
                        </div>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                           <ArrowUpRight className="w-4 h-4 text-indigo-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Amount */}
              {sendStep === "amount" && selectedUser && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/30" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center ring-2 ring-indigo-500/30">
                        <span className="text-base font-bold text-indigo-400">
                          {(selectedUser.prenom?.[0] || "?")}{(selectedUser.nom?.[0] || "")}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-base font-semibold text-white">{selectedUser.prenom} {selectedUser.nom}</p>
                      <p className="text-xs text-indigo-400 uppercase tracking-wider font-medium">Destinataire</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Montant à envoyer</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-medium text-lg group-focus-within:text-indigo-400 transition-colors">€</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-2xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-slate-500 text-center font-medium">Solde disponible : <span className="text-white">{formatMontant(soldeWallet)}</span></p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Message (optionnel)</label>
                    <textarea
                      value={sendMessage}
                      onChange={(e) => setSendMessage(e.target.value)}
                      placeholder="Ex: Remboursement dîner..."
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white placeholder-slate-600 transition-all text-sm resize-none"
                      rows={2}
                      maxLength={100}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setSendStep("search")}
                      className="flex-1 py-3.5 rounded-xl border border-white/10 text-slate-400 font-semibold hover:bg-white/5 hover:text-white transition-all text-sm"
                    >
                      Retour
                    </button>
                    <button
                      onClick={() => setSendStep("confirm")}
                      disabled={!sendAmount || parseFloat(sendAmount) <= 0}
                      className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none text-sm"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {sendStep === "confirm" && selectedUser && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                  <div className="bg-gradient-to-b from-white/10 to-white/5 rounded-3xl p-6 text-center border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    
                    <p className="text-sm text-slate-400 font-medium mb-2 uppercase tracking-wide">Vous envoyez</p>
                    <p className="text-4xl font-black text-white tracking-tight mb-4">{parseFloat(sendAmount).toFixed(2)} <span className="text-indigo-400">€</span></p>
                    
                    <div className="flex justify-center items-center gap-3">
                       <div className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2 border border-white/5">
                         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                         <span className="text-sm font-semibold text-white">{selectedUser.prenom} {selectedUser.nom}</span>
                       </div>
                    </div>

                    {sendMessage && (
                      <div className="mt-6 bg-black/20 rounded-xl p-3 border border-white/5 mx-auto max-w-[80%]">
                        <p className="text-sm text-slate-300 italic">&ldquo;{sendMessage}&rdquo;</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSendStep("amount")}
                      className="flex-1 py-3.5 rounded-xl border border-white/10 text-slate-400 font-semibold hover:bg-white/5 hover:text-white transition-all text-sm"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={handleSendConfirm}
                      disabled={sendLoading}
                      className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2 group text-sm"
                    >
                      {sendLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />}
                      {sendLoading ? "Envoi en cours..." : "Confirmer l'envoi"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Success */}
              {sendStep === "success" && (
                <div className="text-center py-6 animate-in zoom-in-50 duration-300">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Transfert réussi !</h3>
                  <p className="text-slate-400 mb-6">
                    <span className="text-white font-bold">{parseFloat(sendAmount).toFixed(2)} €</span> envoyés à <span className="text-white font-semibold">{selectedUser?.prenom} {selectedUser?.nom}</span>
                  </p>
                  
                  {sendRef && (
                    <div className="bg-white/5 rounded-xl py-2 px-4 inline-block mb-8 border border-white/10">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Référence transaction</p>
                      <p className="font-mono text-slate-300 text-sm">{sendRef}</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setSendModalOpen(false)}
                    className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 border border-white/10 transition-all"
                  >
                    Fermer
                  </button>
                </div>
              )}
                </>
              )}

              {/* ═══ Mode Lien: envoyer via lien ═══ */}
              {sendMode === "link" && (
                <>
                  {sendLinkStep === "form" && (
                    <div className="space-y-6">
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex gap-3">
                         <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                         <p className="text-sm text-indigo-300/90 leading-relaxed">
                           Votre argent sera débité immédiatement. Partagez le lien généré — le destinataire cliquera simplement pour récupérer les fonds.
                         </p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Montant à envoyer</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                             <span className="text-slate-400 font-medium text-lg group-focus-within:text-indigo-400 transition-colors">€</span>
                          </div>
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={sendLinkAmount}
                            onChange={(e) => setSendLinkAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-2xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                          />
                        </div>
                        <p className="text-xs text-slate-500 text-center font-medium">Solde disponible : <span className="text-white">{formatMontant(soldeWallet)}</span></p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Message (optionnel)</label>
                        <input
                          type="text"
                          value={sendLinkDesc}
                          onChange={(e) => setSendLinkDesc(e.target.value)}
                          placeholder="Ex: Cadeau d'anniversaire"
                          className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white placeholder-slate-600 transition-all text-sm"
                          maxLength={120}
                        />
                      </div>

                      <button
                        onClick={handleSendViaLink}
                        disabled={sendLinkCreating || !sendLinkAmount || parseFloat(sendLinkAmount) <= 0}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2 group mt-2"
                      >
                        {sendLinkCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        {sendLinkCreating ? "Création du lien..." : "Générer le lien de paiement"}
                      </button>
                    </div>
                  )}

                  {sendLinkStep === "success" && sendLinkCode && (
                    <div className="text-center space-y-6 animate-in zoom-in-50 duration-300">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-emerald-500/20">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-2xl font-bold text-white">Lien créé avec succès !</h4>
                        <p className="text-slate-400 text-sm">
                          <span className="text-white font-bold">{parseFloat(sendLinkAmount).toFixed(2)} €</span> ont été débités de votre portefeuille.
                        </p>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 shadow-inner">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">Lien de récupération</p>
                        <div className="bg-black/40 rounded-xl p-3 flex items-center gap-2 border border-white/5">
                          <input
                            type="text"
                            readOnly
                            value={`${typeof window !== "undefined" ? window.location.origin : ""}/pay/${sendLinkCode}`}
                            className="flex-1 bg-transparent text-sm text-indigo-300 outline-none font-mono truncate"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <button
                            onClick={() => { const url = `${window.location.origin}/pay/${sendLinkCode}`; navigator.clipboard.writeText(url); }}
                            className="flex items-center justify-center gap-2 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm font-medium text-white group"
                          >
                            <Copy className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                            Copier
                          </button>
                          <button
                            onClick={() => shareLink(sendLinkCode, sendLinkDesc || null)}
                            className="flex items-center justify-center gap-2 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm font-medium text-white group"
                          >
                            <Share2 className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                            Partager
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => setSendModalOpen(false)}
                        className="w-full py-4 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all"
                      >
                        Fermer
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Recevoir de l'argent (Request Money) ── */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200 bg-black/70 backdrop-blur-sm" onClick={() => { setLinkModalOpen(false); setCreatedLinkCode(null); }}>
          <div 
            className="bg-[#0F172A] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl relative max-h-[92vh] overflow-y-auto border border-white/10 animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-500/15 text-blue-400">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Recevoir de l&apos;argent</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Lien de paiement sécurisé
                  </p>
                </div>
              </div>
              <button onClick={() => { setLinkModalOpen(false); setCreatedLinkCode(null); }} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 sm:p-6 pb-8">
              {!createdLinkCode ? (
                <>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 mb-6">
                     <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                     <p className="text-sm text-blue-300/90 leading-relaxed">
                       Créez un lien de paiement unique et partagez-le. Vous recevrez les fonds instantanément sur votre portefeuille Binq.
                     </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                        Combien demandez-vous ? <span className="text-slate-500 font-normal normal-case opacity-60 ml-1">— vide = montant libre</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                           <span className="text-slate-400 font-medium text-lg group-focus-within:text-blue-400 transition-colors">€</span>
                        </div>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={linkAmount}
                          onChange={(e) => setLinkAmount(e.target.value)}
                          placeholder="Ex: 25.00"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-2xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Motif (optionnel)</label>
                      <input
                        type="text"
                        value={linkDescription}
                        onChange={(e) => setLinkDescription(e.target.value)}
                        placeholder="Ex: Part du resto, loyer, cadeau..."
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-slate-600 transition-all text-sm"
                        maxLength={120}
                      />
                    </div>

                    <button
                      onClick={handleCreateLinkWithCode}
                      disabled={linkCreating}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 group mt-2"
                    >
                      {linkCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDownLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                      {linkCreating ? "Création du lien..." : "Générer le lien de paiement"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-6 animate-in zoom-in-50 duration-300">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-2xl font-bold text-white">Lien de paiement prêt !</h4>
                    <p className="text-slate-400 text-sm">
                      Partagez ce lien pour recevoir des fonds sur votre portefeuille.
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 shadow-inner">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">Lien à partager</p>
                    <div className="bg-black/40 rounded-xl p-3 flex items-center gap-2 border border-white/5">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${createdLinkCode}`}
                        className="flex-1 bg-transparent text-sm text-blue-300 outline-none font-mono truncate"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <button
                        onClick={() => copyLinkUrl(createdLinkCode)}
                        className="flex items-center justify-center gap-2 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm font-medium text-white group"
                      >
                        <Copy className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                        Copier
                      </button>
                      <button
                        onClick={() => shareLink(createdLinkCode, linkDescription || null)}
                        className="flex items-center justify-center gap-2 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm font-medium text-white group"
                      >
                        <Share2 className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                        Partager
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setCreatedLinkCode(null); setLinkAmount(''); setLinkDescription(''); }}
                      className="flex-1 py-4 rounded-xl border border-white/10 text-slate-400 font-semibold hover:bg-white/5 hover:text-white transition-all text-sm"
                    >
                      Nouveau lien
                    </button>
                    <button
                      onClick={() => { setLinkModalOpen(false); setCreatedLinkCode(null); setLinkAmount(''); setLinkDescription(''); }}
                      className="flex-1 py-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 border border-white/10 transition-all"
                    >
                      Terminer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
