"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTontine } from "@/contexts/TontineContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { ExplorerSkeleton } from "@/components/Skeleton";
import { formatMontant, getStatutLabel, getStatutColor } from "@/lib/data";
import {
  Users,
  Search,
  CircleDollarSign,
  Calendar,
  ArrowRight,
  Compass,
  UserPlus,
  Loader2,
  CheckCircle2,
  Filter,
  TrendingUp,
  Shield,
} from "lucide-react";

export default function ExplorerPage() {
  const { tontines, rejoindreGroupe, isLoading } = useTontine();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [recherche, setRecherche] = useState("");
  const [filtreFrequence, setFiltreFrequence] = useState<string>("tous");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Tontines disponibles : en_attente ou active, pas encore membre, pas complètes
  const tontinesDisponibles = useMemo(() => {
    return tontines.filter((t) => {
      // Seulement les tontines ouvertes
      const isOuverte = t.statut === "en_attente" || t.statut === "active";
      // Pas encore complet
      const pasFull = t.nombreMembres < t.membresMax;
      // Pas déjà membre
      const dejaMembre = user ? t.membres.some((m) => m.userId === user.id) : false;
      // Pas l'organisateur
      const estOrganisateur = user ? t.organisateurId === user.id : false;

      return isOuverte && pasFull && !dejaMembre && !estOrganisateur;
    });
  }, [tontines, user]);

  // Mes tontines (pour la section "Déjà rejoint")
  const mesTontines = useMemo(() => {
    if (!user) return [];
    return tontines.filter((t) =>
      t.membres.some((m) => m.userId === user.id)
    );
  }, [tontines, user]);

  const tontinesFiltrees = useMemo(() => {
    return tontinesDisponibles.filter((t) => {
      const matchRecherche =
        t.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        t.description.toLowerCase().includes(recherche.toLowerCase());
      const matchFrequence =
        filtreFrequence === "tous" || t.frequence === filtreFrequence;
      return matchRecherche && matchFrequence;
    });
  }, [tontinesDisponibles, recherche, filtreFrequence]);

  const handleRejoindre = async (tontineId: string) => {
    if (!user) {
      showToast("warning", "Connectez-vous pour rejoindre une tontine");
      return;
    }
    setJoiningId(tontineId);
    try {
      const result = await rejoindreGroupe(tontineId);
      if (result.success) {
        showToast("success", "Vous avez rejoint la tontine avec succès !");
      } else {
        showToast("error", result.error || "Erreur lors de l'adhésion");
      }
    } catch {
      showToast("error", "Erreur lors de l'adhésion");
    } finally {
      setJoiningId(null);
    }
  };

  if (isLoading) {
    return <ExplorerSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0zMHY2aC02VjRoNnptMCAxMHY2aC02VjE0aDZ6bTAgMTB2Nmg2djZoLTZWMjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Explorer les Tontines
              </h1>
              <p className="text-blue-200 text-sm mt-1">
                Découvrez et rejoignez des tontines ouvertes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 text-center">
              <p className="text-xl sm:text-2xl font-bold">{tontinesDisponibles.length}</p>
              <p className="text-xs text-blue-200">Disponibles</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 text-center">
              <p className="text-xl sm:text-2xl font-bold">{tontines.length}</p>
              <p className="text-xs text-blue-200">Total</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 text-center">
              <p className="text-xl sm:text-2xl font-bold">{mesTontines.length}</p>
              <p className="text-xs text-blue-200">Mes tontines</p>
            </div>
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
            placeholder="Rechercher une tontine par nom ou description..."
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filtreFrequence}
            onChange={(e) => setFiltreFrequence(e.target.value)}
            className="input-field pl-10 w-full sm:w-auto min-w-[180px]"
          >
            <option value="tous">Toutes les fréquences</option>
            <option value="hebdomadaire">Hebdomadaire</option>
            <option value="bimensuel">Bimensuel</option>
            <option value="mensuel">Mensuel</option>
          </select>
        </div>
      </div>

      {/* Info banner */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800 font-medium">
              Connectez-vous pour rejoindre une tontine
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Vous pouvez parcourir les tontines disponibles, mais vous devez être connecté pour en rejoindre une.
            </p>
          </div>
          <Link
            href="/connexion"
            className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            Se connecter
          </Link>
        </div>
      )}

      {/* Tontines Grid */}
      {tontinesFiltrees.length === 0 && recherche ? (
        <div className="card text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            Aucune tontine trouvée pour &quot;{recherche}&quot;
          </p>
          <button
            onClick={() => setRecherche("")}
            className="text-primary-600 text-sm mt-2 hover:underline"
          >
            Effacer la recherche
          </button>
        </div>
      ) : tontinesFiltrees.length === 0 ? (
        <div className="card text-center py-12">
          <Compass className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            Aucune tontine disponible pour le moment
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Revenez bientôt ou créez votre propre tontine
          </p>
          <Link
            href="/tontines/creer"
            className="btn-primary mt-4 inline-flex items-center gap-2"
          >
            Créer une tontine
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tontinesFiltrees.map((tontine) => {
            const placesRestantes =
              tontine.membresMax - tontine.nombreMembres;
            const pourcentageRemplissage = Math.round(
              (tontine.nombreMembres / tontine.membresMax) * 100
            );

            return (
              <div
                key={tontine.id}
                className="card group hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {tontine.nom}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Par {tontine.organisateur.prenom}{" "}
                        {tontine.organisateur.nom}
                      </p>
                    </div>
                  </div>
                  <span className={getStatutColor(tontine.statut)}>
                    {getStatutLabel(tontine.statut)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {tontine.description || "Aucune description"}
                </p>

                {/* Détails */}
                <div className="space-y-3 mb-4 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <CircleDollarSign className="w-4 h-4" />
                      Cotisation
                    </span>
                    <span className="font-bold text-gray-900">
                      {formatMontant(
                        tontine.montantCotisation,
                        tontine.devise
                      )}
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
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Pot total
                    </span>
                    <span className="font-bold text-primary-600">
                      {formatMontant(
                        tontine.montantCotisation *
                          (tontine.membresMax - 1),
                        tontine.devise
                      )}
                    </span>
                  </div>
                </div>

                {/* Barre de remplissage */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500">
                      {placesRestantes} place{placesRestantes > 1 ? "s" : ""}{" "}
                      restante{placesRestantes > 1 ? "s" : ""}
                    </span>
                    <span className="text-xs font-bold text-primary-600">
                      {pourcentageRemplissage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-indigo-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.max(5, pourcentageRemplissage)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Link
                    href={`/tontines/${tontine.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Détails
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleRejoindre(tontine.id)}
                    disabled={joiningId === tontine.id || !user}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:from-primary-700 hover:to-indigo-700 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {joiningId === tontine.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        En cours...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Rejoindre
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section : Mes tontines rejointes */}
      {user && mesTontines.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Mes tontines ({mesTontines.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mesTontines.slice(0, 6).map((tontine) => (
              <Link
                key={tontine.id}
                href={`/tontines/${tontine.id}`}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                    {tontine.nom}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tontine.nombreMembres}/{tontine.membresMax} membres ·{" "}
                    {formatMontant(tontine.montantCotisation, tontine.devise)}
                  </p>
                </div>
                <span className={`${getStatutColor(tontine.statut)} text-xs`}>
                  {getStatutLabel(tontine.statut)}
                </span>
              </Link>
            ))}
          </div>
          {mesTontines.length > 6 && (
            <Link
              href="/tontines"
              className="flex items-center gap-2 justify-center mt-4 text-primary-600 font-medium text-sm hover:underline"
            >
              Voir toutes mes tontines
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
