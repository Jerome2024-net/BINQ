"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { useTontine } from "@/contexts/TontineContext";
import { formatMontant, getStatutLabel, getStatutColor } from "@/lib/data";
import {
  Users,
  Plus,
  Search,
  CircleDollarSign,
  Calendar,
  ArrowRight,
  Globe,
  Lock,
} from "lucide-react";

const COULEUR_BG: Record<string, string> = {
  emerald: "bg-emerald-100 group-hover:bg-emerald-200",
  blue: "bg-blue-100 group-hover:bg-blue-200",
  purple: "bg-purple-100 group-hover:bg-purple-200",
  orange: "bg-orange-100 group-hover:bg-orange-200",
  rose: "bg-rose-100 group-hover:bg-rose-200",
  cyan: "bg-cyan-100 group-hover:bg-cyan-200",
  amber: "bg-amber-100 group-hover:bg-amber-200",
  indigo: "bg-indigo-100 group-hover:bg-indigo-200",
};

const CATEGORIE_LABELS: Record<string, string> = {
  famille: "👨‍👩‍👧‍👦 Famille",
  amis: "🤝 Amis",
  collegues: "💼 Collègues",
  communaute: "🌍 Communauté",
  autre: "⭐ Autre",
};

export default function TontinesPage() {
  const { getMesTontines, tontines } = useTontine();
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<string>("tous");

  const mesTontines = getMesTontines();
  const allTontines = filtreStatut === "tous_publics" ? tontines : mesTontines;

  const tontinesFiltrees = useMemo(() => {
    return allTontines.filter((t) => {
      const matchRecherche = t.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        t.description.toLowerCase().includes(recherche.toLowerCase());
      const matchStatut = filtreStatut === "tous" || filtreStatut === "tous_publics" || t.statut === filtreStatut;
      return matchRecherche && matchStatut;
    });
  }, [allTontines, recherche, filtreStatut]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Mes Tontines
          </h1>
          <p className="text-gray-500 mt-1">
            {mesTontines.length} tontine(s) au total
          </p>
        </div>
        <Link href="/tontines/creer" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          Créer une Tontine
        </Link>
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
            placeholder="Rechercher une tontine..."
          />
        </div>
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="input-field w-auto min-w-[180px]"
        >
          <option value="tous">Mes tontines (toutes)</option>
          <option value="active">Actives</option>
          <option value="en_attente">En attente</option>
          <option value="terminee">Terminées</option>
          <option value="tous_publics">Toutes les tontines</option>
        </select>
      </div>

      {/* Tontine Cards */}
      {tontinesFiltrees.length === 0 && recherche ? (
        <div className="card text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucune tontine trouvée pour &quot;{recherche}&quot;</p>
          <button onClick={() => setRecherche("")} className="text-primary-600 text-sm mt-2 hover:underline">
            Effacer la recherche
          </button>
        </div>
      ) : tontinesFiltrees.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Vous n&apos;avez pas encore de tontine</p>
          <Link href="/tontines/creer" className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Créer ma première tontine
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tontinesFiltrees.map((tontine) => {
            const tourEnCours = tontine.tours.find((t) => t.statut === "en_cours");
            const toursTermines = tontine.tours.filter((t) => t.statut === "complete").length;
            const totalTours = tontine.nombreMembres;
            const progression = tourEnCours
              ? Math.round(
                  (tourEnCours.paiements.filter((p) => p.statut === "confirme").length /
                    Math.max(1, tontine.nombreMembres - 1)) * 100
                )
              : 0;

            return (
              <Link
                key={tontine.id}
                href={`/tontines/${tontine.id}`}
                className="card group hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors overflow-hidden ${COULEUR_BG[tontine.couleur || "emerald"] || COULEUR_BG.emerald}`}>
                      {tontine.image ? (
                        <Image
                          src={tontine.image}
                          alt={tontine.nom}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{tontine.emoji || "💰"}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {tontine.nom}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Par {tontine.organisateur.prenom} {tontine.organisateur.nom}
                      </p>
                    </div>
                  </div>
                  <span className={getStatutColor(tontine.statut)}>
                    {getStatutLabel(tontine.statut)}
                  </span>
                </div>

                {/* Badges catégorie + visibilité */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tontine.categorie && CATEGORIE_LABELS[tontine.categorie] && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {CATEGORIE_LABELS[tontine.categorie]}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium inline-flex items-center gap-1">
                    {tontine.visibilite === "privee" ? <><Lock className="w-3 h-3" /> Privée</> : <><Globe className="w-3 h-3" /> Publique</>}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {tontine.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <CircleDollarSign className="w-4 h-4" />
                      Cotisation
                    </span>
                    <span className="font-bold text-gray-900">
                      {formatMontant(tontine.montantCotisation, tontine.devise)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Membres
                    </span>
                    <span className="font-bold text-gray-900">
                      {tontine.nombreMembres} / {tontine.membresMax}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Fréquence
                    </span>
                    <span className="font-medium text-gray-900 capitalize">
                      {tontine.frequence}
                    </span>
                  </div>
                </div>

                {tontine.statut === "active" && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">
                        Tours: {toursTermines}/{totalTours}
                      </span>
                      {tourEnCours && (
                        <span className="text-xs font-bold text-primary-600">
                          Tour actuel: {progression}%
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.max(5, (toursTermines / totalTours) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center text-primary-600 text-sm font-medium group-hover:gap-2 transition-all">
                  Voir les détails <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            );
          })}

          {/* Create Card */}
          <Link
            href="/tontines/creer"
            className="card border-2 border-dashed border-gray-300 hover:border-primary-400 flex flex-col items-center justify-center min-h-[300px] group hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
              <Plus className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Créer une nouvelle tontine</h3>
            <p className="text-sm text-gray-500 text-center">
              Lancez une tontine et invitez vos proches
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}
