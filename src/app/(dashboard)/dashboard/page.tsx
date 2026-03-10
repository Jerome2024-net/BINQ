"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { type DeviseCode, DEVISE_LIST, DEVISES, DEFAULT_DEVISE, formatMontant } from "@/lib/currencies";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Wallet,
  SendHorizonal,
  ArrowDownToLine,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  RefreshCw,
  HandCoins,
  QrCode,
  Sparkles,
  TrendingUp,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  montant: number;
  devise: string;
  description: string;
  reference: string;
  statut: string;
  created_at: string;
}

interface Transfer {
  id: string;
  montant: number;
  devise: string;
  message: string | null;
  direction: "sortant" | "entrant";
  expediteur: { prenom: string; nom: string };
  destinataire: { prenom: string; nom: string };
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [showSolde, setShowSolde] = useState(true);
  const [devise, setDevise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("binq_devise") as DeviseCode) || DEFAULT_DEVISE;
    }
    return DEFAULT_DEVISE;
  });
  const [solde, setSolde] = useState(0);
  const [allWallets, setAllWallets] = useState<{ id: string; solde: number; devise: string }[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transferts, setTransferts] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const switchDevise = (d: DeviseCode) => {
    setDevise(d);
    localStorage.setItem("binq_devise", d);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet?devise=${devise}`);
      const data = await res.json();
      if (data.wallet) setSolde(data.wallet.solde || 0);
      if (data.allWallets) setAllWallets(data.allWallets);
      if (data.transactions) setTransactions(data.transactions);
      if (data.transferts) setTransferts(data.transferts);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [devise]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const copyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Merge activity
  const activity = [
    ...transactions.map((t) => ({
      id: t.id,
      type: t.type,
      montant: t.montant,
      label:
        t.type === "depot" ? "Dépôt par carte" :
        t.type === "transfert_sortant" ? "Envoi" :
        t.type === "transfert_entrant" ? "Reçu" :
        t.type === "retrait" ? "Retrait" :
        t.description || t.type,
      description: t.description,
      date: t.created_at,
      isCredit: ["depot", "transfert_entrant"].includes(t.type),
    })),
    ...transferts
      .filter((tr) => !transactions.some((t) => t.reference === tr.id))
      .map((tr) => ({
        id: tr.id,
        type: tr.direction === "sortant" ? "transfert_sortant" : "transfert_entrant",
        montant: tr.montant,
        label: tr.direction === "sortant"
          ? `→ ${tr.destinataire.prenom} ${tr.destinataire.nom}`
          : `← ${tr.expediteur.prenom} ${tr.expediteur.nom}`,
        description: tr.message || "",
        date: tr.created_at,
        isCredit: tr.direction === "entrant",
      })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Wallet className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-600 animate-pulse" />
        </div>
        <p className="text-sm text-gray-700 font-medium">Synchronisation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">

      {/* Greeting */}
      <div>
        <h1 className="text-xl font-black tracking-tight">
          Salut, <span className="text-emerald-600">{user?.prenom || "là"}</span> 👋
        </h1>
        <p className="text-gray-700 text-sm mt-0.5">Votre portefeuille mobile.</p>
      </div>

      {/* ── Balance Card ── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-cyan-500 p-4 sm:p-6 shadow-xl shadow-emerald-500/25">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              {/* Currency Switcher */}
              <div className="flex items-center bg-white/10 rounded-lg overflow-hidden">
                {DEVISE_LIST.map((d) => (
                  <button
                    key={d}
                    onClick={() => switchDevise(d)}
                    className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold transition-all ${
                      devise === d
                        ? "bg-white/30 text-white"
                        : "text-white/60 hover:text-white/80"
                    }`}
                  >
                    {DEVISES[d].flag} {d}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowSolde(!showSolde)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              {showSolde ? <EyeOff className="w-4 h-4 text-white/70" /> : <Eye className="w-4 h-4 text-white/70" />}
            </button>
          </div>

          <div className="mb-4 sm:mb-6">
            <p className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              {showSolde ? formatMontant(solde, devise) : "••••••"}
            </p>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2">
            <Link href="/deposer" className="flex flex-col items-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-all active:scale-95 text-white">
              <ArrowDownToLine className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-[11px] font-bold">Déposer</span>
            </Link>
            <Link href="/envoyer" className="flex flex-col items-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-all active:scale-95 text-white">
              <SendHorizonal className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-[11px] font-bold">Envoyer</span>
            </Link>
            <Link href="/portefeuille" className="flex flex-col items-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-all active:scale-95 text-white">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-[11px] font-bold">Historique</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Services Grid ── */}
      <div>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3 px-1">Services</p>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { icon: ArrowDownToLine, label: "Dépôt", href: "/deposer", gradient: "from-emerald-500 to-emerald-600" },
            { icon: SendHorizonal, label: "Envoi", href: "/envoyer", gradient: "from-cyan-500 to-cyan-600" },
            { icon: HandCoins, label: "Demander", href: "/demander", gradient: "from-violet-500 to-violet-600" },
            { icon: QrCode, label: "QR Code", href: "/qrcode", gradient: "from-orange-500 to-orange-600" },
          ].map((svc, i) => (
            <Link
              key={i}
              href={svc.href}
              className="flex flex-col items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gray-50/50 border border-gray-200/50 hover:bg-gray-100/50 transition-all active:scale-95"
            >
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br ${svc.gradient} flex items-center justify-center shadow-lg`}>
                <svc.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-600">{svc.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Promo Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600/20 to-cyan-600/20 border border-violet-500/10 p-3.5 sm:p-4 flex items-center gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Transferts gratuits</p>
          <p className="text-[11px] text-gray-700">Envoyez de l&apos;argent entre utilisateurs Binq sans frais.</p>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Activité récente</p>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-gray-100/50 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link href="/portefeuille" className="text-[11px] font-bold text-emerald-600 hover:text-emerald-600 flex items-center gap-0.5 transition-colors">
              Tout voir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {activity.length === 0 ? (
          <div className="rounded-2xl bg-gray-50/50 border border-gray-200/50 p-8 text-center">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gray-50/50 flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-5 h-5 sm:w-7 sm:h-7 text-gray-500" />
            </div>
            <p className="text-gray-600 font-bold text-sm mb-1">Aucune activité</p>
            <p className="text-gray-600 text-xs mb-4">Commencez par ajouter de l&apos;argent.</p>
            <Link href="/deposer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 transition-all active:scale-95">
              <ArrowDownToLine className="w-4 h-4" />
              Déposer
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-50/50 border border-gray-200/50 overflow-hidden divide-y divide-gray-100">
            {activity.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors active:bg-gray-50/80">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                  item.isCredit ? "bg-emerald-50" : "bg-gray-50/80"
                }`}>
                  {item.isCredit
                    ? <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                    : <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-600 truncate">{item.label}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <p className={`text-sm font-bold tabular-nums ${item.isCredit ? "text-emerald-600" : "text-gray-700"}`}>
                  {item.isCredit ? "+" : "-"}{formatMontant(item.montant, devise)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
