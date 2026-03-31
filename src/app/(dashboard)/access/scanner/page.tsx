"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess, hapticError, hapticMedium } from "@/lib/haptics";
import {
  ScanLine,
  Shield,
  ShieldCheck,
  ShieldX,
  ChevronDown,
  ArrowLeft,
  Maximize2,
  Minimize2,
  RefreshCw,
  UserCircle2,
  LogIn,
  LogOut,
} from "lucide-react";
import Link from "next/link";

interface Space {
  id: string;
  nom: string;
  adresse: string | null;
  access_members: { count: number }[];
}

interface ScanResult {
  statut: "autorise" | "refuse";
  message: string;
  member?: {
    nom: string;
    prenom: string;
    role: string;
    photo_url: string | null;
  };
  log_id?: string;
}

export default function ScannerPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanType, setScanType] = useState<"entree" | "sortie">("entree");
  const [fullscreen, setFullscreen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<any>(null);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch spaces
  useEffect(() => {
    if (!user) return;
    fetch("/api/access/spaces")
      .then((r) => r.json())
      .then((data) => {
        const spcs = data.spaces || [];
        setSpaces(spcs);
        if (spcs.length > 0) setSelectedSpace(spcs[0].id);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Handle scan result
  const handleScan = useCallback(
    async (qrCode: string) => {
      // Debounce: same code within 3 seconds
      const now = Date.now();
      if (qrCode === lastScanRef.current && now - lastScanTimeRef.current < 3000) return;
      lastScanRef.current = qrCode;
      lastScanTimeRef.current = now;

      if (!selectedSpace || processing) return;
      setProcessing(true);

      try {
        const r = await fetch("/api/access/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qr_code: qrCode,
            space_id: selectedSpace,
            type: scanType,
          }),
        });
        const data = await r.json();

        if (data.statut === "autorise") {
          hapticSuccess();
          setResult({
            statut: "autorise",
            message: data.message || "Accès autorisé",
            member: data.member,
            log_id: data.log_id,
          });
        } else {
          hapticError();
          setResult({
            statut: "refuse",
            message: data.message || data.error || "Accès refusé",
            member: data.member,
          });
        }
      } catch {
        hapticError();
        setResult({
          statut: "refuse",
          message: "Erreur de connexion",
        });
      } finally {
        setProcessing(false);
        // Auto-clear after 4s
        setTimeout(() => setResult(null), 4000);
      }
    },
    [selectedSpace, scanType, processing]
  );

  // Start scanner
  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("access-scanner");
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText: string) => {
          handleScan(decodedText);
        },
        () => {} // ignore errors (no QR found in frame)
      );
      setScanning(true);
    } catch (err) {
      console.error("Scanner error:", err);
      showToast("error", "Erreur caméra", "Impossible d'accéder à la caméra");
    }
  }, [handleScan, showToast]);

  // Stop scanner
  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch {}
      html5QrRef.current = null;
    }
    setScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        try {
          html5QrRef.current.stop();
          html5QrRef.current.clear();
        } catch {}
      }
    };
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <div className="px-5 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ScanLine className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-[16px] font-bold text-gray-900 mb-1">Aucun espace configuré</p>
          <p className="text-[13px] text-gray-500 mb-4">
            Créez un espace et ajoutez des membres pour utiliser le scanner.
          </p>
          <Link
            href="/access/espaces"
            className="inline-flex items-center gap-2 bg-emerald-500 text-white text-[14px] font-bold px-5 py-2.5 rounded-2xl active:scale-[0.97] transition-transform shadow-lg shadow-emerald-500/25"
          >
            Créer un espace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${fullscreen ? "bg-gray-950 min-h-screen p-4" : ""}`}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-4 ${fullscreen ? "" : "px-0"}`}>
        <div className="flex items-center gap-2.5">
          {fullscreen ? (
            <button
              onClick={toggleFullscreen}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
          )}
          <div>
            <h1 className={`text-[20px] font-black ${fullscreen ? "text-white" : "text-gray-900"}`}>
              Scanner
            </h1>
            <p className={`text-[12px] ${fullscreen ? "text-gray-400" : "text-gray-500"}`}>
              Contrôle d&apos;accès en temps réel
            </p>
          </div>
        </div>
        <button
          onClick={toggleFullscreen}
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            fullscreen ? "bg-white/10" : "bg-gray-100"
          }`}
        >
          {fullscreen ? (
            <Minimize2 className="w-4.5 h-4.5 text-white" />
          ) : (
            <Maximize2 className="w-4.5 h-4.5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Space selector + Type toggle */}
      <div className={`flex gap-2 mb-4 ${fullscreen ? "" : ""}`}>
        <div className="flex-1 relative">
          <select
            value={selectedSpace}
            onChange={(e) => {
              setSelectedSpace(e.target.value);
              hapticMedium();
            }}
            className={`w-full px-4 py-3 rounded-xl text-[14px] font-semibold appearance-none pr-10 ${
              fullscreen
                ? "bg-white/10 text-white border border-white/20"
                : "bg-white border border-gray-200 text-gray-900"
            } focus:outline-none focus:ring-2 focus:ring-emerald-500/30`}
          >
            {spaces.map((s) => (
              <option key={s.id} value={s.id} className="text-gray-900">
                {s.nom}
              </option>
            ))}
          </select>
          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
            fullscreen ? "text-white/50" : "text-gray-400"
          }`} />
        </div>
        <div className={`flex rounded-xl overflow-hidden border ${
          fullscreen ? "border-white/20" : "border-gray-200"
        }`}>
          <button
            onClick={() => { setScanType("entree"); hapticMedium(); }}
            className={`flex items-center gap-1.5 px-3.5 py-3 text-[13px] font-semibold transition-all ${
              scanType === "entree"
                ? "bg-emerald-500 text-white"
                : fullscreen
                ? "bg-white/10 text-gray-400"
                : "bg-white text-gray-500"
            }`}
          >
            <LogIn className="w-4 h-4" />
            Entrée
          </button>
          <button
            onClick={() => { setScanType("sortie"); hapticMedium(); }}
            className={`flex items-center gap-1.5 px-3.5 py-3 text-[13px] font-semibold transition-all ${
              scanType === "sortie"
                ? "bg-blue-500 text-white"
                : fullscreen
                ? "bg-white/10 text-gray-400"
                : "bg-white text-gray-500"
            }`}
          >
            <LogOut className="w-4 h-4" />
            Sortie
          </button>
        </div>
      </div>

      {/* Scanner viewport */}
      <div className={`relative rounded-2xl overflow-hidden mb-4 ${
        fullscreen ? "aspect-square max-w-lg mx-auto" : "aspect-square"
      } ${!scanning ? (fullscreen ? "bg-white/5" : "bg-gray-100") : ""}`}>
        <div id="access-scanner" ref={scannerRef} className="w-full h-full" />

        {!scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
              fullscreen ? "bg-white/10" : "bg-emerald-500/10"
            }`}>
              <ScanLine className={`w-8 h-8 ${fullscreen ? "text-white" : "text-emerald-600"}`} />
            </div>
            <p className={`text-[15px] font-bold mb-1 ${fullscreen ? "text-white" : "text-gray-900"}`}>
              Prêt à scanner
            </p>
            <p className={`text-[13px] mb-4 ${fullscreen ? "text-gray-400" : "text-gray-500"}`}>
              Activez la caméra pour commencer
            </p>
            <button
              onClick={startScanner}
              className="bg-emerald-500 text-white text-[15px] font-bold px-8 py-3 rounded-2xl active:scale-[0.97] transition-transform shadow-lg shadow-emerald-500/25"
            >
              Activer la caméra
            </button>
          </div>
        )}

        {/* Scan result overlay */}
        {result && (
          <div className={`absolute inset-0 flex items-center justify-center ${
            result.statut === "autorise"
              ? "bg-emerald-500/90"
              : "bg-red-500/90"
          } backdrop-blur-sm animate-fade-up`}>
            <div className="text-center text-white p-6">
              {result.statut === "autorise" ? (
                <ShieldCheck className="w-16 h-16 mx-auto mb-3" />
              ) : (
                <ShieldX className="w-16 h-16 mx-auto mb-3" />
              )}
              <p className="text-[24px] font-black mb-1">
                {result.statut === "autorise" ? "AUTORISÉ" : "REFUSÉ"}
              </p>
              {result.member && (
                <p className="text-[18px] font-bold mb-1">
                  {result.member.prenom} {result.member.nom}
                </p>
              )}
              <p className="text-[14px] opacity-90">{result.message}</p>
              {result.member && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/20 text-[12px] font-semibold">
                  {result.member.role}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {processing && !result && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-10 h-10 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Controls */}
      {scanning && (
        <div className="flex gap-3">
          <button
            onClick={async () => {
              await stopScanner();
              await startScanner();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold ${
              fullscreen
                ? "bg-white/10 text-white"
                : "bg-gray-100 text-gray-600"
            } active:scale-[0.97] transition-transform`}
          >
            <RefreshCw className="w-4 h-4" />
            Redémarrer
          </button>
          <button
            onClick={stopScanner}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl text-[14px] font-semibold active:scale-[0.97] transition-transform"
          >
            Arrêter
          </button>
        </div>
      )}
    </div>
  );
}
