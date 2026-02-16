"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTontine } from "@/contexts/TontineContext";
import Avatar from "@/components/Avatar";
import { ConfianceBadge } from "@/components/MemberCard";
import { formatMontant, formatDate } from "@/lib/data";
import { User } from "@/types";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  ShieldCheck,
  Users,
  CircleDollarSign,
  Crown,
  TrendingUp,
  CheckCircle2,
  Mail,
  Phone,
  Lock,
  Star,
  ArrowRight,
  Ban,
  AlertTriangle,
} from "lucide-react";

export default function MembreProfilPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { user: currentUser, getUserById } = useAuth();
  const { tontines } = useTontine();

  const [membre, setMembre] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    // Si c'est son propre profil, utiliser directement currentUser
    if (isOwnProfile && currentUser) {
      setMembre(currentUser);
      setLoading(false);
      return;
    }

    // Si currentUser n'est pas encore chargé, attendre
    if (!currentUser) return;

    let cancelled = false;
    const load = async () => {
      try {
        const u = await getUserById(id);
        if (!cancelled) {
          setMembre(u ?? null);
          setLoading(false);
        }
      } catch (e) {
        console.error("Erreur chargement profil:", e);
        if (!cancelled) {
          setMembre(null);
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!membre) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
        <div className="card text-center py-16">
          <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Membre introuvable</h2>
          <p className="text-gray-500">Ce profil n&apos;existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }

  // Vérifier si le profil est public ou si c'est le sien
  if (!membre.profilPublic && !isOwnProfile) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
        <div className="card text-center py-16">
          <Lock className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profil privé</h2>
          <p className="text-gray-500">
            {membre.prenom} a choisi de garder son profil privé.
          </p>
        </div>
      </div>
    );
  }

  // ==============================
  // STATS CALCULÉES DYNAMIQUEMENT
  // ==============================

  // Tontines du membre (visibles)
  const tontinesDuMembre = tontines.filter((t) =>
    t.membres.some((m) => m.user.id === membre.id || m.user.email === membre.email)
  );

  // Tontines en commun avec l'utilisateur courant
  const tontinesEnCommun = tontines.filter((t) => {
    const membrePresent = t.membres.some(
      (m) => m.user.id === membre.id || m.user.email === membre.email
    );
    const moiPresent = t.membres.some(
      (m) => m.user.id === currentUser?.id || m.user.email === currentUser?.email
    );
    return membrePresent && moiPresent;
  });

  // Nombre réel de tontines rejointes
  const realTontinesParticipees = tontinesDuMembre.length;

  // Nombre réel de tontines organisées
  const realTontinesOrganisees = tontinesDuMembre.filter(
    (t) => t.organisateur.id === membre.id || t.organisateur.email === membre.email
  ).length;

  // Cotisations payées (confirmées) par ce membre
  const realCotisationsPayees = tontinesDuMembre.reduce((total, t) => {
    return total + t.tours.reduce((tourTotal, tour) => {
      return tourTotal + tour.paiements.filter(
        (p) => (p.membreId === membre.id || p.membre.id === membre.id) && p.statut === "confirme"
      ).length;
    }, 0);
  }, 0);

  // Pots reçus (tours complétés où ce membre est bénéficiaire)
  const realToursRecus = tontinesDuMembre.reduce((total, t) => {
    return total + t.tours.filter(
      (tour) => (tour.beneficiaireId === membre.id || tour.beneficiaire.id === membre.id) && tour.statut === "complete"
    ).length;
  }, 0);

  // Cotisations totales attendues (tous les tours passés/en cours dans les tontines du membre)
  const totalCotisationsAttendues = tontinesDuMembre.reduce((total, t) => {
    return total + t.tours.filter(
      (tour) => tour.statut === "complete" || tour.statut === "en_cours" || tour.statut === "en_retard"
    ).length;
  }, 0);

  // Taux de paiement (%)
  const tauxPaiement = totalCotisationsAttendues > 0
    ? Math.round((realCotisationsPayees / totalCotisationsAttendues) * 100)
    : 100; // Nouveau membre = 100% par défaut

  // Ancienneté
  const memberSince = membre.dateInscription
    ? new Date(membre.dateInscription)
    : new Date();
  const diffMs = Date.now() - memberSince.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  const ancienneteLabel = diffYears >= 1
    ? `${diffYears} an${diffYears > 1 ? "s" : ""}${diffMonths % 12 > 0 ? ` ${diffMonths % 12} mois` : ""}`
    : diffMonths >= 1
    ? `${diffMonths} mois`
    : diffDays >= 1
    ? `${diffDays} jour${diffDays > 1 ? "s" : ""}`
    : "Aujourd'hui";

  // Score de confiance RÉEL (calculé dynamiquement)
  // Formule : 
  //   - Base 30 pts pour l'inscription
  //   - +20 pts si ancienneté > 3 mois, +10 si > 1 mois
  //   - +30 pts basé sur le taux de paiement
  //   - +10 pts si au moins 2 tontines
  //   - +10 pts si au moins 1 pot reçu
  //   - -20 pts si défaillant
  const computeRealScore = () => {
    let score = 30; // Base inscription

    // Ancienneté
    if (diffMonths >= 6) score += 20;
    else if (diffMonths >= 3) score += 15;
    else if (diffMonths >= 1) score += 10;

    // Taux de paiement (0-30 pts)
    if (totalCotisationsAttendues > 0) {
      score += Math.round((tauxPaiement / 100) * 30);
    } else if (realTontinesParticipees > 0) {
      // Participe mais aucun tour passé encore
      score += 15;
    }

    // Engagement (nombre de tontines)
    if (realTontinesParticipees >= 3) score += 10;
    else if (realTontinesParticipees >= 1) score += 5;

    // Pots reçus (a déjà été bénéficiaire)
    if (realToursRecus >= 3) score += 10;
    else if (realToursRecus >= 1) score += 5;

    // Pénalité défaillant
    if (membre.estDefaillant) score -= 20;

    return Math.max(0, Math.min(100, score));
  };

  const realScore = computeRealScore();

  // Ponctualité label
  const ponctualiteLabel = totalCotisationsAttendues === 0
    ? "Pas encore de données"
    : tauxPaiement >= 95
    ? "Excellent"
    : tauxPaiement >= 80
    ? "Très bon"
    : tauxPaiement >= 60
    ? "En progression"
    : "À améliorer";

  const ponctualiteColor = totalCotisationsAttendues === 0
    ? "text-gray-400"
    : tauxPaiement >= 95
    ? "text-green-600"
    : tauxPaiement >= 80
    ? "text-blue-600"
    : tauxPaiement >= 60
    ? "text-amber-600"
    : "text-red-600";

  // Score confiance description
  const getConfianceDescription = (score: number) => {
    if (totalCotisationsAttendues === 0 && realTontinesParticipees === 0)
      return "Nouveau membre, pas encore d'activité sur la plateforme.";
    if (score >= 90) return "Ce membre est très ponctuel dans ses paiements et très fiable.";
    if (score >= 70) return "Ce membre respecte généralement ses engagements.";
    if (score >= 50) return "Ce membre construit progressivement sa réputation.";
    return "Ce membre a besoin d'améliorer sa fiabilité.";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        {/* Profile Header */}
        <div className="card overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-primary-600 to-indigo-600 -mx-6 -mt-6 mb-0 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTJ2LTZoMnptMC0xOHY2aC0yVjE2aDJ6bTAtMTh2Nmgtdi02aDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
          </div>

          <div className="px-2 sm:px-4">
            {/* Avatar + Name */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 relative z-10">
              <div className="ring-4 ring-white rounded-2xl shadow-lg">
                <Avatar user={membre} size="xl" />
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {membre.prenom} {membre.nom}
                  </h1>
                  {membre.badgeVerifie && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Vérifié
                    </span>
                  )}
                  {membre.estDefaillant && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      <Ban className="w-3.5 h-3.5" />
                      Défaillant
                    </span>
                  )}
                  {isOwnProfile && (
                    <Link
                      href="/dashboard/profil"
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium ml-2"
                    >
                      Modifier →
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 flex-wrap">
                  {membre.ville && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {membre.ville}{membre.pays ? `, ${membre.pays}` : ""}
                    </span>
                  )}
                  {membre.profession && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {membre.profession}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Membre depuis {formatDate(membre.dateInscription)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {membre.bio && (
              <p className="text-gray-600 mt-4 text-sm leading-relaxed border-l-2 border-primary-200 pl-4">
                {membre.bio}
              </p>
            )}
          </div>
        </div>

        {/* Alerte défaillant */}
        {membre.estDefaillant && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-800 mb-1">⚠️ Membre défaillant</h3>
                <p className="text-sm text-red-700 mb-3">
                  Ce membre a été signalé comme défaillant pour non-paiement de cotisation.
                  Son score de confiance a été réduit.
                </p>
                {membre.defaillances && membre.defaillances.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Historique des défaillances</p>
                    {membre.defaillances.map((def) => (
                      <div key={def.id} className="bg-white/70 rounded-lg px-3 py-2 text-sm border border-red-100">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-red-800">{def.tontineNom}</span>
                          <span className="text-xs text-red-500">{formatDate(def.date)}</span>
                        </div>
                        <p className="text-xs text-red-600 mt-0.5">
                          Tour {def.tourNumero} · {formatMontant(def.montantDu, def.devise)} non payé
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card text-center py-5">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {realTontinesParticipees}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Tontines rejointes</p>
          </div>

          <div className="card text-center py-5">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {realTontinesOrganisees}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Tontines organisées</p>
          </div>

          <div className="card text-center py-5">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {realCotisationsPayees}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Cotisations payées</p>
          </div>

          <div className="card text-center py-5">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CircleDollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {realToursRecus}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Pots reçus</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Confiance */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Score de confiance
            </h2>

            <div className="text-center mb-4">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={
                      realScore >= 90
                        ? "#16a34a"
                        : realScore >= 70
                        ? "#2563eb"
                        : realScore >= 50
                        ? "#d97706"
                        : "#9ca3af"
                    }
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(realScore / 100) * 352} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">
                    {realScore}
                  </span>
                  <span className="text-xs text-gray-500">/ 100</span>
                </div>
              </div>
            </div>

            <ConfianceBadge score={realScore} />
            <p className="text-sm text-gray-500 mt-3">
              {getConfianceDescription(realScore)}
            </p>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ancienneté</span>
                <span className="font-medium text-gray-900">{ancienneteLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ponctualité</span>
                <span className={`font-medium ${ponctualiteColor}`}>
                  {ponctualiteLabel}
                </span>
              </div>
              {totalCotisationsAttendues > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taux paiement</span>
                  <span className={`font-medium ${tauxPaiement >= 80 ? "text-green-600" : tauxPaiement >= 60 ? "text-amber-600" : "text-red-600"}`}>
                    {tauxPaiement}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tontines */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tontines en commun */}
            {currentUser && !isOwnProfile && tontinesEnCommun.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                  Tontines en commun ({tontinesEnCommun.length})
                </h2>
                <div className="space-y-3">
                  {tontinesEnCommun.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tontines/${t.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-primary-50/50 hover:bg-primary-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {t.nom}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t.nombreMembres} membres · {formatMontant(t.montantCotisation, t.devise)}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Toutes les tontines du membre */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                {isOwnProfile ? "Mes tontines" : `Tontines de ${membre.prenom}`} ({tontinesDuMembre.length})
              </h2>

              {tontinesDuMembre.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  {isOwnProfile
                    ? "Vous n'avez rejoint aucune tontine pour le moment."
                    : `${membre.prenom} n'a pas encore rejoint de tontine.`}
                </p>
              ) : (
                <div className="space-y-3">
                  {tontinesDuMembre.map((t) => {
                    const isOrga =
                      t.organisateur.id === membre.id ||
                      t.organisateur.email === membre.email;
                    return (
                      <Link
                        key={t.id}
                        href={`/tontines/${t.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {t.nom}
                            </p>
                            {isOrga && (
                              <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {t.nombreMembres} membres · {t.frequence} ·{" "}
                            {formatMontant(t.montantCotisation, t.devise)}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            t.statut === "active"
                              ? "bg-green-50 text-green-600"
                              : t.statut === "en_attente"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {t.statut === "active"
                            ? "Active"
                            : t.statut === "en_attente"
                            ? "En attente"
                            : "Terminée"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Contact (seulement si on voit un autre profil) */}
            {!isOwnProfile && (
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary-600" />
                  Contact
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{membre.email}</span>
                  </div>
                  {membre.telephone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{membre.telephone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
