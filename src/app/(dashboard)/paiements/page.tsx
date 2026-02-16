"use client";

import { useState, useMemo } from "react";
import { useTontine } from "@/contexts/TontineContext";
import { useToast } from "@/contexts/ToastContext";
import {
  CircleDollarSign,
  CheckCircle2,
  Clock,
  Search,
  Building,
  CreditCard,
  Download,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { formatMontant, formatDate, getStatutLabel, getStatutColor } from "@/lib/data";

function getMethodeIcon(methode: string) {
  switch (methode) {
    case "virement":
      return <Building className="w-4 h-4" />;
    case "carte":
      return <CreditCard className="w-4 h-4" />;
    default:
      return <CircleDollarSign className="w-4 h-4" />;
  }
}

function getMethodeLabel(methode: string) {
  const labels: Record<string, string> = {
    virement: "Virement bancaire",
    carte: "Carte bancaire",
  };
  return labels[methode] || methode;
}

export default function PaiementsPage() {
  const { getMesTontines } = useTontine();
  const { showToast } = useToast();
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<string>("tous");

  const mesTontines = getMesTontines();

  const allPaiements = useMemo(() => {
    return mesTontines.flatMap((t) =>
      t.tours.flatMap((tour) =>
        tour.paiements.map((p) => ({
          ...p,
          tontine: t,
          tour,
        }))
      )
    );
  }, [mesTontines]);

  const paiementsFiltres = useMemo(() => {
    return allPaiements.filter((p) => {
      const matchRecherche =
        !recherche ||
        `${p.membre.prenom} ${p.membre.nom}`.toLowerCase().includes(recherche.toLowerCase()) ||
        p.tontine.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        (p.reference && p.reference.toLowerCase().includes(recherche.toLowerCase()));
      const matchStatut = filtreStatut === "tous" || p.statut === filtreStatut;
      return matchRecherche && matchStatut;
    });
  }, [allPaiements, recherche, filtreStatut]);

  const confirmes = allPaiements.filter((p) => p.statut === "confirme");
  const enAttente = allPaiements.filter((p) => p.statut === "en_attente");
  const totalConfirme = confirmes.reduce((acc, p) => acc + p.montant, 0);
  const totalEnAttente = enAttente.reduce((acc, p) => acc + p.montant, 0);

  const handleExport = () => {
    const csv = [
      "Membre,Tontine,Tour,Montant,Devise,Méthode,Date,Statut,Référence",
      ...paiementsFiltres.map((p) =>
        [
          `${p.membre.prenom} ${p.membre.nom}`,
          p.tontine.nom,
          `Tour ${p.tour.numero}`,
          p.montant,
          p.tontine.devise,
          getMethodeLabel(p.methode),
          p.datePaiement || "",
          getStatutLabel(p.statut),
          p.reference || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paiements_tontine_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Export réussi", "Le fichier CSV a été téléchargé");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Paiements</h1>
          <p className="text-gray-500 mt-1">Suivi complet de tous vos paiements de cotisation</p>
        </div>
        <button onClick={handleExport} className="btn-primary flex items-center gap-2 w-fit">
          <Download className="w-5 h-5" />
          Exporter CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Confirmés</p>
            <p className="text-xl font-bold text-gray-900">{formatMontant(totalConfirme)}</p>
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> {confirmes.length} paiements
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">En attente</p>
            <p className="text-xl font-bold text-gray-900">{formatMontant(totalEnAttente)}</p>
            <p className="text-xs text-amber-600 font-medium">{enAttente.length} paiements</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{formatMontant(totalConfirme + totalEnAttente)}</p>
            <p className="text-xs text-blue-600 font-medium">{allPaiements.length} transactions</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="input-field pl-12"
            placeholder="Rechercher par nom, tontine, référence..."
          />
        </div>
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="input-field w-auto min-w-[160px]"
        >
          <option value="tous">Tous les statuts</option>
          <option value="confirme">Confirmés</option>
          <option value="en_attente">En attente</option>
        </select>
      </div>

      {/* Payments Table */}
      {paiementsFiltres.length === 0 ? (
        <div className="card text-center py-12">
          <CircleDollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {recherche ? "Aucun paiement trouvé" : "Aucun paiement pour le moment"}
          </p>
          {recherche && (
            <button onClick={() => setRecherche("")} className="text-primary-600 text-sm mt-2 hover:underline">
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Membre</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tontine</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Méthode</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Référence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paiementsFiltres.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-xs">{p.membre.prenom[0]}{p.membre.nom[0]}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{p.membre.prenom} {p.membre.nom}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{p.tontine.nom}</p>
                      <p className="text-xs text-gray-400">Tour {p.tour.numero}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">{formatMontant(p.montant, p.tontine.devise)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {getMethodeIcon(p.methode)}
                        {getMethodeLabel(p.methode)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{p.datePaiement ? formatDate(p.datePaiement) : "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatutColor(p.statut)}>{getStatutLabel(p.statut)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 font-mono">{p.reference || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
