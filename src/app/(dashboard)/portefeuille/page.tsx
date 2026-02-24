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
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={handleDeposit}
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-semibold">Déposer</span>
        </button>
        <button
          onClick={openSendModal}
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
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
                  pl.statut === "actif" ? "bg-gray-900" : pl.statut === "paye" ? "bg-green-50" : "bg-gray-100"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {sendMode === "link" ? (
                  sendLinkStep === "success" ? "Lien prêt !" : "Envoyer via lien"
                ) : (
                  <>
                    {sendStep === "search" && "Envoyer de l'argent"}
                    {sendStep === "amount" && "Montant"}
                    {sendStep === "confirm" && "Confirmer"}
                    {sendStep === "success" && "Envoyé !"}
                  </>
                )}
              </h3>
              <button onClick={() => setSendModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs: Direct / Via lien — visible only at initial steps */}
            {((sendMode === "direct" && sendStep === "search") || (sendMode === "link" && sendLinkStep === "form")) && (
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => { setSendMode("direct"); setSendStep("search"); }}
                  className={`flex-1 py-3 text-sm font-semibold text-center transition ${sendMode === "direct" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <Search className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Rechercher
                </button>
                <button
                  onClick={() => { setSendMode("link"); setSendLinkStep("form"); }}
                  className={`flex-1 py-3 text-sm font-semibold text-center transition ${sendMode === "link" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <LinkIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Via lien
                </button>
              </div>
            )}

            <div className="p-5">
              {/* ═══ Mode Direct: rechercher un user ═══ */}
              {sendMode === "direct" && (
                <>
              {/* Step 1: Search */}
              {sendStep === "search" && (
                <div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                      autoFocus
                    />
                  </div>

                  {searchLoading && (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
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
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-600">
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
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600">
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
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-2xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
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
                      className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition disabled:opacity-50"
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
                      className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Transfert effectué !</h3>
                  <p className="text-sm text-gray-500 mb-1">
                    {parseFloat(sendAmount).toFixed(2)} € envoyés à {selectedUser?.prenom} {selectedUser?.nom}
                  </p>
                  <p className="text-xs text-gray-400 mb-5">Réf: {sendRef}</p>
                  <button
                    onClick={() => setSendModalOpen(false)}
                    className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition"
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
                    <div>
                      <p className="text-sm text-gray-500 mb-5">
                        Votre argent sera débité immédiatement. Partagez le lien — le destinataire clique pour récupérer les fonds.
                      </p>

                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Montant (€)</label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={sendLinkAmount}
                          onChange={(e) => setSendLinkAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-2xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          autoFocus
                        />
                        <p className="text-xs text-gray-400 mt-1 text-center">Solde : {formatMontant(soldeWallet)}</p>
                      </div>

                      <div className="mb-5">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Message (optionnel)</label>
                        <input
                          type="text"
                          value={sendLinkDesc}
                          onChange={(e) => setSendLinkDesc(e.target.value)}
                          placeholder="Ex: Cadeau d'anniversaire"
                          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                          maxLength={120}
                        />
                      </div>

                      <button
                        onClick={handleSendViaLink}
                        disabled={sendLinkCreating || !sendLinkAmount || parseFloat(sendLinkAmount) <= 0}
                        className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {sendLinkCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {sendLinkCreating ? "Création..." : "Envoyer via lien"}
                      </button>
                    </div>
                  )}

                  {sendLinkStep === "success" && sendLinkCode && (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">Lien prêt !</h4>
                      <p className="text-sm text-gray-500 mb-1">
                        {parseFloat(sendLinkAmount).toFixed(2)} € débités de votre portefeuille
                      </p>
                      <p className="text-sm text-gray-500 mb-4">Partagez ce lien pour que le destinataire récupère l&apos;argent</p>

                      <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${typeof window !== "undefined" ? window.location.origin : ""}/pay/${sendLinkCode}`}
                          className="flex-1 bg-transparent text-sm text-gray-700 outline-none font-mono truncate"
                        />
                        <button
                          onClick={() => copyLinkUrl(sendLinkCode)}
                          className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <button
                          onClick={() => { const url = `${window.location.origin}/pay/${sendLinkCode}`; navigator.clipboard.writeText(url); }}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                        >
                          <Copy className="w-5 h-5 text-gray-600" />
                          <span className="text-xs font-medium text-gray-700">Copier</span>
                        </button>
                        <button
                          onClick={() => shareLink(sendLinkCode, sendLinkDesc || null)}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                        >
                          <Share2 className="w-5 h-5 text-gray-600" />
                          <span className="text-xs font-medium text-gray-700">Partager</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setSendModalOpen(false)}
                        className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-gray-900" />
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
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-2xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                      maxLength={120}
                    />
                  </div>

                  <button
                    onClick={handleCreateLinkWithCode}
                    disabled={linkCreating}
                    className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {linkCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rotate-180" />}
                    {linkCreating ? "Création..." : "Générer le lien"}
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
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

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <button
                      onClick={() => copyLinkUrl(createdLinkCode)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <Copy className="w-5 h-5 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">Copier</span>
                    </button>
                    <button
                      onClick={() => shareLink(createdLinkCode, linkDescription || null)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <Share2 className="w-5 h-5 text-gray-600" />
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
