"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AccessLayout from "@/components/AccessLayout";
import {
  Users,
  LogIn,
  ShieldCheck,
  ShieldX,
  MapPin,
  ArrowRight,
  Clock,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  total: number;
  autorises: number;
  refuses: number;
  presents: number;
}

interface Log {
  id: string;
  type: string;
  statut: string;
  raison_refus: string | null;
  scanned_at: string;
  access_members: {
    nom: string;
    prenom: string;
    role: string;
    photo_url: string | null;
  };
  access_spaces: { nom: string };
}

interface Space {
  id: string;
  nom: string;
  adresse: string | null;
  actif: boolean;
  access_members: { count: number }[];
}

export default function AccessDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ total: 0, autorises: 0, refuses: 0, presents: 0 });
  const [logs, setLogs] = useState<Log[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/access/logs?limit=10").then((r) => r.json()),
      fetch("/api/access/spaces").then((r) => r.json()),
    ])
      .then(([logsData, spacesData]) => {
        setStats(logsData.stats || { total: 0, autorises: 0, refuses: 0, presents: 0 });
        setLogs(logsData.logs || []);
        setSpaces(spacesData.spaces || []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <AccessLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-7 h-7 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AccessLayout>
    );
  }

  const statCards = [
    { label: "Présents", value: stats.presents, icon: UserCheck, color: "emerald" },
    { label: "Entrées aujourd'hui", value: stats.total, icon: LogIn, color: "blue" },
    { label: "Autorisés", value: stats.autorises, icon: ShieldCheck, color: "green" },
    { label: "Refusés", value: stats.refuses, icon: ShieldX, color: "red" },
  ];

  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", iconBg: "bg-emerald-500/10" },
    blue: { bg: "bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-500/10" },
    green: { bg: "bg-green-50", text: "text-green-700", iconBg: "bg-green-500/10" },
    red: { bg: "bg-red-50", text: "text-red-700", iconBg: "bg-red-500/10" },
  };

  return (
    <AccessLayout>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((s) => {
          const c = colorMap[s.color];
          return (
            <div key={s.label} className={`${c.bg} rounded-2xl p-4`}>
              <div className={`w-8 h-8 ${c.iconBg} rounded-xl flex items-center justify-center mb-2`}>
                <s.icon className={`w-4 h-4 ${c.text}`} />
              </div>
              <p className={`text-[24px] font-black ${c.text}`}>{s.value}</p>
              <p className="text-[12px] font-semibold text-gray-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href="/access/scanner"
          className="bg-emerald-500 text-white rounded-2xl p-4 flex items-center gap-3 active:scale-[0.97] transition-transform shadow-lg shadow-emerald-500/25"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[15px] font-bold">Scanner</p>
            <p className="text-[11px] opacity-80">Contrôler les accès</p>
          </div>
        </Link>
        <Link
          href="/access/membres"
          className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.97] transition-transform shadow-sm"
        >
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-gray-900">Membres</p>
            <p className="text-[11px] text-gray-500">Gérer les badges</p>
          </div>
        </Link>
      </div>

      {/* Spaces overview */}
      {spaces.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-gray-900">Mes espaces</h2>
            <Link href="/access/espaces" className="text-[13px] font-semibold text-emerald-600 flex items-center gap-1">
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {spaces.slice(0, 4).map((space) => (
              <div
                key={space.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 min-w-[180px] flex-shrink-0"
              >
                <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[14px] font-bold text-gray-900 truncate">{space.nom}</p>
                <p className="text-[12px] text-gray-500">
                  {space.access_members?.[0]?.count || 0} membres
                </p>
                <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  space.actif ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${space.actif ? "bg-emerald-500" : "bg-gray-400"}`} />
                  {space.actif ? "Actif" : "Inactif"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent logs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[16px] font-bold text-gray-900">Activité récente</h2>
          {logs.length > 0 && (
            <Link href="/access/historique" className="text-[13px] font-semibold text-emerald-600 flex items-center gap-1">
              Tout voir <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-gray-500">Aucune activité</p>
            <p className="text-[12px] text-gray-400 mt-1">
              Les scans apparaîtront ici en temps réel.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-center gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    log.statut === "autorise"
                      ? "bg-emerald-500/10"
                      : "bg-red-500/10"
                  }`}
                >
                  {log.statut === "autorise" ? (
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                  ) : (
                    <ShieldX className="w-4.5 h-4.5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-gray-900 truncate">
                    {log.access_members?.prenom} {log.access_members?.nom}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {log.access_spaces?.nom} · {log.type === "entree" ? "Entrée" : "Sortie"}
                    {log.raison_refus && ` · ${log.raison_refus}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      log.statut === "autorise"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {log.statut === "autorise" ? "Autorisé" : "Refusé"}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(log.scanned_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty state if no spaces */}
      {spaces.length === 0 && logs.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mt-6">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-[16px] font-bold text-gray-900 mb-1">Commencez par créer un espace</p>
          <p className="text-[13px] text-gray-500 mb-4">
            Un espace représente un lieu ou une zone à contrôler (bureau, entrepôt, événement...).
          </p>
          <Link
            href="/access/espaces"
            className="inline-flex items-center gap-2 bg-emerald-500 text-white text-[14px] font-bold px-5 py-2.5 rounded-2xl active:scale-[0.97] transition-transform shadow-lg shadow-emerald-500/25"
          >
            <MapPin className="w-4 h-4" />
            Créer un espace
          </Link>
        </div>
      )}
    </AccessLayout>
  );
}
