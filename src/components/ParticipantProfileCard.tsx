"use client";

import Link from "next/link";
import { Tontine, Membre, User } from "@/types";
import Avatar from "@/components/Avatar";
import { ConfianceBadge } from "@/components/MemberCard";
import { formatMontant, formatDate, getStatutLabel, getStatutColor } from "@/lib/data";
import {
  Crown,
  MapPin,
  ShieldCheck,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDollarSign,
  Calendar,
  ExternalLink,
  ArrowDownRight,
  Target,
  Zap,
  XCircle,
} from "lucide-react";

interface ParticipantProfileCardProps {
  membre: Membre;
  tontine: Tontine;
  expanded?: boolean;
}

export default function ParticipantProfileCard({ membre, tontine, expanded = false }: ParticipantProfileCardProps) {
  const { user } = membre;

  // Paiements de ce membre dans la tontine
  const mesPaiements = tontine.tours.flatMap((t) =>
    t.paiements
      .filter((p) => p.membre.id === user.id || p.membre.email === user.email)
      .map((p) => ({ ...p, tourNumero: t.numero, tourDate: t.datePrevue }))
  );

  const paiementsConfirmes = mesPaiements.filter((p) => p.statut === "confirme");
  const paiementsEnAttente = mesPaiements.filter((p) => p.statut === "en_attente");
  const paiementsEchoues = mesPaiements.filter((p) => p.statut === "echoue");
  const totalPaye = paiementsConfirmes.reduce((acc, p) => acc + p.montant, 0);
  const tauxPonctualite = mesPaiements.length > 0 ? Math.round((paiementsConfirmes.length / mesPaiements.length) * 100) : 0;

  // Est-ce que ce membre a reçu un pot ?
  const toursRecus = tontine.tours.filter(
    (t) => (t.beneficiaire.id === user.id || t.beneficiaire.email === user.email) && t.statut === "complete"
  );
  const tourAVenir = tontine.tours.find(
    (t) => (t.beneficiaire.id === user.id || t.beneficiaire.email === user.email) && t.statut !== "complete"
  );

  const cagnotteParTour = tontine.montantCotisation * Math.max(1, tontine.nombreMembres - 1);
  const totalRecu = toursRecus.length * cagnotteParTour;

  // Position dans l'ordre des tours
  const positionTour = tontine.tours.findIndex(
    (t) => t.beneficiaire.id === user.id || t.beneficiaire.email === user.email
  );

  if (!expanded) {
    // Version compacte pour la liste dans le détail tontine
    return (
      <Link href={`/tontines/${tontine.id}/membre/${membre.id}`} className="block">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group">
          <Avatar user={user} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 truncate">
                {user.prenom} {user.nom}
              </p>
              {user.badgeVerifie && <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
              {membre.role === "organisateur" && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              {user.ville && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {user.ville}
                </span>
              )}
              {user.profession && <span>· {user.profession}</span>}
            </div>
            {/* Micro stats */}
            <div className="flex items-center gap-3 mt-1.5">
              <ConfianceBadge score={user.scoreConfiance ?? 50} />
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                {paiementsConfirmes.length}/{mesPaiements.length} payés
              </span>
              {toursRecus.length > 0 && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                  <ArrowDownRight className="w-3 h-3" />
                  {toursRecus.length} pot{toursRecus.length > 1 ? "s" : ""} reçu{toursRecus.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className={getStatutColor(membre.statut)}>{getStatutLabel(membre.statut)}</span>
            <p className="text-xs text-gray-400 mt-1 group-hover:text-primary-600 transition-colors flex items-center gap-1 justify-end">
              Détails <ExternalLink className="w-3 h-3" />
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // Version étendue pour la page dédiée
  return (
    <div className="space-y-6">
      {/* Header du participant */}
      <div className="card overflow-hidden">
        <div className={`h-20 ${membre.role === "organisateur" ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-primary-500 to-emerald-500"}`}>
          <div className="h-full flex items-center px-6">
            {membre.role === "organisateur" && (
              <div className="flex items-center gap-2 text-white/90">
                <Crown className="w-5 h-5" />
                <span className="text-sm font-semibold">Organisateur</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="-mt-8 flex items-end gap-4 mb-4">
            <div className="ring-4 ring-white rounded-2xl shadow-lg">
              <Avatar user={user} size="xl" />
            </div>
            <div className="pb-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">
                  {user.prenom} {user.nom}
                </h2>
                {user.badgeVerifie && <ShieldCheck className="w-5 h-5 text-blue-500" />}
                <span className={getStatutColor(membre.statut)}>{getStatutLabel(membre.statut)}</span>
              </div>
              <ConfianceBadge score={user.scoreConfiance ?? 50} />
            </div>
          </div>

          {user.bio && <p className="text-sm text-gray-600 mb-4 leading-relaxed">{user.bio}</p>}

          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            {user.ville && (
              <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {user.ville}{user.pays ? `, ${user.pays}` : ""}
              </span>
            )}
            {user.profession && (
              <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                {user.profession}
              </span>
            )}
            {positionTour >= 0 && (
              <span className="flex items-center gap-1.5 bg-primary-50 px-3 py-1.5 rounded-lg text-primary-700">
                <Target className="w-3.5 h-3.5" />
                Tour n°{positionTour + 1}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats dans cette tontine */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{paiementsConfirmes.length}</p>
          <p className="text-xs text-gray-500">Paiements confirmés</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <CircleDollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{formatMontant(totalPaye, tontine.devise)}</p>
          <p className="text-xs text-gray-500">Total cotisé</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <p className={`text-xl font-bold ${tauxPonctualite >= 80 ? "text-green-600" : tauxPonctualite >= 50 ? "text-amber-600" : "text-red-600"}`}>
            {tauxPonctualite}%
          </p>
          <p className="text-xs text-gray-500">Ponctualité</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <ArrowDownRight className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{formatMontant(totalRecu, tontine.devise)}</p>
          <p className="text-xs text-gray-500">Pots reçus</p>
        </div>
      </div>

      {/* Tour du bénéficiaire */}
      {(toursRecus.length > 0 || tourAVenir) && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-600" />
            Tour(s) comme bénéficiaire
          </h3>
          <div className="space-y-3">
            {toursRecus.map((tour) => (
              <div key={tour.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Tour {tour.numero}</p>
                  <p className="text-xs text-gray-500">{formatDate(tour.datePrevue)}</p>
                </div>
                <span className="text-sm font-bold text-green-600">{formatMontant(cagnotteParTour, tontine.devise)}</span>
              </div>
            ))}
            {tourAVenir && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Tour {tourAVenir.numero} (à venir)</p>
                  <p className="text-xs text-gray-500">{formatDate(tourAVenir.datePrevue)}</p>
                </div>
                <span className="text-sm font-medium text-amber-600">{formatMontant(cagnotteParTour, tontine.devise)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historique des paiements */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Historique des cotisations
        </h3>
        {mesPaiements.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune cotisation enregistrée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {mesPaiements.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                {p.statut === "confirme" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : p.statut === "en_attente" ? (
                  <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">Tour {p.tourNumero}</p>
                    <span className={getStatutColor(p.statut)}>{getStatutLabel(p.statut)}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(p.datePaiement)} · {p.methode === "carte" ? "Carte" : p.methode === "virement" ? "Virement" : p.methode}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${p.statut === "confirme" ? "text-green-600" : p.statut === "en_attente" ? "text-amber-600" : "text-red-600"}`}>
                  {formatMontant(p.montant, tontine.devise)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bilan */}
      <div className="card bg-gradient-to-br from-gray-50 to-white">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CircleDollarSign className="w-5 h-5 text-emerald-600" />
          Bilan financier dans cette tontine
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Total cotisé</span>
            <span className="font-semibold text-gray-900">{formatMontant(totalPaye, tontine.devise)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">En attente</span>
            <span className="font-semibold text-amber-600">{paiementsEnAttente.length} cotisation{paiementsEnAttente.length > 1 ? "s" : ""}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Pots reçus</span>
            <span className="font-semibold text-green-600">{formatMontant(totalRecu, tontine.devise)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-700">Solde net</span>
            <span className={`text-lg font-bold ${totalRecu - totalPaye >= 0 ? "text-green-600" : "text-amber-600"}`}>
              {totalRecu - totalPaye >= 0 ? "+" : ""}{formatMontant(totalRecu - totalPaye, tontine.devise)}
            </span>
          </div>
        </div>
      </div>

      {/* Link to full profile */}
      <Link
        href={`/membres/${user.id}`}
        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-sm font-semibold transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Voir le profil public complet
      </Link>
    </div>
  );
}
