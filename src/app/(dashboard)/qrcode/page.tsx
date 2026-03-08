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
  CreditCard,
  Store,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Banknote,
  ArrowDownLeft,
  BarChart3,
} from "lucide-react";
import { type DeviseCode, DEVISES, DEFAULT_DEVISE, formatMontant, DEVISE_LIST } from "@/lib/currencies";
import { playPaymentSound } from "@/lib/sounds";
import { hapticLight, hapticMedium, hapticError, hapticHeavy } from "@/lib/haptics";
import dynamic from "next/dynamic";
const SuccessConfetti = dynamic(() => import("@/components/SuccessConfetti"), { ssr: false });

type Tab = "mon-qr" | "scanner" | "encaisser" | "terminaux";

interface Terminal {
  id: string;
  code: string;
  montant: number | null;
  devise: string;
  description: string;
  usage_unique: boolean;
  created_at: string;
}

interface Stats {
  totalTerminals: number;
  totalReceived: number;
  paymentsCount: number;
}

type PosStep = "amount" | "waiting" | "success";

export default function QRCodePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("mon-qr");
  const [copied, setCopied] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrScannerRef = useRef<unknown>(null);

  // ── Merchant state ──
  const [devise, setDevise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("binq_devise") as DeviseCode) || DEFAULT_DEVISE;
    }
    return DEFAULT_DEVISE;
  });
  const [posStep, setPosStep] = useState<PosStep>("amount");
  const [posMontant, setPosMontant] = useState("");
  const [posCode, setPosCode] = useState("");
  const [posLoading, setPosLoading] = useState(false);
  const [posPayer, setPosPayer] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [stats, setStats] = useState<Stats>({ totalTerminals: 0, totalReceived: 0, paymentsCount: 0 });
  const [loadingTerminals, setLoadingTerminals] = useState(true);
  const [showCreatePerm, setShowCreatePerm] = useState(false);
  const [permType, setPermType] = useState<"libre" | "fixe">("libre");
  const [permMontant, setPermMontant] = useState("");
  const [permDesc, setPermDesc] = useState("");
  const [creatingPerm, setCreatingPerm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedQR, setExpandedQR] = useState<string | null>(null);
  const [preFillMontant, setPreFillMontant] = useState("");
  const [showPreFill, setShowPreFill] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const payUrl = typeof window !== "undefined" && user?.id
    ? `${window.location.origin}/pay/user/${user.id}`
    : "";

  // Pre-filled payment link: if user sets a montant, we generate a payment-link-style URL
  const [preFillCode, setPreFillCode] = useState("");
  const [preFillLoading, setPreFillLoading] = useState(false);
  const preFillUrl = preFillCode ? `${origin}/pay/${preFillCode}` : payUrl;

  const initials = user
    ? `${(user.prenom || "?")[0]}${(user.nom || "?")[0]}`.toUpperCase()
    : "??";

  // ── Personal QR handlers ──
  const handleGeneratePreFill = async () => {
    const montant = parseFloat(preFillMontant);
    if (!montant || montant <= 0) return;
    setPreFillLoading(true);
    try {
      const res = await fetch("/api/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant, devise, description: `Demande ${formatMontant(montant, devise)}` }),
      });
      const data = await res.json();
      if (data.link?.code) {
        setPreFillCode(data.link.code);
      }
    } catch { /* ignore */ }
    finally { setPreFillLoading(false); }
  };

  const handleResetPreFill = () => {
    setPreFillCode("");
    setPreFillMontant("");
    setShowPreFill(false);
  };

  const handleCopy = async () => {
    if (!payUrl) return;
    try {
      await navigator.clipboard.writeText(preFillUrl);
      hapticMedium();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleShare = async () => {
    if (!payUrl && !preFillUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payer ${user?.prenom} ${user?.nom} sur Binq`,
          text: preFillCode ? `Payez ${formatMontant(parseFloat(preFillMontant), devise)} via Binq` : `Envoyez-moi de l'argent via Binq`,
          url: preFillUrl,
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
      canvas.height = 1200;
      if (ctx) {
        // Dark background
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, 1024, 1200);
        // "Binq Pay" header
        ctx.font = "bold 32px system-ui, sans-serif";
        ctx.fillStyle = "#10b981";
        ctx.textAlign = "center";
        ctx.fillText("Binq Pay", 512, 60);
        // White background for QR (quiet zone)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(112, 90, 800, 800, 32);
        ctx.fill();
        // Draw QR on white bg
        ctx.drawImage(img, 152, 130, 720, 720);
        // User name
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 42px system-ui, sans-serif";
        ctx.fillText(`${user?.prenom || ""} ${user?.nom || ""}`, 512, 960);
        // Subtitle
        ctx.font = "26px system-ui, sans-serif";
        ctx.fillStyle = "#6b7280";
        ctx.fillText("Scannez pour payer", 512, 1010);
        // URL
        ctx.font = "20px monospace";
        ctx.fillStyle = "#374151";
        ctx.fillText(preFillUrl || payUrl, 512, 1060);
      }

      const link = document.createElement("a");
      link.download = `binq-qr-${user?.prenom || "code"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // ── QR Scanner ──
  const [manualCode, setManualCode] = useState("");
  const [photoDecoding, setPhotoDecoding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process a decoded QR text (shared by live scanner and photo scanner)
  const handleDecodedQR = useCallback((decodedText: string) => {
    try {
      const url = new URL(decodedText);
      if (url.pathname.startsWith("/pay/user/") || url.pathname.startsWith("/pay/")) {
        hapticMedium();
        router.push(url.pathname);
        return;
      }
    } catch {
      if (decodedText.startsWith("/pay/")) { hapticMedium(); router.push(decodedText); return; }
    }
    hapticError();
    setScanError("QR Code non reconnu. Scannez un QR Code Binq.");
  }, [router]);

  // ── Photo-based QR scanner (works on ALL phones) ──
  const handlePhotoCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoDecoding(true);
    setScanError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-photo-decoder", { verbose: false });
      const result = await scanner.scanFile(file, false);
      scanner.clear();
      hapticMedium();
      handleDecodedQR(result);
    } catch {
      hapticError();
      setScanError("Impossible de lire le QR Code sur cette photo. Reprenez la photo plus près, avec un bon éclairage.");
    } finally {
      setPhotoDecoding(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [handleDecodedQR]);

  // ── Live video scanner ──
  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    setScanError(null);
    setScanning(true);

    // Detect in-app browsers that block camera access
    const ua = navigator.userAgent || "";
    const isInApp = /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|TikTok|Weibo|WeChat|MicroMessenger|LinkedIn/i.test(ua);
    if (isInApp) {
      setScanning(false);
      hapticError();
      setScanError("Ouvrez ce lien dans Safari ou Chrome. Les navigateurs intégrés (Facebook, Instagram...) bloquent la caméra. Vous pouvez aussi utiliser « Prendre une photo » ci-dessous.");
      return;
    }

    try {
      // Check if browser supports camera
      if (!navigator.mediaDevices?.getUserMedia) {
        setScanning(false);
        hapticError();
        setScanError("Votre navigateur ne supporte pas la caméra vidéo. Utilisez « Prendre une photo » ci-dessous, ou ouvrez dans Chrome/Safari.");
        return;
      }

      const { Html5Qrcode } = await import("html5-qrcode");

      // Stop any existing scanner
      if (html5QrScannerRef.current) {
        try { await (html5QrScannerRef.current as InstanceType<typeof Html5Qrcode>).stop(); } catch { /* ok */ }
        html5QrScannerRef.current = null;
      }

      const scanner = new Html5Qrcode("qr-reader", { verbose: false });
      html5QrScannerRef.current = scanner;

      // Responsive qrbox
      const containerWidth = scannerRef.current?.clientWidth || 320;
      const qrboxSize = Math.min(250, Math.max(120, Math.floor(containerWidth * 0.6)));

      const onSuccess = (decodedText: string) => {
        scanner.stop().catch(() => {});
        html5QrScannerRef.current = null;
        setScanning(false);
        handleDecodedQR(decodedText);
      };

      const config = { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize }, disableFlip: false };

      // Multi-strategy camera start (NO pre-check getUserMedia — it breaks many phones)
      let started = false;

      // Strategy 1: back camera via facingMode
      if (!started) {
        try {
          await scanner.start({ facingMode: "environment" }, config, onSuccess, () => {});
          started = true;
        } catch { /* try next */ }
      }

      // Strategy 2: enumerate cameras and pick back camera
      if (!started) {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            const backCam = devices.find(d => /back|rear|environment|arrière|trasera|posteriore/i.test(d.label));
            const camId = backCam ? backCam.id : devices[devices.length - 1].id;
            await scanner.start(camId, config, onSuccess, () => {});
            started = true;
          }
        } catch { /* try next */ }
      }

      // Strategy 3: front camera
      if (!started) {
        try {
          await scanner.start({ facingMode: "user" }, config, onSuccess, () => {});
          started = true;
        } catch { /* try next */ }
      }

      // Strategy 4: first available camera
      if (!started) {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            await scanner.start(devices[0].id, config, onSuccess, () => {});
            started = true;
          }
        } catch { /* give up */ }
      }

      if (!started) {
        html5QrScannerRef.current = null;
        setScanning(false);
        hapticError();
        setScanError("Impossible de démarrer la caméra. Utilisez « Prendre une photo » ci-dessous, ou essayez Chrome/Safari.");
        return;
      }

      // Force playsinline for iOS + fix video styling
      const fixVideo = () => {
        const video = document.querySelector("#qr-reader video") as HTMLVideoElement;
        if (video) {
          video.setAttribute("playsinline", "true");
          video.setAttribute("webkit-playsinline", "true");
          video.setAttribute("muted", "true");
          video.style.width = "100%";
          video.style.height = "auto";
          video.style.minHeight = "280px";
          video.style.objectFit = "cover";
          video.style.borderRadius = "12px";
        }
      };
      fixVideo();
      setTimeout(fixVideo, 300);
      setTimeout(fixVideo, 1000);
    } catch (err) {
      setScanning(false);
      html5QrScannerRef.current = null;
      hapticError();
      setScanError("Erreur du scanner. Utilisez « Prendre une photo » ci-dessous, ou rechargez la page.");
      console.error("Scanner error:", err);
    }
  }, [router, handleDecodedQR]);

  const stopScanner = useCallback(async () => {
    if (html5QrScannerRef.current) {
      try { await (html5QrScannerRef.current as { stop: () => Promise<void> }).stop(); } catch { /* ok */ }
      html5QrScannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (html5QrScannerRef.current) {
        try { (html5QrScannerRef.current as { stop: () => Promise<void> }).stop(); } catch { /* ok */ }
        html5QrScannerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (tab !== "scanner") stopScanner();
  }, [tab, stopScanner]);

  // ── Merchant: Fetch terminals ──
  const fetchTerminals = useCallback(async () => {
    try {
      const res = await fetch("/api/merchant");
      const data = await res.json();
      if (data.terminals) setTerminals(data.terminals);
      if (data.stats) setStats(data.stats);
    } catch { /* ignore */ }
    finally { setLoadingTerminals(false); }
  }, []);

  useEffect(() => {
    if (user) fetchTerminals();
  }, [user, fetchTerminals]);

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  // ── POS: Generate ──
  const handleGeneratePOS = async () => {
    const montant = parseFloat(posMontant);
    if (!montant || montant <= 0) return;
    if (montant < DEVISES[devise].minTransfer) return;

    setPosLoading(true);
    try {
      const res = await fetch("/api/merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant, devise, description: "Vente terminal", terminal: true }),
      });
      const data = await res.json();
      if (data.terminal) {
        setPosCode(data.terminal.code);
        setPosStep("waiting");
        startPolling(data.terminal.code);
      }
    } catch { /* ignore */ }
    finally { setPosLoading(false); }
  };

  const startPolling = (code: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/merchant/status?code=${code}`);
        const data = await res.json();
        if (data.statut === "paye") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPosPayer(data.paye_par || "Client");
          setPosStep("success");
          hapticHeavy();
          playPaymentSound();
        }
      } catch { /* ignore */ }
    }, 3000);
  };

  const handleCancelPOS = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (posCode) {
      try {
        const res = await fetch("/api/merchant");
        const data = await res.json();
        const t = (data.terminals || []).find((t: Terminal) => t.code === posCode);
        if (t) await fetch(`/api/merchant?id=${t.id}`, { method: "DELETE" });
      } catch { /* ignore */ }
    }
    resetPOS();
  };

  const resetPOS = () => {
    setPosStep("amount");
    setPosMontant("");
    setPosCode("");
    setPosPayer(null);
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  // ── Permanent: Create ──
  const handleCreatePermanent = async () => {
    if (permType === "fixe") {
      const m = parseFloat(permMontant);
      if (!m || m <= 0) return;
    }
    setCreatingPerm(true);
    try {
      const res = await fetch("/api/merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant: permType === "fixe" ? parseFloat(permMontant) : null,
          devise,
          description: permDesc || (permType === "libre" ? "Terminal libre" : `Terminal ${permMontant} ${DEVISES[devise].symbol}`),
          qrType: permType,
          terminal: false,
        }),
      });
      const data = await res.json();
      if (data.terminal) {
        await fetchTerminals();
        setShowCreatePerm(false);
        setPermMontant("");
        setPermDesc("");
      }
    } catch { /* ignore */ }
    finally { setCreatingPerm(false); }
  };

  const handleDeleteTerminal = async (id: string) => {
    try {
      await fetch(`/api/merchant?id=${id}`, { method: "DELETE" });
      setTerminals((prev) => prev.filter((t) => t.id !== id));
    } catch { /* ignore */ }
  };

  // ── Terminal Copy / Share / Download ──
  const handleCopyTerminal = async (code: string) => {
    const url = `${origin}/pay/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      hapticMedium();
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch { /* ignore */ }
  };

  const handleShareTerminal = async (code: string, desc: string) => {
    const url = `${origin}/pay/${code}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Payer - ${desc}`, text: `Scannez pour payer via Binq`, url }); } catch { /* user cancelled */ }
    } else {
      handleCopyTerminal(code);
    }
  };

  const handleDownloadQR = (code: string, desc: string) => {
    const svg = document.getElementById(`qr-${code}`);
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
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 36px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(desc, 512, 980);
        ctx.font = "24px system-ui, sans-serif";
        ctx.fillText("Binq Pay", 512, 60);
      }
      const link = document.createElement("a");
      link.download = `binq-terminal-${code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const posPayUrl = posCode ? `${origin}/pay/${posCode}` : "";

  return (
    <div className="space-y-5 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white tracking-tight">Paiements QR</h1>
        <p className="text-xs text-white/30 mt-0.5">Recevoir, scanner ou encaisser</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
        {([
          { key: "mon-qr" as Tab, icon: ArrowDownLeft, label: "Recevoir" },
          { key: "scanner" as Tab, icon: ScanLine, label: "Scanner" },
          { key: "encaisser" as Tab, icon: CreditCard, label: "Encaisser" },
          { key: "terminaux" as Tab, icon: Store, label: "Terminal" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => { hapticLight(); setTab(t.key); }}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-[11px] font-bold transition-all ${
              tab === t.key
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═════════════════════════ */}
      {/* ══ RECEVOIR TAB ══════════ */}
      {/* ═════════════════════════ */}
      {tab === "mon-qr" && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Identity Card */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white/[0.03] to-white/[0.02] border border-emerald-500/15 p-4">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.prenom} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 flex items-center justify-center ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10">
                  <span className="text-lg font-black text-emerald-300">{initials}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-base font-black text-white truncate">{user?.prenom} {user?.nom}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-[11px] text-emerald-400/70 font-semibold">Identifiant de paiement Binq</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
            {preFillCode && (
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-emerald-400">{formatMontant(parseFloat(preFillMontant), devise)}</span>
                <button onClick={handleResetPreFill} className="text-[10px] text-white/30 hover:text-white/50 font-semibold transition">Montant libre</button>
              </div>
            )}
            <div className="flex flex-col items-center">
              <p className="text-xs font-bold text-white/60 mb-3">Montrez ce QR pour recevoir de l&apos;argent</p>
              <div className="bg-white rounded-2xl p-3 mb-4">
                {preFillUrl ? (
                  <QRCodeSVG id="personal-qr-code" value={preFillUrl} size={220} bgColor="#FFFFFF" fgColor="#000000" level="H" includeMargin={true} />
                ) : (
                  <div className="w-[220px] h-[220px] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              <div className="w-full grid grid-cols-3 gap-2">
                <button onClick={handleShare} className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold transition-all active:scale-95">
                  <Share2 className="w-4 h-4" /><span className="text-[10px]">Partager</span>
                </button>
                <button onClick={handleCopy} className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white/60 text-xs font-bold transition-all active:scale-95">
                  {copied ? (<><Check className="w-4 h-4 text-emerald-400" /><span className="text-[10px] text-emerald-400">Copié !</span></>) : (<><Copy className="w-4 h-4" /><span className="text-[10px]">Copier</span></>)}
                </button>
                <button onClick={handleDownload} className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white/40 text-xs font-bold transition-all active:scale-95">
                  <Download className="w-4 h-4" /><span className="text-[10px]">Image</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pre-fill amount */}
          {!preFillCode && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
              {!showPreFill ? (
                <button onClick={() => setShowPreFill(true)} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white/40 hover:text-white/60 transition">
                  <Banknote className="w-3.5 h-3.5" />Définir un montant précis
                </button>
              ) : (
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={DEVISES[devise].minTransfer}
                        step={DEVISES[devise].decimals === 0 ? "1" : "0.01"}
                        placeholder={DEVISES[devise].decimals === 0 ? "5 000" : "10.00"}
                        value={preFillMontant}
                        onChange={(e) => setPreFillMontant(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm font-bold outline-none focus:border-emerald-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 text-xs">{DEVISES[devise].symbol}</span>
                    </div>
                    <button
                      onClick={handleGeneratePreFill}
                      disabled={preFillLoading || !preFillMontant || parseFloat(preFillMontant) <= 0}
                      className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition disabled:opacity-40 active:scale-95"
                    >
                      {preFillLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Générer"}
                    </button>
                  </div>
                  <button onClick={() => { setShowPreFill(false); setPreFillMontant(""); }} className="w-full text-[10px] text-white/25 hover:text-white/40 transition">
                    Annuler
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Link preview */}
          <div className="flex items-center gap-2 bg-white/[0.02] rounded-xl px-3 py-2 border border-white/[0.04]">
            <QrCode className="w-3.5 h-3.5 text-white/15 shrink-0" />
            <p className="text-[10px] text-white/25 font-mono truncate">{preFillUrl}</p>
          </div>

          {/* How it works */}
          <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-3">
            <p className="text-[11px] text-emerald-400/80 font-semibold mb-1">Comment ça marche ?</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-black text-emerald-400">1</span>
                </div>
                <p className="text-[10px] text-white/30">Montrez votre QR ou partagez le lien</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-black text-emerald-400">2</span>
                </div>
                <p className="text-[10px] text-white/30">L&apos;envoyeur scanne avec Binq</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-black text-emerald-400">3</span>
                </div>
                <p className="text-[10px] text-white/30">Il choisit le montant et valide</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-black text-emerald-400">4</span>
                </div>
                <p className="text-[10px] text-white/30">Argent reçu instantanément</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════ */}
      {/* ══ SCANNER TAB ════ */}
      {/* ═════════════════════ */}
      {tab === "scanner" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Hidden div for photo QR decoding */}
          <div id="qr-photo-decoder" style={{ display: "none" }} />
          {/* Hidden file input for photo capture */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />

          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
            <div ref={scannerRef} className="relative" style={{ minHeight: scanning ? 320 : "auto" }}>
              <div id="qr-reader" className="w-full" style={{ minHeight: scanning ? 320 : 0, overflow: "hidden", borderRadius: 12 }} />
              {!scanning && !scanError && (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                    <Camera className="w-10 h-10 text-white/15" />
                  </div>
                  <p className="text-white/50 font-bold text-sm mb-1">Scanner un QR Code</p>
                  <p className="text-white/20 text-xs text-center mb-5">Pointez la caméra vers un QR Code Binq</p>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button onClick={startScanner} className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-all active:scale-95">
                      <ScanLine className="w-5 h-5" />Scan en direct
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoDecoding}
                      className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-white/[0.06] text-white/80 font-bold hover:bg-white/[0.1] transition-all active:scale-95 border border-white/[0.08]"
                    >
                      {photoDecoding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                      {photoDecoding ? "Analyse..." : "Prendre une photo"}
                    </button>
                    <p className="text-[10px] text-white/20 text-center">Si le scan ne marche pas, prenez une photo du QR Code</p>
                  </div>
                </div>
              )}
              {scanning && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/60 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      Scan en cours...
                    </p>
                    <button onClick={stopScanner} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs font-bold hover:bg-white/20 transition">
                      <XCircle className="w-3.5 h-3.5" />Arrêter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {scanError && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-center space-y-3">
              <p className="text-sm text-red-400 font-semibold">{scanError}</p>
              <div className="flex gap-2 justify-center">
                <button onClick={startScanner} className="text-xs text-emerald-400 font-bold hover:text-emerald-300 transition px-3 py-1.5 rounded-lg bg-emerald-500/10">
                  Réessayer le scan
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoDecoding}
                  className="text-xs text-white/60 font-bold hover:text-white/80 transition px-3 py-1.5 rounded-lg bg-white/[0.06]"
                >
                  📸 Prendre une photo
                </button>
              </div>
            </div>
          )}

          {/* Photo capture option (always visible when scanning) */}
          {scanning && (
            <button
              onClick={() => { stopScanner(); setTimeout(() => fileInputRef.current?.click(), 100); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-bold hover:bg-white/[0.08] transition active:scale-95"
            >
              <Camera className="w-4 h-4" />Le scan ne marche pas ? Prendre une photo
            </button>
          )}

          {/* Manual code input fallback */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
            <p className="text-xs text-white/40 font-semibold mb-2.5">Entrez le code manuellement</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Code ou lien Binq"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none focus:border-emerald-500/40 transition-colors placeholder:text-white/15"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manualCode.trim()) {
                    const val = manualCode.trim();
                    try {
                      const url = new URL(val);
                      if (url.pathname.startsWith("/pay/")) { router.push(url.pathname); return; }
                    } catch { /* not a URL */ }
                    if (val.startsWith("/pay/")) { router.push(val); return; }
                    if (/^[a-zA-Z0-9_-]+$/.test(val)) { router.push(`/pay/${val}`); return; }
                    setScanError("Code invalide. Entrez un lien Binq ou un code de paiement.");
                  }
                }}
              />
              <button
                onClick={() => {
                  const val = manualCode.trim();
                  if (!val) return;
                  try {
                    const url = new URL(val);
                    if (url.pathname.startsWith("/pay/")) { router.push(url.pathname); return; }
                  } catch { /* not a URL */ }
                  if (val.startsWith("/pay/")) { router.push(val); return; }
                  if (/^[a-zA-Z0-9_-]+$/.test(val)) { router.push(`/pay/${val}`); return; }
                  setScanError("Code invalide. Entrez un lien Binq ou un code de paiement.");
                }}
                disabled={!manualCode.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition disabled:opacity-30 active:scale-95"
              >
                Payer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════ */}
      {/* ══ ENCAISSER TAB (POS) ══════════ */}
      {/* ══════════════════════════════════ */}
      {tab === "encaisser" && (
        <div className="space-y-4 animate-in fade-in duration-200">

          {posStep === "amount" && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                  <Banknote className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-sm font-bold text-white">Montant à encaisser</p>
                <p className="text-[11px] text-white/30 mt-0.5">Saisissez le montant de la vente</p>
              </div>

              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center bg-white/[0.05] rounded-lg overflow-hidden">
                  {DEVISE_LIST.map((d) => (
                    <button key={d} onClick={() => setDevise(d)} className={`px-3 py-1.5 text-xs font-bold transition-all ${devise === d ? "bg-emerald-500/30 text-emerald-400" : "text-white/30 hover:text-white/50"}`}>
                      {DEVISES[d].flag} {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative mb-5">
                <input
                  type="number"
                  min={DEVISES[devise].minTransfer}
                  step={DEVISES[devise].decimals === 0 ? "1" : "0.01"}
                  placeholder={DEVISES[devise].decimals === 0 ? "5 000" : "10.00"}
                  value={posMontant}
                  onChange={(e) => setPosMontant(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-4 text-3xl font-black text-white text-center outline-none focus:border-emerald-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-sm font-bold">{DEVISES[devise].symbol}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-5">
                {(devise === "XOF" ? [500, 1000, 2500, 5000] : [5, 10, 25, 50]).map((amt) => (
                  <button key={amt} onClick={() => setPosMontant(String(amt))} className="py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 text-xs font-bold transition-all active:scale-95">
                    {amt.toLocaleString("fr-FR")}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGeneratePOS}
                disabled={posLoading || !posMontant || parseFloat(posMontant) <= 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {posLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
                {posLoading ? "Génération..." : "Générer le QR Code"}
              </button>
            </div>
          )}

          {posStep === "waiting" && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
              <div className="text-center mb-4">
                <p className="text-sm font-bold text-white mb-1">
                  Montant : <span className="text-emerald-400">{formatMontant(parseFloat(posMontant), devise)}</span>
                </p>
                <p className="text-[11px] text-white/30">Le client doit scanner ce QR Code pour payer</p>
              </div>
              <div className="flex justify-center mb-5">
                <div className="bg-white rounded-2xl p-4">
                  {posPayUrl ? (
                    <QRCodeSVG id={`qr-pos-${posCode}`} value={posPayUrl} size={240} bgColor="#FFFFFF" fgColor="#000000" level="H" includeMargin={true} />
                  ) : (
                    <div className="w-[240px] h-[240px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-gray-400 animate-spin" /></div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-sm text-white/50 font-semibold">En attente de paiement...</p>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.02] rounded-xl px-3 py-2.5 border border-white/[0.04] mb-4">
                <QrCode className="w-3.5 h-3.5 text-white/15 shrink-0" />
                <p className="text-[11px] text-white/25 font-mono truncate">{posPayUrl}</p>
              </div>
              <button onClick={handleCancelPOS} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white/50 font-bold text-sm transition-all active:scale-[0.98]">
                <XCircle className="w-4 h-4" />Annuler cette vente
              </button>
            </div>
          )}

          {posStep === "success" && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center animate-in zoom-in-95 duration-300">
              <SuccessConfetti />
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-1">Paiement reçu !</h2>
              <p className="text-3xl font-black text-emerald-400 mb-2">{formatMontant(parseFloat(posMontant), devise)}</p>
              {posPayer && (
                <p className="text-sm text-white/40 mb-5">Payé par <span className="text-white/70 font-semibold">{posPayer}</span></p>
              )}
              <button
                onClick={() => { resetPOS(); fetchTerminals(); }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-all active:scale-[0.98]"
              >
                <RefreshCw className="w-5 h-5" />Nouvelle vente
              </button>
            </div>
          )}

          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <p className="text-xs text-white/50"><span className="text-emerald-400 font-semibold">Encaissement instantané</span> — Le client scanne, paie, vous êtes notifié en temps réel.</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════ */}
      {/* ══ TERMINAUX TAB ═══════════════ */}
      {/* ══════════════════════════════════ */}
      {tab === "terminaux" && (
        <div className="space-y-4 animate-in fade-in duration-200">

          {/* Explainer */}
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <p className="text-xs text-white/50"><span className="text-emerald-400 font-semibold">QR réutilisables</span> — Vos clients scannent et paient, sans limite d&apos;utilisation.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
              <p className="text-lg font-black text-emerald-400">{stats.paymentsCount}</p>
              <p className="text-[10px] text-white/30 font-semibold">Ventes</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
              <p className="text-lg font-black text-white">{formatMontant(stats.totalReceived, devise)}</p>
              <p className="text-[10px] text-white/30 font-semibold">Total reçu</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
              <p className="text-lg font-black text-white">{stats.totalTerminals}</p>
              <p className="text-[10px] text-white/30 font-semibold">QR actifs</p>
            </div>
          </div>

          {/* Create button */}
          {!showCreatePerm && (
            <button onClick={() => setShowCreatePerm(true)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-sm transition-all active:scale-[0.98] border border-emerald-500/20">
              <Plus className="w-5 h-5" />Créer un QR permanent
            </button>
          )}

          {/* Create form */}
          {showCreatePerm && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Nouveau QR permanent</p>
                <button onClick={() => setShowCreatePerm(false)} className="text-white/30 hover:text-white/60"><XCircle className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPermType("libre")} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${permType === "libre" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/[0.04] text-white/40 border border-white/[0.06]"}`}>Montant libre</button>
                <button onClick={() => setPermType("fixe")} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${permType === "fixe" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/[0.04] text-white/40 border border-white/[0.06]"}`}>Montant fixe</button>
              </div>
              {permType === "fixe" && (
                <div className="relative">
                  <input type="number" min={DEVISES[devise].minTransfer} step={DEVISES[devise].decimals === 0 ? "1" : "0.01"} placeholder="Montant" value={permMontant} onChange={(e) => setPermMontant(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-xs">{DEVISES[devise].symbol}</span>
                </div>
              )}
              <input type="text" placeholder="Description (ex: Café, Coiffure...)" value={permDesc} onChange={(e) => setPermDesc(e.target.value)} maxLength={60} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 placeholder-white/20 transition-colors" />
              <div className="flex items-center gap-2">
                {DEVISE_LIST.map((d) => (
                  <button key={d} onClick={() => setDevise(d)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${devise === d ? "bg-emerald-500/30 text-emerald-400" : "bg-white/[0.04] text-white/30"}`}>{DEVISES[d].flag} {d}</button>
                ))}
              </div>
              <button onClick={handleCreatePermanent} disabled={creatingPerm || (permType === "fixe" && (!permMontant || parseFloat(permMontant) <= 0))} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40">
                {creatingPerm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creatingPerm ? "Création..." : "Créer"}
              </button>
            </div>
          )}

          {/* Terminals list */}
          {loadingTerminals ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
          ) : terminals.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3"><QrCode className="w-7 h-7 text-white/10" /></div>
              <p className="text-white/50 font-bold text-sm mb-1">Aucun QR permanent</p>
              <p className="text-white/20 text-xs">Créez un QR code réutilisable pour votre commerce</p>
            </div>
          ) : (
            <div className="space-y-3">
              {terminals.map((t) => (
                <div key={t.id} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{t.description}</p>
                        <p className="text-[11px] text-white/25 font-mono">{t.code}</p>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        {t.montant ? (
                          <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">{formatMontant(t.montant, (t.devise as DeviseCode) || devise)}</span>
                        ) : (
                          <span className="px-2 py-1 rounded-lg bg-white/[0.05] text-white/40 text-[10px] font-bold">Libre</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => setExpandedQR(expandedQR === t.code ? null : t.code)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 text-xs font-bold transition-all active:scale-95">
                        <QrCode className="w-3.5 h-3.5" />{expandedQR === t.code ? "Masquer" : "QR Code"}
                      </button>
                      <button onClick={() => handleCopyTerminal(t.code)} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 text-xs font-bold transition-all active:scale-95">
                        {copiedCode === t.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => handleShareTerminal(t.code, t.description)} className="flex items-center justify-center py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 text-xs font-bold transition-all active:scale-95">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteTerminal(t.id)} className="flex items-center justify-center py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/60 text-xs transition-all active:scale-95">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {expandedQR === t.code && (
                    <div className="border-t border-white/[0.04] p-5 flex flex-col items-center gap-3 bg-white/[0.01]">
                      <div className="bg-white rounded-2xl p-3">
                        <QRCodeSVG id={`qr-${t.code}`} value={`${origin}/pay/${t.code}`} size={220} bgColor="#FFFFFF" fgColor="#000000" level="H" includeMargin={true} />
                      </div>
                      <button onClick={() => handleDownloadQR(t.code, t.description)} className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:text-emerald-300 transition">
                        <Download className="w-3.5 h-3.5" />Télécharger le QR
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}


        </div>
      )}
    </div>
  );
}
