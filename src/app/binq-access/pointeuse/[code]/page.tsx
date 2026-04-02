"use client";

import { useState, useEffect, useMemo } from "react";
import { Shield, LogIn, LogOut, CheckCircle2, XCircle, Loader2, Search, User } from "lucide-react";

interface Member {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  photo_url: string | null;
}

interface ScanResult {
  statut: "autorise" | "refuse";
  type?: string;
  message: string;
  member?: { nom: string; prenom: string; role: string };
  heure?: string;
}

export default function PointeusePage({ params }: { params: { code: string } }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [spaceName, setSpaceName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");

  // Charger les membres de l'espace
  useEffect(() => {
    fetch(`/api/access/pointeuse?space_code=${params.code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSpaceName(data.space?.nom || "");
          setMembers(data.members || []);
        }
      })
      .catch(() => setError("Erreur de connexion"))
      .finally(() => setLoading(false));
  }, [params.code]);

  // Auto-clear result after 5s
  useEffect(() => {
    if (result) {
      const t = setTimeout(() => {
        setResult(null);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [result]);

  // Filtrer les membres
  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase().trim();
    return members.filter(
      (m) =>
        m.prenom.toLowerCase().includes(q) ||
        m.nom.toLowerCase().includes(q) ||
        `${m.prenom} ${m.nom}`.toLowerCase().includes(q)
    );
  }, [members, search]);

  // Sélectionner un membre → pointer
  const handleSelect = async (member: Member) => {
    setSubmitting(true);
    try {
      const r = await fetch("/api/access/pointeuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ space_code: params.code, member_id: member.id }),
      });
      const data = await r.json();

      if (data.statut === "autorise") {
        try { navigator.vibrate([30, 50, 30]); } catch {}
        setResult({
          statut: "autorise",
          type: data.type,
          message: data.message,
          member: data.member,
          heure: data.heure,
        });
      } else {
        try { navigator.vibrate([50, 30, 50, 30, 80]); } catch {}
        setResult({
          statut: "refuse",
          message: data.message || data.error || "Accès refusé",
          member: data.member,
        });
      }
    } catch {
      try { navigator.vibrate([50, 30, 50, 30, 80]); } catch {}
      setResult({ statut: "refuse", message: "Erreur de connexion" });
    } finally {
      setSubmitting(false);
      setSearch("");
    }
  };

  // Initiales pour avatar
  const initials = (m: Member) =>
    `${m.prenom.charAt(0)}${m.nom.charAt(0)}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col select-none">
      {/* Result overlay */}
      {result && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${
            result.statut === "autorise" ? "bg-blue-500" : "bg-red-500"
          }`}
          onClick={() => setResult(null)}
        >
          <div className="text-center text-white max-w-sm">
            {result.statut === "autorise" ? (
              <CheckCircle2 className="w-20 h-20 mx-auto mb-4" />
            ) : (
              <XCircle className="w-20 h-20 mx-auto mb-4" />
            )}
            {result.member && (
              <p className="text-[28px] font-black mb-2">
                {result.member.prenom} {result.member.nom}
              </p>
            )}
            <p className="text-[18px] font-bold mb-2">{result.message}</p>
            {result.type && (
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mt-2">
                {result.type === "entree" ? (
                  <LogIn className="w-5 h-5" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
                <span className="text-[16px] font-bold">
                  {result.type === "entree" ? "Entrée" : "Sortie"}
                </span>
                {result.heure && (
                  <span className="text-[16px] opacity-80">à {result.heure}</span>
                )}
              </div>
            )}
            {result.member?.role && (
              <p className="mt-3 text-[14px] opacity-70">{result.member.role}</p>
            )}
            <p className="mt-6 text-[12px] opacity-50">Touchez pour fermer</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="pt-10 pb-4 px-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-white text-[18px] font-black leading-tight">Binq Access</h1>
            {spaceName && (
              <p className="text-blue-400 text-[13px] font-semibold">{spaceName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher votre nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border border-gray-800 rounded-2xl text-white text-[16px] placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all"
            autoComplete="off"
            autoFocus
          />
        </div>
      </div>

      {/* Members list */}
      <div className="flex-1 overflow-y-auto px-5 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-bold">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 text-[14px]">
              {search ? "Aucun résultat" : "Aucun membre"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelect(m)}
                disabled={submitting}
                className="w-full flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-2xl active:scale-[0.97] active:bg-gray-800 transition-all disabled:opacity-50 text-left"
              >
                {/* Avatar */}
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-[15px]">
                      {initials(m)}
                    </span>
                  </div>
                )}
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-[16px] truncate">
                    {m.prenom} {m.nom}
                  </p>
                  <p className="text-gray-500 text-[13px] truncate">{m.role}</p>
                </div>
                {/* Arrow */}
                <LogIn className="w-5 h-5 text-gray-700 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Submitting overlay */}
      {submitting && (
        <div className="fixed inset-0 z-40 bg-gray-950/80 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-0 inset-x-0 py-3 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
        <p className="text-center text-[11px] text-gray-600">
          Propulsé par <span className="font-bold text-gray-500">Binq</span>
        </p>
      </div>
    </div>
  );
}
