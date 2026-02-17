"use client";

import { useState } from "react";
import Image from "next/image";
import { Tontine } from "@/types";
import Avatar from "@/components/Avatar";
import { AvatarGroup } from "@/components/Avatar";
import { ConfianceBadge } from "@/components/MemberCard";
import TontineImageUpload from "@/components/TontineImageUpload";
import { formatMontant, formatDate, getStatutLabel, getStatutColor } from "@/lib/data";
import {
  Users,
  CircleDollarSign,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  Star,
  BarChart3,
  Target,
  Wallet,
  ArrowUpRight,
  Repeat,
  Globe,
  Info,
  XCircle,
  Lock,
  Tag,
} from "lucide-react";

// Couleur → gradient classes
const COULEUR_GRADIENTS: Record<string, string> = {
  emerald: "from-emerald-500 via-emerald-600 to-teal-700",
  blue: "from-blue-500 via-blue-600 to-indigo-700",
  purple: "from-purple-500 via-purple-600 to-violet-700",
  orange: "from-orange-500 via-orange-600 to-red-600",
  rose: "from-rose-500 via-rose-600 to-pink-700",
  cyan: "from-cyan-500 via-cyan-600 to-teal-600",
  amber: "from-amber-500 via-amber-600 to-yellow-700",
  indigo: "from-indigo-500 via-indigo-600 to-blue-700",
};

const CATEGORIE_LABELS: Record<string, { label: string; emoji: string }> = {
  famille: { label: "Famille", emoji: "👨‍👩‍👧‍👦" },
  amis: { label: "Amis", emoji: "🤝" },
  collegues: { label: "Collègues", emoji: "💼" },
  communaute: { label: "Communauté", emoji: "🌍" },
  autre: { label: "Autre", emoji: "⭐" },
};

interface TontineProfileCardProps {
  tontine: Tontine;
  isOrganisateur?: boolean;
}

export default function TontineProfileCard({ tontine, isOrganisateur = false }: TontineProfileCardProps) {
  const [tontineImage, setTontineImage] = useState(tontine.image || "");
  // Calculs financiers
  const cagnotteParTour = tontine.montantCotisation * Math.max(1, tontine.nombreMembres - 1);
  const totalPaiements = tontine.tours
    .flatMap((t) => t.paiements)
    .filter((p) => p.statut === "confirme")
    .reduce((acc, p) => acc + p.montant, 0);
  const toursCompletes = tontine.tours.filter((t) => t.statut === "complete").length;
  const toursTotal = tontine.tours.length;
  const montantTotalDistribue = toursCompletes * cagnotteParTour;
  const montantTotalPrevu = toursTotal * cagnotteParTour;

  // Confiance moyenne
  const scores = tontine.membres.map((m) => m.user.scoreConfiance ?? 50);
  const scoreMoyen = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50;

  // Taux de paiement
  const totalPaiementsAttendus = tontine.tours.reduce((acc, t) => acc + t.paiements.length, 0);
  const totalPaiementsConfirmes = tontine.tours.reduce(
    (acc, t) => acc + t.paiements.filter((p) => p.statut === "confirme").length,
    0
  );
  const tauxPaiement = totalPaiementsAttendus > 0 ? Math.round((totalPaiementsConfirmes / totalPaiementsAttendus) * 100) : 0;

  // Membres vérifiés
  const membresVerifies = tontine.membres.filter((m) => m.user.badgeVerifie).length;

  // Progression
  const progressionTours = toursTotal > 0 ? Math.round((toursCompletes / toursTotal) * 100) : 0;

  // Fréquences label
  const frequenceLabels: Record<string, string> = {
    hebdomadaire: "Hebdomadaire",
    mensuel: "Mensuelle",
    bimensuel: "Bimensuelle",
    trimestriel: "Trimestrielle",
  };

  return (
    <div className="space-y-6">
      {/* Banner / Identity */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${
        tontine.statut === "annulee"
          ? "from-red-600 via-red-700 to-red-800"
          : COULEUR_GRADIENTS[tontine.couleur || "emerald"] || COULEUR_GRADIENTS.emerald
      }`}>
        {/* Pattern de fond */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
        </div>

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Emoji / Avatar Tontine */}
            <div className="w-20 h-20 rounded-2xl flex-shrink-0 relative group">
              {tontineImage ? (
                <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-white/30">
                  <Image
                    src={tontineImage}
                    alt={tontine.nom}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">{tontine.emoji || "💰"}</span>
                </div>
              )}
              {isOrganisateur && (
                <TontineImageUpload
                  tontineId={tontine.id}
                  currentImage={tontineImage}
                  currentEmoji={tontine.emoji}
                  onUploadComplete={(url) => setTontineImage(url)}
                />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{tontine.nom}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  tontine.statut === "active"
                    ? "bg-green-400/20 text-green-100 border border-green-400/30"
                    : tontine.statut === "en_attente"
                    ? "bg-amber-400/20 text-amber-100 border border-amber-400/30"
                    : tontine.statut === "annulee"
                    ? "bg-red-400/20 text-red-100 border border-red-400/30"
                    : "bg-gray-400/20 text-gray-100 border border-gray-400/30"
                }`}>
                  {tontine.statut === "annulee" && <XCircle className="w-3 h-3 inline mr-1" />}
                  {getStatutLabel(tontine.statut)}
                </span>
              </div>

              <p className="text-white/80 text-sm md:text-base max-w-xl mb-3">{tontine.description}</p>

              {/* Badges catégorie + visibilité */}
              <div className="flex flex-wrap gap-2 mb-4">
                {tontine.categorie && CATEGORIE_LABELS[tontine.categorie] && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white text-xs font-medium">
                    <span>{CATEGORIE_LABELS[tontine.categorie].emoji}</span>
                    {CATEGORIE_LABELS[tontine.categorie].label}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white text-xs font-medium">
                  {tontine.visibilite === "privee" ? (
                    <><Lock className="w-3 h-3" /> Privée</>
                  ) : (
                    <><Globe className="w-3 h-3" /> Publique</>
                  )}
                </span>
              </div>

              {/* Quick Info Row */}
              <div className="flex flex-wrap gap-4 text-white/70 text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Créée le {formatDate(tontine.dateDebut)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Repeat className="w-4 h-4" />
                  {frequenceLabels[tontine.frequence] || tontine.frequence}
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  {tontine.devise}
                </span>
              </div>
            </div>

            {/* AvatarGroup */}
            <div className="flex-shrink-0 text-center">
              <AvatarGroup users={tontine.membres.map((m) => m.user)} max={5} size="sm" />
              <p className="text-white/60 text-xs mt-2">{tontine.nombreMembres} membre{tontine.nombreMembres > 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CircleDollarSign className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatMontant(tontine.montantCotisation, tontine.devise)}</p>
          <p className="text-xs text-gray-500 mt-1">Cotisation / tour</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatMontant(cagnotteParTour, tontine.devise)}</p>
          <p className="text-xs text-gray-500 mt-1">Cagnotte / tour</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{tontine.nombreMembres}<span className="text-sm font-normal text-gray-400">/{tontine.membresMax}</span></p>
          <p className="text-xs text-gray-500 mt-1">Membres</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{toursCompletes}<span className="text-sm font-normal text-gray-400">/{toursTotal}</span></p>
          <p className="text-xs text-gray-500 mt-1">Tours complétés</p>
        </div>
      </div>

      {/* Santé financière & Indicateurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Santé financière */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            Santé financière
          </h3>

          <div className="space-y-4">
            {/* Total collecté */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Total collecté</span>
                <span className="text-sm font-semibold text-gray-900">{formatMontant(totalPaiements, tontine.devise)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${montantTotalPrevu > 0 ? Math.min(100, (totalPaiements / montantTotalPrevu) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Distribué */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Distribué aux bénéficiaires</span>
                <span className="text-sm font-semibold text-green-600">{formatMontant(montantTotalDistribue, tontine.devise)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${montantTotalPrevu > 0 ? Math.min(100, (montantTotalDistribue / montantTotalPrevu) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Progression tours */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Progression des tours</span>
                <span className="text-sm font-semibold text-primary-600">{progressionTours}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progressionTours}%` }} />
              </div>
            </div>

            {/* Montant total prévu */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Montant total prévu</span>
                <span className="font-bold text-gray-900">{formatMontant(montantTotalPrevu, tontine.devise)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateurs de confiance */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Indicateurs de confiance
          </h3>

          <div className="space-y-5">
            {/* Score confiance moyen */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={scoreMoyen >= 70 ? "#10b981" : scoreMoyen >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="3"
                    strokeDasharray={`${scoreMoyen}, 100`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900">{scoreMoyen}%</span>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Score de confiance moyen</p>
                <p className="text-sm text-gray-500">Basé sur {tontine.nombreMembres} membres</p>
              </div>
            </div>

            {/* Taux de paiement */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{tauxPaiement}%</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Taux de paiement</p>
                <p className="text-sm text-gray-500">{totalPaiementsConfirmes}/{totalPaiementsAttendus} paiements confirmés</p>
              </div>
            </div>

            {/* Membres vérifiés */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{membresVerifies}</p>
                  <p className="text-xs text-blue-400">/{tontine.nombreMembres}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Membres vérifiés</p>
                <p className="text-sm text-gray-500">Profils avec badge de vérification</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Règles de la tontine */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-amber-500" />
          Règles de la tontine
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <CircleDollarSign className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Montant de cotisation</p>
              <p className="text-sm text-gray-500">{formatMontant(tontine.montantCotisation, tontine.devise)} par {frequenceLabels[tontine.frequence]?.toLowerCase() || tontine.frequence}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Nombre de participants</p>
              <p className="text-sm text-gray-500">{tontine.membresMax} membres maximum</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <Repeat className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Fréquence de cotisation</p>
              <p className="text-sm text-gray-500">{frequenceLabels[tontine.frequence] || tontine.frequence}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <Target className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Cagnotte par tour</p>
              <p className="text-sm text-gray-500">{formatMontant(cagnotteParTour, tontine.devise)} distribués au bénéficiaire</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <Calendar className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Durée estimée</p>
              <p className="text-sm text-gray-500">{tontine.membresMax} tours ({tontine.frequence === "mensuel" ? tontine.membresMax + " mois" : tontine.frequence === "hebdomadaire" ? tontine.membresMax + " semaines" : tontine.membresMax + " périodes"})</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <ArrowUpRight className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Montant total du cycle</p>
              <p className="text-sm text-gray-500">{formatMontant(montantTotalPrevu, tontine.devise)} sur l&apos;ensemble des tours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
