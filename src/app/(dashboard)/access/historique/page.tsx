"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AccessLayout from "@/components/AccessLayout";
import {
  ClipboardList,
  ShieldCheck,
  ShieldX,
  Filter,
  Calendar,
  UserCircle2,
  ChevronDown,
} from "lucide-react";

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
  access_members: { count: number }[];
}

export default function HistoriquePage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSpace, setFilterSpace] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [limit, setLimit] = useState(50);

  const fetchLogs = async () => {
    const params = new URLSearchParams();
    if (filterSpace) params.set("space_id", filterSpace);
    params.set("limit", String(limit));
    const r = await fetch(`/api/access/logs?${params.toString()}`);
    const data = await r.json();
    setLogs(data.logs || []);
  };

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetchLogs(),
      fetch("/api/access/spaces")
        .then((r) => r.json())
        .then((data) => setSpaces(data.spaces || [])),
    ]).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchLogs();
  }, [filterSpace, limit]);

  const filtered = logs.filter((l) => {
    if (filterStatut && l.statut !== filterStatut) return false;
    return true;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, Log[]>>((acc, log) => {
    const date = new Date(log.scanned_at).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  if (loading) {
    return (
      <AccessLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-7 h-7 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AccessLayout>
    );
  }

  return (
    <AccessLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-black text-gray-900">Historique</h2>
          <p className="text-[13px] text-gray-500">{filtered.length} entrée{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <select
            value={filterSpace}
            onChange={(e) => setFilterSpace(e.target.value)}
            className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none"
          >
            <option value="">Tous les espaces</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>{s.nom}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none"
          >
            <option value="">Tous les statuts</option>
            <option value="autorise">Autorisé</option>
            <option value="refuse">Refusé</option>
          </select>
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none"
          >
            <option value={25}>25 derniers</option>
            <option value={50}>50 derniers</option>
            <option value={100}>100 derniers</option>
            <option value={500}>500 derniers</option>
          </select>
        </div>
      </div>

      {/* Logs */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-7 h-7 text-blue-600" />
          </div>
          <p className="text-[16px] font-bold text-gray-900 mb-1">Aucun historique</p>
          <p className="text-[13px] text-gray-500">
            Les activités de scan apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, dateLogs]) => (
            <div key={date}>
              <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-2 px-1">
                {date}
              </p>
              <div className="space-y-2">
                {dateLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-center gap-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        log.statut === "autorise" ? "bg-blue-500/10" : "bg-red-500/10"
                      }`}
                    >
                      {log.statut === "autorise" ? (
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ShieldX className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[14px] font-bold text-gray-900 truncate">
                          {log.access_members?.prenom} {log.access_members?.nom}
                        </p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          log.type === "entree"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-blue-50 text-blue-600"
                        }`}>
                          {log.type === "entree" ? "Entrée" : "Sortie"}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-500 truncate">
                        {log.access_spaces?.nom}
                        {log.access_members?.role && ` · ${log.access_members.role}`}
                        {log.raison_refus && ` · ${log.raison_refus}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          log.statut === "autorise"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        {log.statut === "autorise" ? "Autorisé" : "Refusé"}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(log.scanned_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AccessLayout>
  );
}
