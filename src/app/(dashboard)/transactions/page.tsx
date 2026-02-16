"use client";

import { useState, useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatMontant, formatDate } from "@/lib/data";
import { TransactionType } from "@/types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Percent,
  AlertTriangle,
  Search,
  Filter,
  Download,
  BarChart3,
  ArrowUpFromLine,
  ArrowDownToLine,
  Receipt,
  TrendingUp,
  CalendarDays,
  Hash,
  ChevronDown,
  ChevronUp,
  FileText,
  Crown,
} from "lucide-react";

const typeFilters: { value: string; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "depot", label: "Dépôts" },
  { value: "retrait", label: "Retraits" },
  { value: "cotisation", label: "Cotisations" },
  { value: "reception_pot", label: "Pots reçus" },
  { value: "penalite", label: "Pénalités" },
  { value: "commission", label: "Commissions" },
  { value: "abonnement", label: "Abonnements" },
];

export default function TransactionsPage() {
  const { getTransactions, getFinancialSummary, getLedger } = useFinance();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [showLedger, setShowLedger] = useState(false);

  const allTransactions = getTransactions();
  const summary = getFinancialSummary();
  const ledgerEntries = getLedger();

  const filteredTransactions = useMemo(() => {
    let result = allTransactions;

    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.reference.toLowerCase().includes(q) ||
          (t.metadata.tontineNom && t.metadata.tontineNom.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allTransactions, typeFilter, searchQuery]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "depot":
        return <ArrowDownToLine className="w-5 h-5 text-green-600" />;
      case "retrait":
        return <ArrowUpFromLine className="w-5 h-5 text-blue-600" />;
      case "cotisation":
        return <Receipt className="w-5 h-5 text-red-600" />;
      case "reception_pot":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "commission":
        return <Percent className="w-5 h-5 text-amber-600" />;
      case "abonnement":
        return <Crown className="w-5 h-5 text-purple-600" />;
      case "penalite":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <CircleDollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      depot: "Dépôt",
      retrait: "Retrait",
      cotisation: "Cotisation",
      reception_pot: "Pot reçu",
      commission: "Commission",
      abonnement: "Abonnement",
      penalite: "Pénalité",
      remboursement: "Remboursement",
      transfert_entrant: "Transfert reçu",
      transfert_sortant: "Transfert envoyé",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      depot: "bg-green-100 text-green-700",
      retrait: "bg-blue-100 text-blue-700",
      cotisation: "bg-red-100 text-red-700",
      reception_pot: "bg-emerald-100 text-emerald-700",
      commission: "bg-amber-100 text-amber-700",
      abonnement: "bg-purple-100 text-purple-700",
      penalite: "bg-red-100 text-red-700",
      remboursement: "bg-purple-100 text-purple-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const isCredit = (type: string) =>
    ["depot", "reception_pot", "remboursement", "transfert_entrant"].includes(type);

  // Statistiques par type
  const stats = useMemo(() => {
    const totalEntrant = allTransactions
      .filter((t) => isCredit(t.type))
      .reduce((sum, t) => sum + t.montant, 0);
    const totalSortant = allTransactions
      .filter((t) => !isCredit(t.type))
      .reduce((sum, t) => sum + t.montant, 0);
    return { totalEntrant, totalSortant, count: allTransactions.length };
  }, [allTransactions]);

  const exportCSV = () => {
    const headers = "Date,Type,Description,Montant,Référence,Solde Après\n";
    const rows = filteredTransactions
      .map(
        (t) =>
          `"${new Date(t.dateCreation).toLocaleDateString("fr-FR")}","${getTransactionLabel(t.type)}","${t.description}","${isCredit(t.type) ? "+" : "-"}${t.montant}","${t.reference}","${t.soldeApres}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary-600" />
            Transactions
          </h1>
          <p className="text-gray-500 mt-1">Historique complet de vos opérations financières</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLedger(!showLedger)}
            className={`btn-secondary flex items-center gap-2 ${showLedger ? "!bg-primary-50 !text-primary-700 !border-primary-300" : ""}`}
          >
            <FileText className="w-4 h-4" />
            Grand livre
          </button>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total entrant</p>
            <p className="text-xl font-bold text-green-600">{formatMontant(stats.totalEntrant)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total sortant</p>
            <p className="text-xl font-bold text-red-600">{formatMontant(stats.totalSortant)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
            <Hash className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Nb. transactions</p>
            <p className="text-xl font-bold text-gray-900">{stats.count}</p>
          </div>
        </div>
      </div>

      {/* Grand Livre Comptable */}
      {showLedger && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Grand Livre Comptable (Double Entrée)
          </h2>
          {ledgerEntries.length === 0 ? (
            <p className="text-gray-400 text-center py-6">Aucune entrée comptable</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Compte</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Débit</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Crédit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ledgerEntries
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 50)
                    .map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {entry.compte.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-red-600 whitespace-nowrap">
                          {entry.type === "debit" ? formatMontant(entry.montant) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-green-600 whitespace-nowrap">
                          {entry.type === "credit" ? formatMontant(entry.montant) : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Filtres */}
      <div className="card !p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par description, référence, tontine..."
              className="input-field !pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field !w-auto"
            >
              {typeFilters.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des transactions */}
      <div className="card">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune transaction trouvée</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery || typeFilter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Vos transactions apparaîtront ici"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((tx) => (
              <div key={tx.id}>
                <button
                  onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isCredit(tx.type) ? "bg-green-100" : "bg-red-50"
                    }`}
                  >
                    {getTransactionIcon(tx.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(tx.type)}`}>
                        {getTransactionLabel(tx.type)}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(tx.dateCreation)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-bold ${
                        isCredit(tx.type) ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isCredit(tx.type) ? "+" : "-"}
                      {tx.montant.toLocaleString("fr-FR")} €
                    </p>
                    <p className="text-xs text-gray-400">
                      Solde: {tx.soldeApres.toLocaleString("fr-FR")}
                    </p>
                  </div>

                  {expandedTx === tx.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Détails expandés */}
                {expandedTx === tx.id && (
                  <div className="px-4 pb-4 ml-16">
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500">Référence</p>
                          <p className="font-mono font-medium text-gray-900">{tx.reference}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Statut</p>
                          <p className="font-medium">
                            <span
                              className={
                                tx.statut === "confirme"
                                  ? "text-green-600"
                                  : tx.statut === "en_attente"
                                  ? "text-amber-600"
                                  : "text-red-600"
                              }
                            >
                              {tx.statut === "confirme"
                                ? "✅ Confirmé"
                                : tx.statut === "en_attente"
                                ? "⏳ En attente"
                                : "❌ Échoué"}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Solde avant</p>
                          <p className="font-medium text-gray-900">
                            {tx.soldeAvant.toLocaleString("fr-FR")} €
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Solde après</p>
                          <p className="font-medium text-gray-900">
                            {tx.soldeApres.toLocaleString("fr-FR")} €
                          </p>
                        </div>
                        {tx.metadata.tontineNom && (
                          <div>
                            <p className="text-gray-500">Tontine</p>
                            <p className="font-medium text-gray-900">{tx.metadata.tontineNom}</p>
                          </div>
                        )}
                        {tx.metadata.tourNumero && (
                          <div>
                            <p className="text-gray-500">Tour</p>
                            <p className="font-medium text-gray-900">Tour {tx.metadata.tourNumero}</p>
                          </div>
                        )}
                        {tx.metadata.methode && (
                          <div>
                            <p className="text-gray-500">Méthode</p>
                            <p className="font-medium text-gray-900">
                              {tx.metadata.methode === "virement"
                                ? "Virement"
                                : tx.metadata.methode === "carte"
                                ? "Carte"
                                : tx.metadata.methode}
                            </p>
                          </div>
                        )}
                        {tx.metadata.frais !== undefined && tx.metadata.frais > 0 && (
                          <div>
                            <p className="text-gray-500">Frais/Commission</p>
                            <p className="font-medium text-amber-600">
                              {tx.metadata.frais.toLocaleString("fr-FR")} €
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination info */}
        {filteredTransactions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              {filteredTransactions.length} transaction(s) affichée(s)
              {typeFilter !== "all" && ` · Filtre: ${typeFilters.find((f) => f.value === typeFilter)?.label}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
