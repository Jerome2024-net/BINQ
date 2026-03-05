"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import {
  Store,
  CreditCard,
  QrCode,
  BarChart3,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Banknote,
  ArrowDownLeft,
  Share2,
} from "lucide-react";
import { type DeviseCode, DEVISES, DEFAULT_DEVISE, formatMontant, DEVISE_LIST } from "@/lib/currencies";

type Tab = "encaisser" | "permanents" | "ventes";

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

export default function MarchandPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("encaisser");
  const [devise, setDevise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("binq_devise") as DeviseCode) || DEFAULT_DEVISE;
    }
    return DEFAULT_DEVISE;
  });

  // ── POS (Encaisser) state ──
  const [posStep, setPosStep] = useState<PosStep>("amount");
  const [posMontant, setPosMontant] = useState("");
  const [posCode, setPosCode] = useState("");
  const [posLoading, setPosLoading] = useState(false);
  const [posPayer, setPosPayer] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // ── Permanents state ──
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

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // ── Fetch terminals ──
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

  // ── Cleanup polling on unmount ──
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // ── POS: Générer QR terminal ──
  const handleGeneratePOS = async () => {
    const montant = parseFloat(posMontant);
    if (!montant || montant <= 0) return;
    const min = DEVISES[devise].minTransfer;
    if (montant < min) return;

    setPosLoading(true);
    try {
      const res = await fetch("/api/merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant,
          devise,
          description: "Vente terminal",
          terminal: true, // One-time QR pour le mode caisse
        }),
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

  // ── POS: Polling ──
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
        }
      } catch { /* ignore */ }
    }, 3000);
  };

  // ── POS: Annuler ──
  const handleCancelPOS = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    // Optionally delete the terminal QR
    if (posCode) {
      // Find the terminal to delete
      try {
        const res = await fetch("/api/merchant");
        const data = await res.json();
        const t = (data.terminals || []).find((t: Terminal) => t.code === posCode);
        if (t) {
          await fetch(`/api/merchant?id=${t.id}`, { method: "DELETE" });
        }
      } catch { /* ignore */ }
    }
    resetPOS();
  };

  // ── POS: Reset ──
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
          terminal: false, // Permanent QR (réutilisable)
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

  // ── Delete terminal ──
  const handleDeleteTerminal = async (id: string) => {
    try {
      await fetch(`/api/merchant?id=${id}`, { method: "DELETE" });
      setTerminals((prev) => prev.filter((t) => t.id !== id));
    } catch { /* ignore */ }
  };

  // ── Copy link ──
  const handleCopy = async (code: string) => {
    const url = `${origin}/pay/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch { /* ignore */ }
  };

  // ── Share ──
  const handleShare = async (code: string, desc: string) => {
    const url = `${origin}/pay/${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payer - ${desc}`,
          text: `Scannez pour payer via Binq`,
          url,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopy(code);
    }
  };

  // ── Download QR ──
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
        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Store className="w-5 h-5 text-emerald-400" />
          Terminal Marchand
        </h1>
        <p className="text-xs text-white/30 mt-0.5">Acceptez les paiements par QR Code</p>
      </div>

      {/* Stats bar */}
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

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
        {([
          { key: "encaisser" as Tab, icon: CreditCard, label: "Encaisser" },
          { key: "permanents" as Tab, icon: QrCode, label: "QR Permanents" },
          { key: "ventes" as Tab, icon: BarChart3, label: "Ventes" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
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

      {/* ═══════════════════════════════════ */}
      {/* ══ ENCAISSER TAB (POS Terminal) ══ */}
      {/* ═══════════════════════════════════ */}
      {tab === "encaisser" && (
        <div className="space-y-4 animate-in fade-in duration-200">

          {/* Step 1: Montant */}
          {posStep === "amount" && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                  <Banknote className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-sm font-bold text-white">Montant à encaisser</p>
                <p className="text-[11px] text-white/30 mt-0.5">Saisissez le montant de la vente</p>
              </div>

              {/* Currency switcher */}
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center bg-white/[0.05] rounded-lg overflow-hidden">
                  {DEVISE_LIST.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDevise(d)}
                      className={`px-3 py-1.5 text-xs font-bold transition-all ${
                        devise === d
                          ? "bg-emerald-500/30 text-emerald-400"
                          : "text-white/30 hover:text-white/50"
                      }`}
                    >
                      {DEVISES[d].flag} {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
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

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {(devise === "XOF" ? [500, 1000, 2500, 5000] : [5, 10, 25, 50]).map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setPosMontant(String(amt))}
                    className="py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 text-xs font-bold transition-all active:scale-95"
                  >
                    {amt.toLocaleString("fr-FR")}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGeneratePOS}
                disabled={posLoading || !posMontant || parseFloat(posMontant) <= 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {posLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <QrCode className="w-5 h-5" />
                )}
                {posLoading ? "Génération..." : "Générer le QR Code"}
              </button>
            </div>
          )}

          {/* Step 2: QR affiché, attente paiement */}
          {posStep === "waiting" && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
              <div className="text-center mb-4">
                <p className="text-sm font-bold text-white mb-1">
                  Montant : <span className="text-emerald-400">{formatMontant(parseFloat(posMontant), devise)}</span>
                </p>
                <p className="text-[11px] text-white/30">Le client doit scanner ce QR Code pour payer</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-5">
                <div className="bg-white rounded-2xl p-4">
                  {posPayUrl ? (
                    <QRCodeSVG
                      id={`qr-pos-${posCode}`}
                      value={posPayUrl}
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
              </div>

              {/* Waiting animation */}
              <div className="flex items-center justify-center gap-2 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-sm text-white/50 font-semibold">En attente de paiement...</p>
              </div>

              {/* Payment code */}
              <div className="flex items-center gap-2 bg-white/[0.02] rounded-xl px-3 py-2.5 border border-white/[0.04] mb-4">
                <QrCode className="w-3.5 h-3.5 text-white/15 shrink-0" />
                <p className="text-[11px] text-white/25 font-mono truncate">{posPayUrl}</p>
              </div>

              {/* Cancel */}
              <button
                onClick={handleCancelPOS}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white/50 font-bold text-sm transition-all active:scale-[0.98]"
              >
                <XCircle className="w-4 h-4" />
                Annuler cette vente
              </button>
            </div>
          )}

          {/* Step 3: Succès */}
          {posStep === "success" && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-1">Paiement reçu !</h2>
              <p className="text-3xl font-black text-emerald-400 mb-2">
                {formatMontant(parseFloat(posMontant), devise)}
              </p>
              {posPayer && (
                <p className="text-sm text-white/40 mb-5">Payé par <span className="text-white/70 font-semibold">{posPayer}</span></p>
              )}
              <button
                onClick={() => {
                  resetPOS();
                  fetchTerminals(); // Refresh stats
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-all active:scale-[0.98]"
              >
                <RefreshCw className="w-5 h-5" />
                Nouvelle vente
              </button>
            </div>
          )}

          {/* Infos */}
          <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-4">
            <p className="text-xs text-emerald-400/80 font-semibold mb-1">Mode caisse</p>
            <ul className="text-[11px] text-white/30 space-y-1">
              <li>• Saisissez le montant de chaque vente</li>
              <li>• Un QR Code unique est généré pour cette transaction</li>
              <li>• Le client scanne et paie depuis son app Binq</li>
              <li>• Vous recevez la confirmation en temps réel</li>
            </ul>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════ */}
      {/* ══ QR PERMANENTS TAB ════════════ */}
      {/* ═══════════════════════════════════ */}
      {tab === "permanents" && (
        <div className="space-y-4 animate-in fade-in duration-200">

          {/* Create button */}
          {!showCreatePerm && (
            <button
              onClick={() => setShowCreatePerm(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-sm transition-all active:scale-[0.98] border border-emerald-500/20"
            >
              <Plus className="w-5 h-5" />
              Créer un QR permanent
            </button>
          )}

          {/* Create form */}
          {showCreatePerm && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Nouveau QR permanent</p>
                <button onClick={() => setShowCreatePerm(false)} className="text-white/30 hover:text-white/60">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Type selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPermType("libre")}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    permType === "libre"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/[0.04] text-white/40 border border-white/[0.06]"
                  }`}
                >
                  Montant libre
                </button>
                <button
                  onClick={() => setPermType("fixe")}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    permType === "fixe"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/[0.04] text-white/40 border border-white/[0.06]"
                  }`}
                >
                  Montant fixe
                </button>
              </div>

              {/* Amount (only for fixe) */}
              {permType === "fixe" && (
                <div className="relative">
                  <input
                    type="number"
                    min={DEVISES[devise].minTransfer}
                    step={DEVISES[devise].decimals === 0 ? "1" : "0.01"}
                    placeholder="Montant"
                    value={permMontant}
                    onChange={(e) => setPermMontant(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-xs">{DEVISES[devise].symbol}</span>
                </div>
              )}

              {/* Description */}
              <input
                type="text"
                placeholder="Description (ex: Café, Coiffure...)"
                value={permDesc}
                onChange={(e) => setPermDesc(e.target.value)}
                maxLength={60}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 placeholder-white/20 transition-colors"
              />

              {/* Currency */}
              <div className="flex items-center gap-2">
                {DEVISE_LIST.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDevise(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      devise === d
                        ? "bg-emerald-500/30 text-emerald-400"
                        : "bg-white/[0.04] text-white/30"
                    }`}
                  >
                    {DEVISES[d].flag} {d}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCreatePermanent}
                disabled={creatingPerm || (permType === "fixe" && (!permMontant || parseFloat(permMontant) <= 0))}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
              >
                {creatingPerm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creatingPerm ? "Création..." : "Créer"}
              </button>
            </div>
          )}

          {/* Terminals list */}
          {loadingTerminals ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : terminals.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-7 h-7 text-white/10" />
              </div>
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
                          <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                            {formatMontant(t.montant, (t.devise as DeviseCode) || devise)}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-lg bg-white/[0.05] text-white/40 text-[10px] font-bold">
                            Libre
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => setExpandedQR(expandedQR === t.code ? null : t.code)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 text-xs font-bold transition-all active:scale-95"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        {expandedQR === t.code ? "Masquer" : "QR Code"}
                      </button>
                      <button
                        onClick={() => handleCopy(t.code)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 text-xs font-bold transition-all active:scale-95"
                      >
                        {copiedCode === t.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleShare(t.code, t.description)}
                        className="flex items-center justify-center py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 text-xs font-bold transition-all active:scale-95"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTerminal(t.id)}
                        className="flex items-center justify-center py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/60 text-xs transition-all active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded QR */}
                  {expandedQR === t.code && (
                    <div className="border-t border-white/[0.04] p-5 flex flex-col items-center gap-3 bg-white/[0.01]">
                      <div className="bg-white rounded-2xl p-3">
                        <QRCodeSVG
                          id={`qr-${t.code}`}
                          value={`${origin}/pay/${t.code}`}
                          size={180}
                          bgColor="#FFFFFF"
                          fgColor="#0a0a0a"
                          level="H"
                          includeMargin={false}
                        />
                      </div>
                      <button
                        onClick={() => handleDownloadQR(t.code, t.description)}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:text-emerald-300 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Télécharger le QR
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-4">
            <p className="text-xs text-emerald-400/80 font-semibold mb-1">QR Permanents</p>
            <ul className="text-[11px] text-white/30 space-y-1">
              <li>• Imprimez et affichez le QR dans votre commerce</li>
              <li>• Les clients scannent et paient directement</li>
              <li>• <b className="text-white/40">Libre</b> : le client choisit le montant</li>
              <li>• <b className="text-white/40">Fixe</b> : montant pré-défini (ex: menu, produit)</li>
            </ul>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════ */}
      {/* ══ VENTES TAB ═══════════════════ */}
      {/* ═══════════════════════════════════ */}
      {tab === "ventes" && (
        <VentesTab devise={devise} onRefresh={fetchTerminals} />
      )}
    </div>
  );
}

// ── Ventes / Sales Tab component ──
function VentesTab({ devise, onRefresh }: { devise: DeviseCode; onRefresh: () => void }) {
  const [sales, setSales] = useState<{id: string; montant: number; devise: string; description: string; date: string; payer: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      // Fetch recent transactions (transferts entrants from merchant payments)
      const res = await fetch(`/api/wallet?devise=${devise}`);
      const data = await res.json();

      if (data.transactions) {
        const merchantSales = data.transactions
          .filter((t: { type: string; description: string }) =>
            t.type === "transfert_entrant" &&
            (t.description?.includes("Paiement reçu") || t.description?.includes("[MARCHAND]"))
          )
          .map((t: { id: string; montant: number; devise: string; description: string; created_at: string }) => ({
            id: t.id,
            montant: t.montant,
            devise: t.devise || devise,
            description: t.description.replace("[MARCHAND] ", ""),
            date: t.created_at,
            payer: t.description.replace("Paiement reçu de ", "").split(" — ")[0],
          }));

        setSales(merchantSales);

        // Today stats
        const today = new Date().toDateString();
        const todaySales = merchantSales.filter((s: { date: string }) =>
          new Date(s.date).toDateString() === today
        );
        setTodayCount(todaySales.length);
        setTodayTotal(todaySales.reduce((sum: number, s: { montant: number }) => sum + s.montant, 0));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Today stats */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/10 p-4">
        <p className="text-[11px] text-white/30 font-bold uppercase tracking-wider mb-2">Aujourd&apos;hui</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-white">{formatMontant(todayTotal, devise)}</p>
            <p className="text-xs text-white/40">{todayCount} vente{todayCount !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => { fetchSales(); onRefresh(); }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </div>

      {/* Sales list */}
      {sales.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-7 h-7 text-white/10" />
          </div>
          <p className="text-white/50 font-bold text-sm mb-1">Aucune vente</p>
          <p className="text-white/20 text-xs">Les paiements reçus via vos QR marchands apparaîtront ici</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
          {sales.slice(0, 20).map((sale) => (
            <div key={sale.id} className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white/80 truncate">{sale.payer}</p>
                <p className="text-[10px] text-white/20 mt-0.5">
                  {new Date(sale.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <p className="text-sm font-bold text-emerald-400 tabular-nums">
                +{formatMontant(sale.montant, (sale.devise as DeviseCode) || devise)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
