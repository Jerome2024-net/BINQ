"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFinance } from "@/contexts/FinanceContext";
import { DashboardSkeleton } from "@/components/Skeleton";
import { formatMontant, formatDate } from "@/lib/data";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Minus,
  Send,
  CreditCard,
  PiggyBank,
  LinkIcon,
} from "lucide-react";

interface Epargne {
  id: string;
  nom: string;
  type: string;
  solde: number;
  devise: string;
  objectif_montant: number | null;
  statut: string;
  couleur: string;
  icone: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    wallet,
    getOrCreateWallet,
    getTransactions,
    getFinancialSummary,
    isLoading: financeLoading,
  } = useFinance();

  const [epargnes, setEpargnes] = useState<Epargne[]>([]);
  const [epargneLoading, setEpargneLoading] = useState(true);
  const [showSolde, setShowSolde] = useState(true);

  useEffect(() => {
    if (user) getOrCreateWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Charger les comptes épargne
  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetch("/api/epargne");
        const data = await res.json();
        if (res.ok) setEpargnes(data.epargnes || []);
      } catch {
        /* ignore */
      } finally {
        setEpargneLoading(false);
      }
    };
    charger();
  }, []);

  const soldeWallet = wallet?.solde ?? 0;
  const recentTx = getTransactions({ limit: 5 });
  const summary = getFinancialSummary();

  const totalEpargneEUR = epargnes
    .filter((e) => e.devise !== "USD")
    .reduce((acc, e) => acc + Number(e.solde), 0);
  const totalEpargneUSD = epargnes
    .filter((e) => e.devise === "USD")
    .reduce((acc, e) => acc + Number(e.solde), 0);
  const comptesActifs = epargnes.filter((e) => e.statut === "active");

  const isCredit = (type: string) =>
    ["depot", "remboursement", "transfert_entrant"].includes(type);

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      depot: "Dépôt",
      retrait: "Retrait",
      remboursement: "Remboursement",
      transfert_entrant: "Reçu",
      transfert_sortant: "Envoyé",
    };
    return labels[type] || type;
  };

  if (financeLoading || epargneLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">

      {/* ── 1. Wallet Hero ── */}
      <div className="pt-8 pb-2 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1">
          Bonjour, {user?.prenom || "là"}
        </p>
        <p className="text-xs text-gray-400 mb-5">Solde disponible</p>
        <div className="flex items-center justify-center gap-3">
          <p className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight tabular-nums">
            {showSolde ? formatMontant(soldeWallet) : "••••••"}
          </p>
          <button
            onClick={() => setShowSolde(!showSolde)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            {showSolde ? (
              <EyeOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* ── Actions rapides ── */}
      <div className="grid grid-cols-4 gap-3">
        <Link
          href="/portefeuille"
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          <Send className="w-5 h-5" />
          <span className="text-xs font-semibold">Envoyer</span>
        </Link>
        <Link
          href="/portefeuille"
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          <ArrowDownLeft className="w-5 h-5" />
          <span className="text-xs font-semibold">Recevoir</span>
        </Link>
        <Link
          href="/portefeuille"
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-semibold">Déposer</span>
        </Link>
        <Link
          href="/portefeuille"
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <Minus className="w-5 h-5" />
          <span className="text-xs font-semibold">Retirer</span>
        </Link>
      </div>

      {/* ── 2. Activité récente ── */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Activité récente
          </h2>
          <Link
            href="/transactions"
            className="text-xs font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          >
            Tout voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTx.length === 0 ? (
          <div className="text-center py-14 px-5">
            <p className="text-sm font-medium text-gray-900 mb-1">Aucune activité</p>
            <p className="text-xs text-gray-400">Vos transactions apparaîtront ici</p>
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
                <p className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
                  isCredit(tx.type) ? "text-green-600" : "text-gray-900"
                }`}>
                  {isCredit(tx.type) ? "+" : "-"}{tx.montant.toLocaleString("fr-FR")} €
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. Produits financiers ── */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Vos produits</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <Link href="/portefeuille" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Portefeuille</p>
              <p className="text-xs text-gray-400">Transferts, paiements, liens</p>
            </div>
            <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatMontant(soldeWallet)}</p>
            <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </Link>

          <Link href="/dashboard/epargne" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
              <PiggyBank className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Épargne</p>
              <p className="text-xs text-gray-400">{comptesActifs.length} compte{comptesActifs.length !== 1 ? "s" : ""} actif{comptesActifs.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="text-right">
              {(totalEpargneEUR > 0 || totalEpargneUSD === 0) && (
                <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatMontant(totalEpargneEUR, "EUR")}</p>
              )}
              {totalEpargneUSD > 0 && (
                <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatMontant(totalEpargneUSD, "USD")}</p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </Link>

          <Link href="/dashboard/cagnottes" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
              <LinkIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Cagnottes</p>
              <p className="text-xs text-gray-400">Collectes de groupe</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </Link>

          <Link href="/dashboard/parametres" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Cartes</p>
              <p className="text-xs text-gray-400">Carte virtuelle et physique</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </Link>
        </div>
      </div>

      {/* ── 4. Comptes épargne (aperçu compact) ── */}
      {comptesActifs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Épargne</h2>
            <Link href="/dashboard/epargne" className="text-xs font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
              Gérer <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {comptesActifs.slice(0, 3).map((ep) => {
              const progression = ep.objectif_montant
                ? Math.min(100, Math.round((Number(ep.solde) / ep.objectif_montant) * 100))
                : null;

              return (
                <Link key={ep.id} href="/dashboard/epargne" className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ep.nom}</p>
                    {progression !== null ? (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gray-900" style={{ width: `${progression}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 tabular-nums">{progression}%</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">Épargne libre</p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 tabular-nums whitespace-nowrap">{formatMontant(ep.solde, ep.devise)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. Résumé global ── */}
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
    </div>
  );
}
