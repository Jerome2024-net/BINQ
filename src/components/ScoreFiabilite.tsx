"use client";

import React, { useEffect, useState } from "react";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ScoreData {
  score: number;
  totalPaiements: number;
  paiementsATemps: number;
  paiementsRetard: number;
  defaillances: number;
  niveau: "excellent" | "bon" | "moyen" | "faible" | "bloque";
}

interface ScoreFiabiliteProps {
  userId: string;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

const COLORS = {
  excellent: "#10b981",
  bon: "#22c55e",
  moyen: "#f59e0b",
  faible: "#ef4444",
  bloque: "#991b1b",
};

const LABELS = {
  excellent: "Excellent",
  bon: "Bon",
  moyen: "Moyen",
  faible: "Faible",
  bloque: "Bloqué",
};

export default function ScoreFiabilite({
  userId,
  size = "md",
  showDetails = false,
}: ScoreFiabiliteProps) {
  const [score, setScore] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await fetch("/api/contraintes/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (res.ok) {
          setScore(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchScore();
  }, [userId]);

  if (loading) {
    return (
      <div
        className="animate-pulse rounded-full bg-gray-200"
        style={{
          width: size === "sm" ? 32 : 48,
          height: size === "sm" ? 32 : 48,
        }}
      />
    );
  }

  if (!score) return null;

  const color = COLORS[score.niveau];
  const label = LABELS[score.niveau];

  const getIcon = () => {
    const s = size === "sm" ? 14 : 18;
    switch (score.niveau) {
      case "excellent":
        return <CheckCircle size={s} color={color} />;
      case "bon":
        return <TrendingUp size={s} color={color} />;
      case "moyen":
        return <AlertTriangle size={s} color={color} />;
      case "faible":
        return <TrendingDown size={s} color={color} />;
      case "bloque":
        return <XCircle size={s} color={color} />;
    }
  };

  // ─── Badge compact ─────────────────────────
  if (!showDetails) {
    return (
      <div
        className="inline-flex items-center"
        style={{
          gap: size === "sm" ? 4 : 6,
          padding: size === "sm" ? "2px 8px" : "4px 12px",
          borderRadius: 20,
          backgroundColor: `${color}15`,
          border: `1px solid ${color}30`,
        }}
        title={`Score de fiabilité : ${score.score}/100 (${label})`}
      >
        {getIcon()}
        <span
          style={{
            color,
            fontSize: size === "sm" ? 11 : 13,
            fontWeight: 600,
          }}
        >
          {score.score}
        </span>
      </div>
    );
  }

  // ─── Card détaillée ─────────────────────────
  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Shield size={20} color={color} />
          </div>
          <div>
            <h3 className="text-white text-base font-semibold">
              Score de fiabilité
            </h3>
            <p className="text-slate-400 text-xs">{label}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold" style={{ color }}>
            {score.score}
          </span>
          <span className="text-slate-500 text-sm">/100</span>
        </div>
      </div>

      {/* Barre */}
      <div className="w-full h-2 bg-slate-700/50 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score.score}%`, backgroundColor: color }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-500/10 rounded-xl p-3">
          <p className="text-slate-400 text-[11px] mb-1">A temps</p>
          <p className="text-emerald-400 text-xl font-bold">
            {score.paiementsATemps}
          </p>
        </div>
        <div className="bg-amber-500/10 rounded-xl p-3">
          <p className="text-slate-400 text-[11px] mb-1">En retard</p>
          <p className="text-amber-400 text-xl font-bold">
            {score.paiementsRetard}
          </p>
        </div>
        <div className="bg-red-500/10 rounded-xl p-3">
          <p className="text-slate-400 text-[11px] mb-1">Défaillances</p>
          <p className="text-red-400 text-xl font-bold">
            {score.defaillances}
          </p>
        </div>
        <div className="bg-indigo-500/10 rounded-xl p-3">
          <p className="text-slate-400 text-[11px] mb-1">Total</p>
          <p className="text-indigo-400 text-xl font-bold">
            {score.totalPaiements}
          </p>
        </div>
      </div>
    </div>
  );
}
