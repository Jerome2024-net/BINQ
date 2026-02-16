"use client";

import Image from "next/image";
import { User } from "@/types";

interface AvatarProps {
  user: Pick<User, "prenom" | "nom" | "avatar">;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showBorder?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "w-7 h-7 text-xs",
  sm: "w-9 h-9 text-sm",
  md: "w-11 h-11 text-base",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-3xl",
};

const radiusClasses = {
  xs: "rounded-lg",
  sm: "rounded-xl",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-2xl",
};

// Couleurs basées sur les initiales pour varier les avatars
const avatarColors = [
  "bg-primary-600",
  "bg-emerald-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-teal-600",
  "bg-orange-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function Avatar({ user, size = "md", showBorder = false, className = "" }: AvatarProps) {
  const initials = `${user.prenom?.[0] || "?"}${user.nom?.[0] || "?"}`.toUpperCase();
  const color = getAvatarColor(`${user.prenom}${user.nom}`);

  if (user.avatar) {
    return (
      <div
        className={`relative ${sizeClasses[size]} ${radiusClasses[size]} overflow-hidden flex-shrink-0 ${
          showBorder ? "ring-2 ring-white shadow-sm" : ""
        } ${className}`}
      >
        <Image src={user.avatar} alt={`${user.prenom} ${user.nom}`} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${radiusClasses[size]} ${color} flex items-center justify-center flex-shrink-0 ${
        showBorder ? "ring-2 ring-white shadow-sm" : ""
      } ${className}`}
    >
      <span className="text-white font-semibold">{initials}</span>
    </div>
  );
}

// Groupe d'avatars empilés
interface AvatarGroupProps {
  users: Pick<User, "prenom" | "nom" | "avatar">[];
  max?: number;
  size?: "xs" | "sm" | "md";
}

export function AvatarGroup({ users, max = 4, size = "sm" }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((user, i) => (
        <Avatar key={i} user={user} size={size} showBorder />
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeClasses[size]} ${radiusClasses[size]} bg-gray-200 flex items-center justify-center flex-shrink-0 ring-2 ring-white`}
        >
          <span className="text-gray-600 font-semibold">+{remaining}</span>
        </div>
      )}
    </div>
  );
}
