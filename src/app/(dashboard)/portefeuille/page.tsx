"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess, hapticError, hapticMedium } from "@/lib/haptics";
import { type DeviseCode, DEFAULT_DEVISE, formatMontant } from "@/lib/currencies";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  X,
  ChevronRight,
  Check,
  Smartphone,
  CreditCard,
  Building2,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

/* ── Types ── */
interface Wallet {
  id: string;
  solde: number;
  devise: DeviseCode;
}

interface Transaction {
  id: string;
  type: string;
  montant: number;
  devise: string;
  statut: string;
  reference: string;
  description: string;
  created_at: string;
}

interface WithdrawalMethod {
  id: string;
  type: string;
  label: string;
  numero: string;
  nom_titulaire: string | null;
  is_default: boolean;
}

interface Withdrawal {
  id: string;
  montant: number;
  frais: number;
  net: number;
  devise: string;
  statut: string;
  reference: string;
  processed_at: string | null;
  created_at: string;
  withdrawal_methods?: { type: string; label: string; numero: string };
}

/* ── Helpers ── */
const METHOD_TYPES = [
  { value: "momo_mtn", label: "MTN MoMo", icon: Smartphone, color: "text-yellow-600" },
  { value: "moov_money", label: "Moov Money", icon: Smartphone, color: "text-blue-500" },
  { value: "bank_transfer", label: "Virement bancaire", icon: Building2, color: "text-gray-600" },
];

function getMethodMeta(type: string) {
  return METHOD_TYPES.find((m) => m.value === type) || METHOD_TYPES[0];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function statutBadge(statut: string) {
  switch (statut) {
    case "pending": return { label: "En attente", icon: Clock, cls: "text-amber-600 bg-amber-50" };
    case "processing": return { label: "En cours", icon: Loader2, cls: "text-blue-600 bg-blue-50" };
    case "completed": return { label: "Effectué", icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-50" };
    case "failed": return { label: "Échoué", icon: XCircle, cls: "text-red-600 bg-red-50" };
    case "cancelled": return { label: "Annulé", icon: XCircle, cls: "text-gray-600 bg-gray-50" };
    default: return { label: statut, icon: Clock, cls: "text-gray-600 bg-gray-50" };
  }
}

/* ── Views ── */
type View = "main" | "withdraw" | "withdraw-amount" | "withdraw-confirm" | "withdraw-success" | "add-method" | "history";

export default function PortefeuillePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [view, setView] = useState<View>("main");
  const [loading, setLoading] = useState(true);

  // Wallet data
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [devise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("binq_devise") as DeviseCode) || DEFAULT_DEVISE;
    }
    return DEFAULT_DEVISE;
  });

  // Withdraw flow state
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [lastWithdrawal, setLastWithdrawal] = useState<{ net: number; method: string; reference: string } | null>(null);

  // Add method state
  const [newMethodType, setNewMethodType] = useState("");
  const [newMethodNumero, setNewMethodNumero] = useState("");
  const [newMethodNom, setNewMethodNom] = useState("");
  const [addingMethod, setAddingMethod] = useState(false);

  /* ── Load data ── */
  const loadData = useCallback(async () => {
    try {
      const [walletRes, methodsRes, withdrawRes] = await Promise.all([
        fetch(`/api/wallet?devise=${devise}`),
        fetch("/api/wallet/methods"),
        fetch("/api/wallet/withdraw"),
      ]);
      const [walletData, methodsData, withdrawData] = await Promise.all([
        walletRes.json(),
        methodsRes.json(),
        withdrawRes.json(),
      ]);

      if (walletData.wallet) setWallet(walletData.wallet);
      if (walletData.transactions) setTransactions(walletData.transactions);
      if (methodsData.methods) setMethods(methodsData.methods);
      if (withdrawData.withdrawals) setWithdrawals(withdrawData.withdrawals);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [devise]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadData]);

  /* ── Actions ── */
  const handleWithdraw = async () => {
    if (!selectedMethod || !withdrawAmount || withdrawing) return;
    const amount = parseInt(withdrawAmount);
    if (!amount || amount <= 0) return;

    setWithdrawing(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method_id: selectedMethod.id,
          montant: amount,
          devise,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        hapticError();
        showToast("error", data.error || "Erreur lors du retrait");
        setWithdrawing(false);
        return;
      }

      hapticSuccess();
      setLastWithdrawal({
        net: data.withdrawal.net,
        method: selectedMethod.label,
        reference: data.withdrawal.reference,
      });
      setWallet((w) => w ? { ...w, solde: data.nouveau_solde } : w);
      setView("withdraw-success");
    } catch {
      hapticError();
      showToast("error", "Erreur réseau");
    }
    setWithdrawing(false);
  };

  const handleAddMethod = async () => {
    if (!newMethodType || !newMethodNumero || addingMethod) return;

    setAddingMethod(true);
    try {
      const res = await fetch("/api/wallet/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newMethodType,
          numero: newMethodNumero,
          nom_titulaire: newMethodNom || undefined,
          is_default: methods.length === 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        hapticError();
        showToast("error", data.error || "Erreur");
        setAddingMethod(false);
        return;
      }

      hapticSuccess();
      showToast("success", "Moyen de retrait ajouté");
      setMethods((prev) => [data.method, ...prev]);
      setNewMethodType("");
      setNewMethodNumero("");
      setNewMethodNom("");
      setView("main");
    } catch {
      hapticError();
      showToast("error", "Erreur réseau");
    }
    setAddingMethod(false);
  };

  const handleDeleteMethod = async (id: string) => {
    try {
      const res = await fetch(`/api/wallet/methods?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMethods((prev) => prev.filter((m) => m.id !== id));
        hapticSuccess();
        showToast("success", "Moyen supprimé");
      }
    } catch { /* ignore */ }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     VIEW: Add withdrawal method
     ═══════════════════════════════════════════ */
  if (view === "add-method") {
    return (
      <div className="px-5 pt-6 pb-28 lg:pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => setView("main")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold">Ajouter un moyen de retrait</h1>
        </div>

        {/* Type selection */}
        <p className="text-[13px] font-semibold text-gray-500 mb-3">Type</p>
        <div className="space-y-2 mb-8">
          {METHOD_TYPES.map((mt) => (
            <button
              key={mt.value}
              onClick={() => { setNewMethodType(mt.value); hapticMedium(); }}
              className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border transition-all ${
                newMethodType === mt.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <mt.icon className={`w-5 h-5 ${mt.color}`} />
              <span className="text-[14px] font-semibold text-gray-900">{mt.label}</span>
              {newMethodType === mt.value && <Check className="w-4 h-4 text-blue-500 ml-auto" />}
            </button>
          ))}
        </div>

        {/* Numéro */}
        {newMethodType && (
          <>
            <p className="text-[13px] font-semibold text-gray-500 mb-3">
              {newMethodType === "bank_transfer" ? "IBAN / Numéro de compte" : "Numéro de téléphone"}
            </p>
            <input
              type={newMethodType === "bank_transfer" ? "text" : "tel"}
              value={newMethodNumero}
              onChange={(e) => setNewMethodNumero(e.target.value)}
              placeholder={newMethodType === "bank_transfer" ? "CI00 0000 0000 0000" : "07 XX XX XX XX"}
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-[15px] font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />

            <p className="text-[13px] font-semibold text-gray-500 mt-6 mb-3">Nom du titulaire (optionnel)</p>
            <input
              type="text"
              value={newMethodNom}
              onChange={(e) => setNewMethodNom(e.target.value)}
              placeholder="Nom complet"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-[15px] font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />

            <button
              onClick={handleAddMethod}
              disabled={!newMethodNumero || newMethodNumero.length < 8 || addingMethod}
              className="w-full mt-8 py-4 bg-blue-500 text-white font-bold text-[15px] rounded-2xl hover:bg-blue-400 transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
            >
              {addingMethod ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Ajouter"
              )}
            </button>
          </>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     VIEW: Select withdrawal method
     ═══════════════════════════════════════════ */
  if (view === "withdraw") {
    return (
      <div className="px-5 pt-6 pb-28 lg:pb-10">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => setView("main")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold">Retirer vers</h1>
        </div>

        {methods.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-[14px] font-semibold text-gray-900 mb-1">Aucun moyen de retrait</p>
            <p className="text-[13px] text-gray-500 mb-6">Ajoutez MTN MoMo, Moov Money ou un virement bancaire</p>
            <button
              onClick={() => { setView("add-method"); hapticMedium(); }}
              className="px-6 py-3 bg-blue-500 text-white font-bold text-[14px] rounded-2xl hover:bg-blue-400 transition-all active:scale-[0.97]"
            >
              Ajouter un moyen
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              {methods.map((m) => {
                const meta = getMethodMeta(m.type);
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMethod(m);
                      setView("withdraw-amount");
                      hapticMedium();
                    }}
                    className="w-full flex items-center gap-3.5 p-4 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                      <meta.icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[14px] font-semibold text-gray-900">{m.label}</p>
                      <p className="text-[12px] text-gray-500">{m.numero}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => { setView("add-method"); hapticMedium(); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-[14px] font-semibold text-blue-600 hover:bg-blue-50 rounded-2xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter un moyen
            </button>
          </>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     VIEW: Enter withdrawal amount
     ═══════════════════════════════════════════ */
  if (view === "withdraw-amount" && selectedMethod) {
    const amount = parseInt(withdrawAmount) || 0;
    const frais = Math.round(amount * 0.01);
    const net = amount - frais;
    const soldeDisponible = wallet ? wallet.solde : 0;
    const isValid = amount >= 500 && amount <= soldeDisponible;

    return (
      <div className="px-5 pt-6 pb-28 lg:pb-10">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => { setView("withdraw"); setWithdrawAmount(""); }} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold">Montant du retrait</h1>
        </div>

        {/* Solde disponible */}
        <div className="text-center mb-8">
          <p className="text-[12px] text-gray-500 font-medium">Solde disponible</p>
          <p className="text-[20px] font-bold text-gray-900 mt-1">{formatMontant(soldeDisponible, devise)}</p>
        </div>

        {/* Amount input */}
        <div className="relative mb-6">
          <input
            type="number"
            inputMode="numeric"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="0"
            autoFocus
            className="w-full text-center text-[36px] font-black py-6 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
          />
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-gray-400">FCFA</span>
        </div>

        {/* Recap */}
        {amount > 0 && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-500">Montant</span>
              <span className="font-semibold text-gray-900">{formatMontant(amount, devise)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-500">Frais (1%)</span>
              <span className="font-semibold text-gray-900">- {formatMontant(frais, devise)}</span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex justify-between text-[14px]">
              <span className="font-bold text-gray-900">Vous recevez</span>
              <span className="font-black text-blue-600">{formatMontant(net, devise)}</span>
            </div>
          </div>
        )}

        {/* Vers */}
        <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl mb-8">
          <Smartphone className={`w-5 h-5 ${getMethodMeta(selectedMethod.type).color}`} />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-gray-900">{selectedMethod.label}</p>
            <p className="text-[11px] text-gray-500">{selectedMethod.numero}</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (isValid) {
              setView("withdraw-confirm");
              hapticMedium();
            }
          }}
          disabled={!isValid}
          className="w-full py-4 bg-blue-500 text-white font-bold text-[15px] rounded-2xl hover:bg-blue-400 transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
        >
          Continuer
        </button>

        {amount > 0 && amount < 500 && (
          <p className="text-center text-[12px] text-red-500 font-medium mt-3">Minimum 500 FCFA</p>
        )}
        {amount > soldeDisponible && (
          <p className="text-center text-[12px] text-red-500 font-medium mt-3">Solde insuffisant</p>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     VIEW: Confirm withdrawal
     ═══════════════════════════════════════════ */
  if (view === "withdraw-confirm" && selectedMethod) {
    const amount = parseInt(withdrawAmount) || 0;
    const frais = Math.round(amount * 0.01);
    const net = amount - frais;

    return (
      <div className="px-5 pt-6 pb-28 lg:pb-10">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => setView("withdraw-amount")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold">Confirmer le retrait</h1>
        </div>

        <div className="text-center mb-8">
          <p className="text-[40px] font-black text-gray-900 leading-none">{formatMontant(net, devise)}</p>
          <p className="text-[13px] text-gray-500 font-medium mt-2">sera envoyé vers</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className={`w-5 h-5 ${getMethodMeta(selectedMethod.type).color}`} />
            <div>
              <p className="text-[14px] font-bold text-gray-900">{selectedMethod.label}</p>
              <p className="text-[12px] text-gray-500">{selectedMethod.numero}</p>
            </div>
          </div>
          <div className="h-px bg-gray-200 mb-3" />
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-500">Montant débité</span>
              <span className="font-semibold">{formatMontant(amount, devise)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-500">Frais (1%)</span>
              <span className="font-semibold">- {formatMontant(frais, devise)}</span>
            </div>
            <div className="flex justify-between text-[14px] pt-1">
              <span className="font-bold">Vous recevez</span>
              <span className="font-black text-blue-600">{formatMontant(net, devise)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleWithdraw}
          disabled={withdrawing}
          className="w-full py-4 bg-blue-500 text-white font-bold text-[15px] rounded-2xl hover:bg-blue-400 transition-all active:scale-[0.97] disabled:opacity-50"
        >
          {withdrawing ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            "Confirmer le retrait"
          )}
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     VIEW: Withdrawal success
     ═══════════════════════════════════════════ */
  if (view === "withdraw-success" && lastWithdrawal) {
    return (
      <div className="px-5 pt-16 pb-28 lg:pb-10 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-blue-500" />
        </div>

        <h1 className="text-[22px] font-black text-gray-900 mb-2">Demande envoyée !</h1>
        <p className="text-[14px] text-gray-500 mb-8">
          {formatMontant(lastWithdrawal.net, devise)} vers {lastWithdrawal.method}. Le statut s&apos;affichera ici dès que le traitement sera effectué.
        </p>

        <div className="bg-gray-50 rounded-2xl p-4 mb-8 inline-block">
          <p className="text-[11px] text-gray-500 font-medium">Référence</p>
          <p className="text-[13px] font-bold text-gray-900 mt-0.5">{lastWithdrawal.reference}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              setView("main");
              setWithdrawAmount("");
              setSelectedMethod(null);
              setLastWithdrawal(null);
              loadData();
            }}
            className="w-full py-4 bg-blue-500 text-white font-bold text-[15px] rounded-2xl hover:bg-blue-400 transition-all active:scale-[0.97]"
          >
            Retour au portefeuille
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     VIEW: Transaction history
     ═══════════════════════════════════════════ */
  if (view === "history") {
    const allItems = [
      ...transactions.map((t) => ({
        id: t.id,
        type: t.type,
        montant: t.montant,
        description: t.description || t.type,
        date: t.created_at,
        statut: t.statut,
        isWithdrawal: false,
      })),
      ...withdrawals.map((w) => ({
        id: w.id,
        type: "retrait",
        montant: -w.montant,
        description: w.statut === "completed"
          ? `Retrait effectué vers ${w.withdrawal_methods?.label || "..."}`
          : `Retrait vers ${w.withdrawal_methods?.label || "..."}`,
        date: w.processed_at || w.created_at,
        statut: w.statut,
        isWithdrawal: true,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="px-5 pt-6 pb-28 lg:pb-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView("main")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold">Historique</h1>
        </div>

        {allItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px] text-gray-400">Aucune transaction</p>
          </div>
        ) : (
          <div className="space-y-1">
            {allItems.map((item) => {
              const isPositive = item.montant > 0;
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPositive ? "bg-blue-50" : "bg-gray-50"}`}>
                    {isPositive ? (
                      <ArrowDownLeft className="w-4 h-4 text-blue-500" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{item.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400">{formatDate(item.date)}</span>
                      {item.isWithdrawal && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statutBadge(item.statut).cls}`}>
                          {statutBadge(item.statut).label}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-[14px] font-bold ${isPositive ? "text-blue-600" : "text-gray-900"}`}>
                    {isPositive ? "+" : ""}{formatMontant(Math.abs(item.montant), devise)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     VIEW: Main wallet screen
     ═══════════════════════════════════════════ */
  const solde = wallet?.solde || 0;
  const pendingWithdrawals = withdrawals.filter((w) => w.statut === "pending" || w.statut === "processing");
  const completedWithdrawals = withdrawals.filter((w) => w.statut === "completed").slice(0, 3);

  return (
    <div className="px-5 pt-8 pb-28 lg:pb-10">
      {/* Balance */}
      <div className="text-center">
        <p className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide">Solde disponible</p>
        <p className="text-[42px] font-black tracking-tight text-gray-900 leading-none mt-3">
          {formatMontant(solde, devise)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 mt-10">
        <button
          onClick={() => {
            if (solde <= 0) {
              showToast("error", "Solde insuffisant");
              hapticError();
              return;
            }
            setView("withdraw");
            hapticMedium();
          }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25 hover:bg-blue-400 transition-all active:scale-95">
            <ArrowUpRight className="w-6 h-6 text-white" />
          </div>
          <span className="text-[12px] font-semibold text-gray-600">Retirer</span>
        </button>

        <button
          onClick={() => {
            setView("history");
            hapticMedium();
          }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all active:scale-95">
            <Clock className="w-6 h-6 text-gray-600" />
          </div>
          <span className="text-[12px] font-semibold text-gray-600">Historique</span>
        </button>
      </div>

      {/* Pending withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <div className="mt-10">
          <p className="text-[13px] font-semibold text-gray-500 mb-3">Retraits en cours</p>
          <div className="space-y-2">
            {pendingWithdrawals.map((w) => {
              const badge = statutBadge(w.statut);
              return (
                <div key={w.id} className="flex items-center gap-3 p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                  <badge.icon className="w-4 h-4 text-amber-600 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-900">
                      {formatMontant(w.net, devise as DeviseCode)}
                    </p>
                    <p className="text-[11px] text-gray-500">{w.withdrawal_methods?.label || "..."}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed withdrawals */}
      {completedWithdrawals.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-gray-500">Retraits effectués</p>
            <button
              onClick={() => { setView("history"); hapticMedium(); }}
              className="text-[12px] font-semibold text-blue-600"
            >
              Voir tout
            </button>
          </div>
          <div className="space-y-2">
            {completedWithdrawals.map((w) => {
              const badge = statutBadge(w.statut);
              return (
                <div key={w.id} className="flex items-center gap-3 p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100/70">
                  <badge.icon className="w-4 h-4 text-emerald-600" />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-900">
                      {formatMontant(w.net, devise as DeviseCode)} envoyé
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {w.withdrawal_methods?.label || "..."} · {formatDate(w.processed_at || w.created_at)}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Withdrawal methods */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-gray-500">Moyens de retrait</p>
          <button
            onClick={() => { setView("add-method"); hapticMedium(); }}
            className="text-[12px] font-semibold text-blue-600 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>

        {methods.length === 0 ? (
          <button
            onClick={() => { setView("add-method"); hapticMedium(); }}
            className="w-full p-5 rounded-2xl border-2 border-dashed border-gray-200 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all"
          >
            <Plus className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] font-semibold text-gray-500">Ajouter MTN MoMo ou Moov Money...</p>
          </button>
        ) : (
          <div className="space-y-2">
            {methods.map((m) => {
              const meta = getMethodMeta(m.type);
              return (
                <div key={m.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                    <meta.icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-900">{m.label}</p>
                    <p className="text-[11px] text-gray-500">{m.numero}</p>
                  </div>
                  {m.is_default && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">Par défaut</span>
                  )}
                  <button
                    onClick={() => handleDeleteMethod(m.id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                  >
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      {transactions.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-gray-500">Transactions récentes</p>
            <button
              onClick={() => { setView("history"); hapticMedium(); }}
              className="text-[12px] font-semibold text-blue-600"
            >
              Voir tout
            </button>
          </div>
          <div className="space-y-0.5">
            {transactions.slice(0, 5).map((t) => {
              const isPositive = t.montant > 0;
              return (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPositive ? "bg-blue-50" : "bg-gray-50"}`}>
                    {isPositive ? (
                      <ArrowDownLeft className="w-3.5 h-3.5 text-blue-500" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-gray-900 truncate">{t.description || t.type}</p>
                    <p className="text-[10px] text-gray-400">{formatDate(t.created_at)}</p>
                  </div>
                  <p className={`text-[13px] font-bold ${isPositive ? "text-blue-600" : "text-gray-600"}`}>
                    {isPositive ? "+" : ""}{formatMontant(Math.abs(t.montant), devise)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
