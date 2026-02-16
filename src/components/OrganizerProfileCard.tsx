"use client";

import Link from "next/link";
import { User, Tontine } from "@/types";
import Avatar from "@/components/Avatar";
import { ConfianceBadge } from "@/components/MemberCard";
import { formatDate } from "@/lib/data";
import {
  Crown,
  MapPin,
  ShieldCheck,
  Briefcase,
  Users,
  TrendingUp,
  Calendar,
  Star,
  ExternalLink,
  CheckCircle2,
  Award,
} from "lucide-react";

interface OrganizerProfileCardProps {
  organisateur: User;
  tontine: Tontine;
}

export default function OrganizerProfileCard({ organisateur, tontine }: OrganizerProfileCardProps) {
  // Stats de l'organisateur dans cette tontine
  const toursCompletes = tontine.tours.filter((t) => t.statut === "complete").length;
  const toursTotal = tontine.tours.length;
  const totalPaiements = tontine.tours
    .flatMap((t) => t.paiements)
    .filter((p) => p.statut === "confirme").length;
  const totalPaiementsAttendus = tontine.tours.flatMap((t) => t.paiements).length;
  const tauxReussite = totalPaiementsAttendus > 0 ? Math.round((totalPaiements / totalPaiementsAttendus) * 100) : 0;

  return (
    <div className="card overflow-hidden">
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
        </div>
        <div className="absolute top-3 left-4 flex items-center gap-2">
          <Crown className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold text-white/90">Organisateur</span>
        </div>
      </div>

      {/* Avatar offset */}
      <div className="relative px-6 pb-6">
        <div className="-mt-10 mb-4 flex items-end gap-4">
          <div className="ring-4 ring-white rounded-2xl shadow-lg">
            <Avatar user={organisateur} size="xl" />
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900">
                {organisateur.prenom} {organisateur.nom}
              </h3>
              {organisateur.badgeVerifie && (
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <ConfianceBadge score={organisateur.scoreConfiance ?? 50} />
          </div>
        </div>

        {/* Bio */}
        {organisateur.bio && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{organisateur.bio}</p>
        )}

        {/* Info row */}
        <div className="flex flex-wrap gap-3 mb-5 text-sm text-gray-500">
          {organisateur.ville && (
            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {organisateur.ville}{organisateur.pays ? `, ${organisateur.pays}` : ""}
            </span>
          )}
          {organisateur.profession && (
            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
              <Briefcase className="w-3.5 h-3.5 text-gray-400" />
              {organisateur.profession}
            </span>
          )}
          <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            Inscrit le {formatDate(organisateur.dateInscription)}
          </span>
        </div>

        {/* Stats de l'organisateur */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-amber-700">{organisateur.nombreTontinesOrganisees ?? 0}</p>
            <p className="text-xs text-amber-600">Tontines organisées</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-700">{organisateur.nombreTontinesParticipees ?? 0}</p>
            <p className="text-xs text-green-600">Tontines rejointes</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-blue-700">{organisateur.nombreToursRecus ?? 0}</p>
            <p className="text-xs text-blue-600">Tours reçus</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-purple-700">{organisateur.totalCotisationsPayees ?? 0}</p>
            <p className="text-xs text-purple-600">Cotisations payées</p>
          </div>
        </div>

        {/* Performance dans cette tontine */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Performance dans &quot;{tontine.nom}&quot;
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-base font-bold text-gray-900">{toursCompletes}/{toursTotal}</p>
              <p className="text-xs text-gray-500">Tours complétés</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-900">{tontine.nombreMembres}</p>
              <p className="text-xs text-gray-500">Membres gérés</p>
            </div>
            <div className="text-center">
              <p className={`text-base font-bold ${tauxReussite >= 80 ? "text-green-600" : tauxReussite >= 50 ? "text-amber-600" : "text-red-600"}`}>
                {tauxReussite}%
              </p>
              <p className="text-xs text-gray-500">Taux de paiement</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/membres/${organisateur.id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-sm font-semibold transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Voir le profil complet
        </Link>
      </div>
    </div>
  );
}
