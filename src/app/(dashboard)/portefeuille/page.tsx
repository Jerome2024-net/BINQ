"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useFinance } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import DepositWithdrawModal from "@/components/DepositWithdrawModal";
import { PortefeuilleSkeleton } from "@/components/Skeleton";
import { formatMontant, formatDate } from "@/lib/data";
import { getStripe } from "@/lib/stripe-client";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
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
  ShieldCheck,
  Bitcoin,
  TrendingUp,
  TrendingDown,
  CreditCard,
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

  // ── Bitcoin ──
  const [btcModalOpen, setBtcModalOpen] = useState(false);
  const [btcMode, setBtcMode] = useState<"achat" | "vente">("achat");
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [btcChange24h, setBtcChange24h] = useState<number>(0);
  const [btcAmount, setBtcAmount] = useState("");
  const [btcLoading, setBtcLoading] = useState(false);
  const [btcStep, setBtcStep] = useState<"form" | "confirm" | "payment" | "success">("form");
  const [btcResult, setBtcResult] = useState<{ montant_crypto: number; montant_eur: number; frais: number; reference: string } | null>(null);
  const [btcWallet, setBtcWallet] = useState<{ solde: number }>({ solde: 0 });
  const [btcTransactions, setBtcTransactions] = useState<Array<{ id: string; type: string; montant_crypto: number; montant_eur: number; prix_unitaire: number; frais_eur: number; reference: string; created_at: string }>>([]);
  const [btcPriceLoading, setBtcPriceLoading] = useState(false);
  const [btcClientSecret, setBtcClientSecret] = useState<string | null>(null);
  const [btcPaymentIntentId, setBtcPaymentIntentId] = useState<string | null>(null);

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

  // ── BTC price fetch ──
  const fetchBtcPrice = useCallback(async () => {
    setBtcPriceLoading(true);
    try {
      const res = await fetch("/api/crypto/price");
      const data = await res.json();
      if (data.price) {
        setBtcPrice(data.price);
        setBtcChange24h(data.change24h || 0);
      }
    } catch { /* ignore */ } finally { setBtcPriceLoading(false); }
  }, []);

  // ── BTC wallet & transactions ──
  const fetchBtcData = useCallback(async () => {
    try {
      const res = await fetch("/api/crypto/trade");
      const data = await res.json();
      if (data.wallet) setBtcWallet(data.wallet);
      if (data.transactions) setBtcTransactions(data.transactions);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBtcPrice();
      fetchBtcData();
    }
  }, [user, fetchBtcPrice, fetchBtcData]);

  const openBtcModal = () => {
    setBtcModalOpen(true);
    setBtcMode("achat");
    setBtcStep("form");
    setBtcAmount("");
    setBtcResult(null);
    setBtcClientSecret(null);
    setBtcPaymentIntentId(null);
    fetchBtcPrice();
    fetchBtcData();
  };

  const handleBtcTrade = async () => {
    const montant = parseFloat(btcAmount);
    if (!montant || montant <= 0 || !btcPrice) return;

    setBtcLoading(true);

    if (btcMode === "vente") {
      // ── VENTE → via wallet EUR ──
      try {
        const res = await fetch("/api/crypto/trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "vente",
            montant_eur: montant,
            prix_btc: btcPrice,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast("error", "Erreur", data.error || "Transaction échouée");
          return;
        }
        setBtcResult(data.transaction);
        setBtcStep("success");
        getOrCreateWallet();
        fetchBtcData();
        showToast("success", "Vente confirmée", `Transaction ${data.transaction.reference} effectuée`);
      } catch {
        showToast("error", "Erreur", "Erreur lors de la transaction");
      } finally { setBtcLoading(false); }
    } else {
      // ── ACHAT → toujours par carte bancaire ──
      try {
        const res = await fetch("/api/crypto/trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "achat",
            montant_eur: montant,
            prix_btc: btcPrice,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast("error", "Erreur", data.error || "Erreur création paiement");
          return;
        }
        setBtcClientSecret(data.clientSecret);
        setBtcPaymentIntentId(data.paymentIntentId);
        setBtcStep("payment");
      } catch {
        showToast("error", "Erreur", "Erreur lors de la création du paiement");
      } finally { setBtcLoading(false); }
    }
  };

  const handleBtcCardSuccess = async () => {
    if (!btcPaymentIntentId) return;
    setBtcLoading(true);
    try {
      const res = await fetch("/api/crypto/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: btcPaymentIntentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Erreur confirmation");
        return;
      }
      setBtcResult(data.transaction);
      setBtcStep("success");
      fetchBtcData();
      showToast("success", "Achat confirmé", `Transaction ${data.transaction.reference} effectuée`);
    } catch {
      showToast("error", "Erreur", "Erreur lors de la confirmation");
    } finally { setBtcLoading(false); }
  };

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
      achat_crypto: "Achat Bitcoin",
      vente_crypto: "Vente Bitcoin",
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
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        <button
          onClick={handleDeposit}
          className="flex flex-col items-center gap-2 py-4 sm:py-5 rounded-2xl bg-white border border-gray-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
            <Plus className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-700">Déposer</span>
        </button>
        <button
          onClick={openSendModal}
          className="flex flex-col items-center gap-2 py-4 sm:py-5 rounded-2xl bg-white border border-gray-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
            <Send className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-700">Envoyer</span>
        </button>
        <button
          onClick={handleWithdraw}
          className="flex flex-col items-center gap-2 py-4 sm:py-5 rounded-2xl bg-white border border-gray-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
            <Minus className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-700">Retirer</span>
        </button>
        <button
          onClick={() => setLinkModalOpen(true)}
          className="flex flex-col items-center gap-2 py-4 sm:py-5 rounded-2xl bg-white border border-gray-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
            <ArrowDownLeft className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-700">Recevoir</span>
        </button>
        <button
          onClick={openBtcModal}
          className="flex flex-col items-center gap-2 py-4 sm:py-5 rounded-2xl bg-white border border-gray-200 hover:border-amber-200 hover:bg-amber-50/50 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            <Bitcoin className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-700">Bitcoin</span>
        </button>
      </div>

      {/* ── Bitcoin Overview Card ── */}
      {(btcWallet.solde > 0 || btcTransactions.length > 0) && (
        <button onClick={openBtcModal} className="w-full bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-amber-200 transition-colors text-left">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Bitcoin</p>
                <p className="text-xs text-gray-400">BTC</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900 tabular-nums">{btcWallet.solde.toFixed(8)} BTC</p>
              {btcPrice && (
                <p className="text-xs text-gray-400 tabular-nums">≈ {(btcWallet.solde * btcPrice).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
              )}
            </div>
          </div>
          {btcPrice && (
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50">
              <span className="text-xs text-gray-400">Prix BTC</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700 tabular-nums">{btcPrice.toLocaleString("fr-FR")} €</span>
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${btcChange24h >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {btcChange24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {btcChange24h >= 0 ? "+" : ""}{btcChange24h}%
                </span>
              </div>
            </div>
          )}
        </button>
      )}

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
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Achat / Vente Bitcoin</p>
              <p className="text-xs text-gray-400">Par transaction</p>
            </div>
            <span className="text-sm font-semibold text-gray-900">1.5 %</span>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSendModalOpen(false)}>
          <div 
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-[420px] shadow-2xl relative max-h-[92vh] sm:max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-50 text-primary-600">
                <Send className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900">
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
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Transaction sécurisée
                </p>
              </div>
              <button onClick={() => setSendModalOpen(false)} className="p-2 -mr-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs: Direct / Via lien */}
            {((sendMode === "direct" && sendStep === "search") || (sendMode === "link" && sendLinkStep === "form")) && (
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => { setSendMode("direct"); setSendStep("search"); }}
                  className={`flex-1 py-3 text-sm font-semibold text-center transition-all relative ${
                    sendMode === "direct" ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Search className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Rechercher
                  {sendMode === "direct" && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600 rounded-full"></div>
                  )}
                </button>
                <button
                  onClick={() => { setSendMode("link"); setSendLinkStep("form"); }}
                  className={`flex-1 py-3 text-sm font-semibold text-center transition-all relative ${
                    sendMode === "link" ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <LinkIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Via lien
                  {sendMode === "link" && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600 rounded-full"></div>
                  )}
                </button>
              </div>
            )}

            <div className="px-5 py-5 sm:px-6 sm:py-6">
              {/* ═══ Mode Direct: rechercher un user ═══ */}
              {sendMode === "direct" && (
                <>
              {/* Step 1: Search */}
              {sendStep === "search" && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all text-sm"
                      autoFocus
                    />
                  </div>

                  {searchLoading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
                    </div>
                  )}

                  {!searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="w-7 h-7 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-400">Aucun utilisateur trouvé</p>
                    </div>
                  )}

                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left group"
                      >
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-600">
                              {(u.prenom?.[0] || "?")}{(u.nom?.[0] || "")}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{u.prenom} {u.nom}</p>
                          {u.email_masked && <p className="text-xs text-gray-400">{u.email_masked}</p>}
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Amount */}
              {sendStep === "amount" && selectedUser && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600">
                          {(selectedUser.prenom?.[0] || "?")}{(selectedUser.nom?.[0] || "")}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedUser.prenom} {selectedUser.nom}</p>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Destinataire</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 ml-0.5">Montant à envoyer (€)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-2xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                    />
                    <p className="text-xs text-gray-400 text-center">Solde disponible : <span className="text-gray-900 font-medium">{formatMontant(soldeWallet)}</span></p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 ml-0.5">Message (optionnel)</label>
                    <textarea
                      value={sendMessage}
                      onChange={(e) => setSendMessage(e.target.value)}
                      placeholder="Ex: Remboursement dîner..."
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all text-sm resize-none"
                      rows={2}
                      maxLength={100}
                    />
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      onClick={() => setSendStep("search")}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      Retour
                    </button>
                    <button
                      onClick={() => setSendStep("confirm")}
                      disabled={!sendAmount || parseFloat(sendAmount) <= 0}
                      className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {sendStep === "confirm" && selectedUser && (
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-xl p-5 text-center">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">Vous envoyez</p>
                    <p className="text-3xl font-bold text-gray-900 tracking-tight mb-3">{parseFloat(sendAmount).toFixed(2)} <span className="text-primary-600">€</span></p>
                    
                    <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-sm font-medium text-gray-700">{selectedUser.prenom} {selectedUser.nom}</span>
                    </div>

                    {sendMessage && (
                      <div className="mt-4 bg-white rounded-lg p-3 border border-gray-100 mx-auto max-w-[85%]">
                        <p className="text-sm text-gray-500 italic">&ldquo;{sendMessage}&rdquo;</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setSendStep("amount")}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={handleSendConfirm}
                      disabled={sendLoading}
                      className="flex-[2] py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      {sendLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                      {sendLoading ? "Envoi en cours..." : "Confirmer l'envoi"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Success */}
              {sendStep === "success" && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Transfert réussi !</h3>
                  <p className="text-sm text-gray-500 mb-5">
                    <span className="text-gray-900 font-semibold">{parseFloat(sendAmount).toFixed(2)} €</span> envoyés à <span className="text-gray-900 font-semibold">{selectedUser?.prenom} {selectedUser?.nom}</span>
                  </p>
                  
                  {sendRef && (
                    <div className="bg-gray-50 rounded-lg py-2 px-4 inline-block mb-5">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Référence</p>
                      <p className="font-mono text-sm text-gray-700">{sendRef}</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setSendModalOpen(false)}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
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
                    <div className="space-y-5">
                      <div className="bg-primary-50 rounded-xl p-4 flex gap-3">
                        <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-primary-700 leading-relaxed">
                          Votre argent sera débité immédiatement. Partagez le lien généré — le destinataire cliquera simplement pour récupérer les fonds.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 ml-0.5">Montant à envoyer (€)</label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={sendLinkAmount}
                          onChange={(e) => setSendLinkAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-2xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          autoFocus
                        />
                        <p className="text-xs text-gray-400 text-center">Solde disponible : <span className="text-gray-900 font-medium">{formatMontant(soldeWallet)}</span></p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 ml-0.5">Message (optionnel)</label>
                        <input
                          type="text"
                          value={sendLinkDesc}
                          onChange={(e) => setSendLinkDesc(e.target.value)}
                          placeholder="Ex: Cadeau d'anniversaire"
                          className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all text-sm"
                          maxLength={120}
                        />
                      </div>

                      <button
                        onClick={handleSendViaLink}
                        disabled={sendLinkCreating || !sendLinkAmount || parseFloat(sendLinkAmount) <= 0}
                        className="w-full py-3.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {sendLinkCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkIcon className="w-5 h-5" />}
                        {sendLinkCreating ? "Création du lien..." : "Générer le lien de paiement"}
                      </button>
                    </div>
                  )}

                  {sendLinkStep === "success" && sendLinkCode && (
                    <div className="text-center space-y-5">
                      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Lien créé avec succès !</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="text-gray-900 font-semibold">{parseFloat(sendLinkAmount).toFixed(2)} €</span> ont été débités de votre portefeuille.
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2 font-medium">Lien de récupération</p>
                        <div className="bg-white rounded-lg p-3 flex items-center gap-2 border border-gray-200">
                          <input
                            type="text"
                            readOnly
                            value={`${typeof window !== "undefined" ? window.location.origin : ""}/pay/${sendLinkCode}`}
                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none font-mono truncate"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <button
                            onClick={() => { const url = `${window.location.origin}/pay/${sendLinkCode}`; navigator.clipboard.writeText(url); }}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                            Copier
                          </button>
                          <button
                            onClick={() => shareLink(sendLinkCode, sendLinkDesc || null)}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                          >
                            <Share2 className="w-4 h-4 text-gray-400" />
                            Partager
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => setSendModalOpen(false)}
                        className="w-full py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setLinkModalOpen(false); setCreatedLinkCode(null); }}>
          <div 
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-[420px] shadow-2xl relative max-h-[92vh] sm:max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-50 text-primary-600">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900">Recevoir de l&apos;argent</h3>
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Lien de paiement sécurisé
                </p>
              </div>
              <button onClick={() => { setLinkModalOpen(false); setCreatedLinkCode(null); }} className="p-2 -mr-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="px-5 py-5 sm:px-6 sm:py-6">
              {!createdLinkCode ? (
                <>
                  <div className="bg-primary-50 rounded-xl p-4 flex gap-3 mb-5">
                    <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-primary-700 leading-relaxed">
                      Créez un lien de paiement unique et partagez-le. Vous recevrez les fonds instantanément sur votre portefeuille Binq.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 ml-0.5">
                        Montant demandé (€) <span className="text-gray-400 font-normal ml-1">— vide = montant libre</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={linkAmount}
                        onChange={(e) => setLinkAmount(e.target.value)}
                        placeholder="Ex: 25.00"
                        className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-2xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 ml-0.5">Motif (optionnel)</label>
                      <input
                        type="text"
                        value={linkDescription}
                        onChange={(e) => setLinkDescription(e.target.value)}
                        placeholder="Ex: Part du resto, loyer, cadeau..."
                        className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all text-sm"
                        maxLength={120}
                      />
                    </div>

                    <button
                      onClick={handleCreateLinkWithCode}
                      disabled={linkCreating}
                      className="w-full py-3.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {linkCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDownLeft className="w-5 h-5" />}
                      {linkCreating ? "Création du lien..." : "Générer le lien de paiement"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-5">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Lien de paiement prêt !</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Partagez ce lien pour recevoir des fonds sur votre portefeuille.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2 font-medium">Lien à partager</p>
                    <div className="bg-white rounded-lg p-3 flex items-center gap-2 border border-gray-200">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${createdLinkCode}`}
                        className="flex-1 bg-transparent text-sm text-gray-700 outline-none font-mono truncate"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        onClick={() => copyLinkUrl(createdLinkCode)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                        Copier
                      </button>
                      <button
                        onClick={() => shareLink(createdLinkCode, linkDescription || null)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                      >
                        <Share2 className="w-4 h-4 text-gray-400" />
                        Partager
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => { setCreatedLinkCode(null); setLinkAmount(''); setLinkDescription(''); }}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      Nouveau lien
                    </button>
                    <button
                      onClick={() => { setLinkModalOpen(false); setCreatedLinkCode(null); setLinkAmount(''); setLinkDescription(''); }}
                      className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
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

      {/* ── Modal Bitcoin ── */}
      {btcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setBtcModalOpen(false)}>
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-[420px] shadow-2xl relative max-h-[92vh] sm:max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50 text-amber-600">
                <Bitcoin className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900">
                  {btcStep === "success" ? "Transaction confirmée !" : btcStep === "confirm" ? "Confirmation" : btcStep === "payment" ? "Paiement par carte" : "Bitcoin"}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Transaction sécurisée
                  </p>
                  {btcPrice && btcStep === "form" && (
                    <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${btcChange24h >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {btcChange24h >= 0 ? "+" : ""}{btcChange24h}%
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setBtcModalOpen(false)} className="p-2 -mr-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs Achat / Vente */}
            {btcStep === "form" && (
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => { setBtcMode("achat"); setBtcAmount(""); }}
                  className={`flex-1 py-3 text-sm font-semibold text-center transition-all relative ${btcMode === "achat" ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Acheter
                  {btcMode === "achat" && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-green-600 rounded-full" />}
                </button>
                <button
                  onClick={() => { setBtcMode("vente"); setBtcAmount(""); }}
                  className={`flex-1 py-3 text-sm font-semibold text-center transition-all relative ${btcMode === "vente" ? "text-red-500" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Vendre
                  {btcMode === "vente" && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-red-500 rounded-full" />}
                </button>
              </div>
            )}

            <div className="px-5 py-5 sm:px-6 sm:py-6">
              {/* Form */}
              {btcStep === "form" && (
                <div className="space-y-5">
                  {/* BTC Price */}
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Prix Bitcoin</p>
                      {btcPriceLoading ? (
                        <Loader2 className="w-5 h-5 text-gray-300 animate-spin mt-1" />
                      ) : (
                        <p className="text-lg font-bold text-gray-900 tabular-nums">{btcPrice ? `${btcPrice.toLocaleString("fr-FR")} €` : "—"}</p>
                      )}
                    </div>
                    <button onClick={fetchBtcPrice} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                      Actualiser
                    </button>
                  </div>

                  {/* Soldes */}
                  <div className="flex gap-3">
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Solde EUR</p>
                      <p className="text-sm font-bold text-gray-900 tabular-nums mt-0.5">{formatMontant(soldeWallet)}</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Solde BTC</p>
                      <p className="text-sm font-bold text-gray-900 tabular-nums mt-0.5">{btcWallet.solde.toFixed(8)}</p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 ml-0.5">
                      Montant en EUR
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={btcAmount}
                      onChange={(e) => setBtcAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-2xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                    />
                    {btcAmount && btcPrice && parseFloat(btcAmount) > 0 && (
                      <div className="text-center space-y-1">
                        <p className="text-sm text-gray-500">
                          ≈ <span className="font-semibold text-gray-900">{((parseFloat(btcAmount) * (1 - 0.015)) / btcPrice).toFixed(8)} BTC</span>
                        </p>
                        <p className="text-xs text-gray-400">Frais : {(parseFloat(btcAmount) * 0.015).toFixed(2)} € (1.5%)</p>
                      </div>
                    )}
                  </div>

                  {/* Indication moyen de paiement pour achat */}
                  {btcMode === "achat" && (
                    <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-primary-200 bg-primary-50/50">
                      <CreditCard className="w-4.5 h-4.5 text-primary-600" />
                      <div>
                        <p className="text-xs font-semibold text-primary-700">Paiement par carte bancaire</p>
                        <p className="text-[10px] text-gray-400">Visa, Mastercard — frais 1.5%</p>
                      </div>
                    </div>
                  )}

                  {/* Quick amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setBtcAmount(amt.toString())}
                        className={`py-2 rounded-lg border text-sm font-semibold transition-all ${
                          btcAmount === amt.toString()
                            ? "border-primary-300 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {amt} €
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setBtcStep("confirm")}
                    disabled={!btcAmount || parseFloat(btcAmount) <= 0 || !btcPrice}
                    className={`w-full py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white ${
                      btcMode === "achat"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    <Bitcoin className="w-5 h-5" />
                    {btcMode === "achat" ? "Acheter du Bitcoin" : "Vendre du Bitcoin"}
                  </button>
                </div>
              )}

              {/* Confirm */}
              {btcStep === "confirm" && btcPrice && (
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-xl p-5 text-center space-y-3">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                      {btcMode === "achat" ? "Vous achetez" : "Vous vendez"}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 tracking-tight">
                      {btcMode === "achat"
                        ? ((parseFloat(btcAmount) * (1 - 0.015)) / btcPrice).toFixed(8)
                        : (parseFloat(btcAmount) / btcPrice).toFixed(8)
                      } <span className="text-amber-600">BTC</span>
                    </p>
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Montant</span>
                        <span className="text-gray-900 font-medium">{parseFloat(btcAmount).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Frais (1.5%)</span>
                        <span className="text-gray-900 font-medium">{(parseFloat(btcAmount) * 0.015).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Prix BTC</span>
                        <span className="text-gray-900 font-medium">{btcPrice.toLocaleString("fr-FR")} €</span>
                      </div>
                      {btcMode === "achat" && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Paiement</span>
                          <span className="text-gray-900 font-medium flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" />
                            Carte bancaire
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setBtcStep("form")}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={handleBtcTrade}
                      disabled={btcLoading}
                      className={`flex-[2] py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm text-white ${
                        btcMode === "achat" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      {btcLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : btcMode === "achat" ? <CreditCard className="w-4 h-4" /> : <Bitcoin className="w-4 h-4" />}
                      {btcLoading ? "En cours..." : btcMode === "achat" ? "Payer par carte" : "Confirmer"}
                    </button>
                  </div>
                </div>
              )}

              {/* Stripe Card Payment */}
              {btcStep === "payment" && btcClientSecret && (
                <div className="space-y-4">
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-amber-700 font-medium">
                      Achat de {btcPrice ? ((parseFloat(btcAmount) * (1 - 0.015)) / btcPrice).toFixed(8) : "..."} BTC pour {parseFloat(btcAmount).toFixed(2)} €
                    </p>
                  </div>
                  <Elements
                    stripe={getStripe()}
                    options={{
                      clientSecret: btcClientSecret,
                      appearance: {
                        theme: "stripe",
                        variables: {
                          colorPrimary: "#4f46e5",
                          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                          spacingUnit: "4px",
                          borderRadius: "10px",
                        },
                      },
                      locale: "fr",
                    }}
                  >
                    <BtcCardPaymentForm
                      onSuccess={handleBtcCardSuccess}
                      onCancel={() => { setBtcStep("confirm"); setBtcClientSecret(null); }}
                    />
                  </Elements>
                </div>
              )}

              {/* Success */}
              {btcStep === "success" && btcResult && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {btcResult.montant_crypto > 0 && btcMode === "achat" ? "Achat confirmé !" : "Vente confirmée !"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-5">
                    <span className="text-gray-900 font-semibold">{btcResult.montant_crypto.toFixed(8)} BTC</span>
                    {btcMode === "achat" ? " achetés" : " vendus"} pour{" "}
                    <span className="text-gray-900 font-semibold">{btcResult.montant_eur.toFixed(2)} €</span>
                  </p>

                  <div className="bg-gray-50 rounded-lg py-2 px-4 inline-block mb-5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Référence</p>
                    <p className="font-mono text-sm text-gray-700">{btcResult.reference}</p>
                  </div>

                  <button
                    onClick={() => setBtcModalOpen(false)}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              )}

              {/* Recent BTC Transactions */}
              {btcStep === "form" && btcTransactions.length > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Historique BTC</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {btcTransactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${tx.type === "achat" ? "bg-green-50" : "bg-red-50"}`}>
                            {tx.type === "achat" ? <TrendingUp className="w-3.5 h-3.5 text-green-600" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">{tx.type === "achat" ? "Achat" : "Vente"}</p>
                            <p className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleDateString("fr-FR")}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-semibold tabular-nums ${tx.type === "achat" ? "text-green-600" : "text-red-500"}`}>
                            {tx.type === "achat" ? "+" : "-"}{tx.montant_crypto.toFixed(8)} BTC
                          </p>
                          <p className="text-[10px] text-gray-400 tabular-nums">{tx.montant_eur.toFixed(2)} €</p>
                        </div>
                      </div>
                    ))}
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

// ========================
// Composant : Formulaire Stripe Elements pour achat BTC par carte
// ========================
function BtcCardPaymentForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/portefeuille?btc_payment=success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Le paiement a échoué");
      } else {
        onSuccess();
      }
    } catch {
      setErrorMessage("Erreur lors du paiement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {errorMessage && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
          <p className="text-xs text-red-600">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 transition-colors text-sm"
        >
          Retour
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isSubmitting}
          className="flex-[2] py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm text-white bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          {isSubmitting ? "Paiement en cours..." : "Payer"}
        </button>
      </div>

      <p className="text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" />
        Paiement sécurisé via Stripe
      </p>
    </form>
  );
}