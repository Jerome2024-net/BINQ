"use client";

import { useState, useRef, useEffect } from "react";
import { Shield, LogIn, LogOut, CheckCircle2, XCircle, Loader2, Delete } from "lucide-react";

interface ScanResult {
  statut: "autorise" | "refuse";
  type?: string;
  message: string;
  member?: { nom: string; prenom: string; role: string };
  heure?: string;
}

export default function PointeusePage({ params }: { params: { code: string } }) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [spaceName, setSpaceName] = useState("");

  // Auto-clear result after 5s
  useEffect(() => {
    if (result) {
      const t = setTimeout(() => {
        setResult(null);
        setPin("");
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [result]);

  const handleDigit = (d: string) => {
    if (pin.length < 4) {
      const newPin = pin + d;
      setPin(newPin);
      // Auto-submit on 4 digits
      if (newPin.length === 4) {
        submitPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
  };

  const submitPin = async (code: string) => {
    setLoading(true);
    try {
      const r = await fetch("/api/access/pointeuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ space_code: params.code, pin: code }),
      });
      const data = await r.json();

      if (data.statut === "autorise") {
        // Vibrate success
        try { navigator.vibrate([30, 50, 30]); } catch {}
        setResult({
          statut: "autorise",
          type: data.type,
          message: data.message,
          member: data.member,
          heure: data.heure,
        });
      } else {
        // Vibrate error
        try { navigator.vibrate([50, 30, 50, 30, 80]); } catch {}
        setResult({
          statut: "refuse",
          message: data.message || data.error || "Accès refusé",
          member: data.member,
        });
      }
    } catch {
      try { navigator.vibrate([50, 30, 50, 30, 80]); } catch {}
      setResult({
        statut: "refuse",
        message: "Erreur de connexion",
      });
    } finally {
      setLoading(false);
    }
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "DEL"];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 select-none">
      {/* Result overlay */}
      {result && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${
          result.statut === "autorise" ? "bg-emerald-500" : "bg-red-500"
        }`}>
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
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Shield className="w-7 h-7 text-emerald-400" />
        </div>
        <h1 className="text-white text-[22px] font-black">Binq Access</h1>
        <p className="text-gray-500 text-[14px] mt-1">Entrez votre code PIN</p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-[24px] font-black transition-all ${
              pin[i]
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                : "border-gray-700 bg-gray-900 text-transparent"
            }`}
          >
            {pin[i] ? "●" : "○"}
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="mb-6">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Numpad */}
      {!loading && !result && (
        <div className="grid grid-cols-3 gap-3 max-w-[280px] w-full">
          {digits.map((d, i) => {
            if (d === "") return <div key={i} />;
            if (d === "DEL") {
              return (
                <button
                  key={i}
                  onClick={handleDelete}
                  disabled={pin.length === 0}
                  className="h-16 rounded-2xl bg-gray-800 flex items-center justify-center active:scale-[0.93] transition-transform disabled:opacity-30"
                >
                  <Delete className="w-6 h-6 text-gray-400" />
                </button>
              );
            }
            return (
              <button
                key={i}
                onClick={() => handleDigit(d)}
                disabled={pin.length >= 4}
                className="h-16 rounded-2xl bg-gray-800 text-white text-[24px] font-bold active:scale-[0.93] active:bg-gray-700 transition-all disabled:opacity-30"
              >
                {d}
              </button>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-[11px] text-gray-600">
          Propulsé par <span className="font-bold text-gray-500">Binq</span>
        </p>
      </div>
    </div>
  );
}
