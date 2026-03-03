"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  ScanLine,
  User,
  Share2,
  Copy,
  Check,
  Download,
  Camera,
  XCircle,
  Loader2,
} from "lucide-react";

type Tab = "mon-qr" | "scanner";

export default function QRCodePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("mon-qr");
  const [copied, setCopied] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrScannerRef = useRef<unknown>(null);

  const payUrl = typeof window !== "undefined" && user?.id
    ? `${window.location.origin}/pay/user/${user.id}`
    : "";

  const initials = user
    ? `${(user.prenom || "?")[0]}${(user.nom || "?")[0]}`.toUpperCase()
    : "??";

  const handleCopy = async () => {
    if (!payUrl) return;
    try {
      await navigator.clipboard.writeText(payUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleShare = async () => {
    if (!payUrl || !user) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payer ${user.prenom} ${user.nom} sur Binq`,
          text: `Envoyez-moi de l'argent via Binq`,
          url: payUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById("personal-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;
      if (ctx) {
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.drawImage(img, 112, 112, 800, 800);

        // Add label
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 36px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${user?.prenom || ""} ${user?.nom || ""}`, 512, 980);
        ctx.font = "24px system-ui, sans-serif";
        ctx.fillStyle = "#10b981";
        ctx.fillText("Binq Pay", 512, 60);
      }

      const link = document.createElement("a");
      link.download = `binq-qr-${user?.prenom || "code"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // ── QR Scanner ──
  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;

    setScanError(null);
    setScanning(true);

    try {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import("html5-qrcode");

      // Clean up previous instance
      if (html5QrScannerRef.current) {
        try {
          await (html5QrScannerRef.current as InstanceType<typeof Html5Qrcode>).stop();
        } catch { /* ignore */ }
      }

      const scanner = new Html5Qrcode("qr-reader");
      html5QrScannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          // QR code detected
          scanner.stop().catch(() => {});
          setScanning(false);

          // Check if it's a Binq URL
          try {
            const url = new URL(decodedText);
            const pathname = url.pathname;

            // /pay/user/UUID  or /pay/CODE
            if (pathname.startsWith("/pay/user/") || pathname.startsWith("/pay/")) {
              router.push(pathname);
              return;
            }
          } catch {
            // Not a URL, try as raw path
            if (decodedText.startsWith("/pay/")) {
              router.push(decodedText);
              return;
            }
          }

          setScanError("QR Code non reconnu. Scannez un QR Code Binq.");
        },
        () => {
          // Scan failure — ignore, keep scanning
        }
      );
    } catch (err) {
      setScanning(false);
      setScanError("Impossible d\u2019accéder à la caméra. Vérifiez les permissions.");
      console.error("Scanner error:", err);
    }
  }, [router]);

  const stopScanner = useCallback(async () => {
    if (html5QrScannerRef.current) {
      try {
        await (html5QrScannerRef.current as { stop: () => Promise<void> }).stop();
      } catch { /* ignore */ }
      html5QrScannerRef.current = null;
    }
    setScanning(false);
  }, []);

  // Cleanup scanner on unmount or tab switch
  useEffect(() => {
    return () => {
      if (html5QrScannerRef.current) {
        try {
          (html5QrScannerRef.current as { stop: () => Promise<void> }).stop();
        } catch { /* ignore */ }
      }
    };
  }, []);

  useEffect(() => {
    if (tab !== "scanner") {
      stopScanner();
    }
  }, [tab, stopScanner]);

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white tracking-tight">QR Code</h1>
        <p className="text-xs text-white/30 mt-0.5">Affichez votre QR ou scannez pour payer</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
        <button
          onClick={() => setTab("mon-qr")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
            tab === "mon-qr"
              ? "bg-emerald-500/20 text-emerald-400"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          <QrCode className="w-4 h-4" />
          Mon QR
        </button>
        <button
          onClick={() => setTab("scanner")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
            tab === "scanner"
              ? "bg-emerald-500/20 text-emerald-400"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          <ScanLine className="w-4 h-4" />
          Scanner
        </button>
      </div>

      {/* ── Mon QR Tab ── */}
      {tab === "mon-qr" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* QR Card */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 flex flex-col items-center">
            {/* User info */}
            <div className="flex items-center gap-3 mb-5">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.prenom}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600/30 flex items-center justify-center ring-2 ring-emerald-500/30">
                  <span className="text-sm font-bold text-emerald-300">{initials}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-white">{user?.prenom} {user?.nom}</p>
                <p className="text-[11px] text-white/30">Scannez pour m&apos;envoyer de l&apos;argent</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-2xl p-4 mb-5">
              {payUrl ? (
                <QRCodeSVG
                  id="personal-qr-code"
                  value={payUrl}
                  size={220}
                  bgColor="#FFFFFF"
                  fgColor="#0a0a0a"
                  level="H"
                  includeMargin={false}
                />
              ) : (
                <div className="w-[220px] h-[220px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Label */}
            <p className="text-xs text-white/20 mb-4 text-center">
              Montrez ce QR Code pour recevoir un paiement instantané
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white/60 text-xs font-bold transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copier
                  </>
                )}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold transition-all active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                Partager
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white/40 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Link preview */}
          <div className="flex items-center gap-2 bg-white/[0.02] rounded-xl px-3 py-2.5 border border-white/[0.04]">
            <QrCode className="w-3.5 h-3.5 text-white/15 shrink-0" />
            <p className="text-[11px] text-white/25 font-mono truncate">{payUrl}</p>
          </div>

          {/* Info */}
          <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-4">
            <p className="text-xs text-emerald-400/80 font-semibold mb-1">Comment ça marche ?</p>
            <ul className="text-[11px] text-white/30 space-y-1">
              <li>• Montrez votre QR Code à la personne qui veut vous payer</li>
              <li>• Elle scanne avec son app Binq ou sa caméra</li>
              <li>• Elle choisit le montant et valide l&apos;envoi</li>
              <li>• L&apos;argent arrive instantanément sur votre portefeuille</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Scanner Tab ── */}
      {tab === "scanner" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Scanner area */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
            <div ref={scannerRef} className="relative">
              <div id="qr-reader" className="w-full" />

              {!scanning && !scanError && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                    <Camera className="w-10 h-10 text-white/15" />
                  </div>
                  <p className="text-white/50 font-bold text-sm mb-1">Scanner un QR Code</p>
                  <p className="text-white/20 text-xs text-center mb-5">
                    Pointez la caméra vers un QR Code Binq pour payer
                  </p>
                  <button
                    onClick={startScanner}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-all active:scale-95"
                  >
                    <ScanLine className="w-5 h-5" />
                    Démarrer le scan
                  </button>
                </div>
              )}

              {scanning && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/60 font-semibold flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Scan en cours...
                    </p>
                    <button
                      onClick={stopScanner}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs font-bold hover:bg-white/20 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Arrêter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scan error */}
          {scanError && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-center">
              <p className="text-sm text-red-400 font-semibold mb-2">{scanError}</p>
              <button
                onClick={startScanner}
                className="text-xs text-emerald-400 font-bold hover:text-emerald-300 transition"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Info */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4">
            <p className="text-xs text-white/30 font-semibold mb-1">QR Codes supportés</p>
            <ul className="text-[11px] text-white/20 space-y-1">
              <li>• QR Code personnel d&apos;un utilisateur Binq</li>
              <li>• Lien de paiement (Demande d&apos;argent)</li>
              <li>• Lien d&apos;envoi via QR</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
