"use client";

import Link from "next/link";
import { User } from "@/types";
import Avatar from "@/components/Avatar";
import {
  Crown,
  MapPin,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";

interface MemberCardProps {
  user: User;
  role?: "organisateur" | "membre";
  showStats?: boolean;
  compact?: boolean;
  onClick?: () => void;
  linkToProfile?: boolean;
  extra?: React.ReactNode;
}

function getConfianceLabel(score: number) {
  if (score >= 90) return { label: "Excellent", color: "text-green-600 bg-green-50" };
  if (score >= 70) return { label: "Bon", color: "text-blue-600 bg-blue-50" };
  if (score >= 50) return { label: "Moyen", color: "text-amber-600 bg-amber-50" };
  return { label: "Nouveau", color: "text-gray-600 bg-gray-50" };
}

export function ConfianceBadge({ score }: { score: number }) {
  const { label, color } = getConfianceLabel(score);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      <Star className="w-3 h-3" />
      {score}% · {label}
    </span>
  );
}

export default function MemberCard({
  user,
  role,
  showStats = false,
  compact = false,
  linkToProfile = true,
  extra,
}: MemberCardProps) {
  const content = (
    <div
      className={`flex items-center gap-3 ${
        compact ? "p-2" : "p-3"
      } rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group`}
    >
      <Avatar user={user} size={compact ? "sm" : "md"} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-gray-900 truncate ${compact ? "text-sm" : ""}`}>
            {user.prenom} {user.nom}
          </p>
          {user.badgeVerifie && (
            <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
          )}
          {role === "organisateur" && (
            <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          {user.ville && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {user.ville}
            </span>
          )}
          {user.profession && !compact && (
            <span>· {user.profession}</span>
          )}
        </div>

        {showStats && !compact && (
          <div className="flex items-center gap-3 mt-1">
            <ConfianceBadge score={user.scoreConfiance ?? 50} />
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {user.nombreTontinesParticipees ?? 0} tontines
            </span>
          </div>
        )}
      </div>

      {extra}
    </div>
  );

  if (linkToProfile) {
    return (
      <Link href={`/membres/${user.id}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
