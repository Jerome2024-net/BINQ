"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  Loader2,
  ArrowLeft,
  Ticket,
  Check,
  X,
  AlertCircle,
  Share2,
  Shield,
  Heart,
  Send,
  Users,
  Download,
  ImageDown,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";

interface TicketData {
  id: string;
  qr_code: string;
  reference: string;
  buyer_name: string;
  buyer_email: string | null;
  buyer_phone: string | null;
  quantite: number;
  montant_total: number;
  devise: string;
  statut: "valid" | "used" | "cancelled" | "expired";
  scanned_at: string | null;
  created_at: string;
  ticket_types: {
    nom: string;
    description: string | null;
    prix: number;
  };
  events: {
    id: string;
    nom: string;
    description: string | null;
    date_debut: string;
    heure_debut: string | null;
    date_fin: string | null;
    lieu: string;
    adresse: string | null;
    ville: string | null;
    logo_url: string | null;
    cover_url: string | null;
    devise: string;
  };
}

export default function BilletPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadTicketAsImage = useCallback(async () => {
    if (!ticket || !qrRef.current) return;
    setSaving(true);
    try {
      const svgEl = qrRef.current.querySelector("svg");
      if (!svgEl) return;

      // Convert QR SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = svgUrl;
      });

      // Canvas setup
      const W = 900;
      const H = 1400;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);

      // White ticket card
      const cardX = 40, cardY = 40, cardW = W - 80, cardR = 32;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, H - 80, cardR);
      ctx.fill();

      // Green header bar
      ctx.fillStyle = "#10B981";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, 200, [cardR, cardR, 0, 0]);
      ctx.fill();

      // "BILLET" label
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("BILLET", 80, 100);

      // Event name
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 36px -apple-system, BlinkMacSystemFont, sans-serif";
      const eventName = ticket.events.nom;
      ctx.fillText(eventName.length > 28 ? eventName.substring(0, 28) + "…" : eventName, 80, 150);

      // Date + lieu
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "600 22px -apple-system, BlinkMacSystemFont, sans-serif";
      const dateStr = new Date(ticket.events.date_debut + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      ctx.fillText(dateStr, 80, 200);

      // Dashed line
      ctx.strokeStyle = "#E5E7EB";
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 280);
      ctx.lineTo(W - 80, 280);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cutout circles
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(cardX, 280, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cardX + cardW, 280, 20, 0, Math.PI * 2);
      ctx.fill();

      // QR Code
      const qrSize = 360;
      const qrX = (W - qrSize) / 2;
      const qrY = 320;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      URL.revokeObjectURL(svgUrl);

      // "Scannez à l'entrée" label
      ctx.fillStyle = "#6B7280";
      ctx.font = "600 20px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Présentez ce QR à l'entrée", W / 2, qrY + qrSize + 40);

      // Ticket details
      ctx.textAlign = "left";
      let yPos = qrY + qrSize + 100;
      const details = [
        { label: "Référence", value: ticket.reference },
        { label: "Type", value: ticket.ticket_types.nom },
        { label: "Nom", value: ticket.buyer_name },
        { label: "Prix", value: ticket.montant_total > 0 ? formatMontant(ticket.montant_total, (ticket.devise || "XOF") as DeviseCode) : "Gratuit" },
        { label: "Lieu", value: `${ticket.events.lieu}${ticket.events.ville ? `, ${ticket.events.ville}` : ""}` },
      ];

      for (const d of details) {
        ctx.fillStyle = "#9CA3AF";
        ctx.font = "500 20px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(d.label, 80, yPos);
        ctx.fillStyle = "#111827";
        ctx.font = "700 20px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(d.value.length > 30 ? d.value.substring(0, 30) + "…" : d.value, W - 80, yPos);
        ctx.textAlign = "left";
        yPos += 50;
      }

      // Powered by Binq
      ctx.fillStyle = "#6B7280";
      ctx.font = "500 18px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Propulsé par Binq", W / 2, H - 70);

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `billet-${ticket.events.nom.replace(/[^a-zA-Z0-9]/g, "-")}-${ticket.reference}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }, "image/png");
    } catch (e) {
      console.error("Erreur lors du téléchargement:", e);
    } finally {
      setSaving(false);
    }
  }, [ticket]);

  useEffect(() => {
    setMounted(true);
    loadTicket();
  }, []);

  async function loadTicket() {
    try {
      const res = await fetch(`/api/tickets/${params.code}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTicket(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(time: string | null) {
    if (!time) return "";
    return time.slice(0, 5);
  }

  const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
    valid: { label: "Valide", color: "text-blue-400", icon: Check, bg: "bg-blue-500/10 border-blue-500/20" },
    used: { label: "Utilisé", color: "text-gray-400", icon: Check, bg: "bg-gray-500/10 border-gray-500/20" },
    cancelled: { label: "Annulé", color: "text-red-400", icon: X, bg: "bg-red-500/10 border-red-500/20" },
    expired: { label: "Expiré", color: "text-yellow-400", icon: AlertCircle, bg: "bg-yellow-500/10 border-yellow-500/20" },
  };
  const status = ticket ? (statusConfig[ticket.statut] || statusConfig.valid) : statusConfig.valid;
  const StatusIcon = status.icon;
  const devise = (ticket?.devise || "XOF") as DeviseCode;
  const qrValue = mounted && ticket ? `${window.location.origin}/billet/${ticket.qr_code}` : ticket?.qr_code || "";
  // ═══ LOADING ═══
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  // ═══ ERROR ═══
  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
        <p className="text-white font-bold text-lg mb-2">Billet introuvable</p>
        <p className="text-gray-400 text-sm mb-6">Ce billet n&apos;existe pas ou le lien est invalide</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm">
          Retour
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            const url = window.location.href;
            if (navigator.share) {
              navigator.share({ title: `Billet — ${ticket.events.nom}`, url }).catch(() => {});
            } else {
              navigator.clipboard.writeText(url);
            }
          }}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Billet Card */}
      <div className="px-5 mt-2 lg:mt-6">
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* Top — Event info */}
          <div className="bg-black p-5 pb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Billet</p>
            <h1 className="text-xl lg:text-2xl font-black text-white mb-3">{ticket.events.nom}</h1>

            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-300 capitalize">{formatDate(ticket.events.date_debut)}</p>
            </div>
            {ticket.events.heure_debut && (
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-300">{formatTime(ticket.events.heure_debut)}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-300">
                {ticket.events.lieu}
                {ticket.events.ville ? `, ${ticket.events.ville}` : ""}
              </p>
            </div>
          </div>

          {/* Ticket cutout */}
          <div className="relative h-6">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-black rounded-full" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-black rounded-full" />
            <div className="border-t-2 border-dashed border-gray-200 absolute top-1/2 left-6 right-6" />
          </div>

          {/* Bottom — QR + Details */}
          <div className="p-5 pt-3">
            {/* Statut */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border mb-4 ${status.bg}`}>
              <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
              <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
            </div>

            {/* QR Code — toujours visible */}
            <div className="flex justify-center mb-5">
              <div className="relative" ref={qrRef}>
                <div className={`bg-white p-3 rounded-2xl border-2 border-gray-100 ${ticket.statut !== "valid" ? "opacity-20" : ""}`}>
                  {qrValue ? (
                    <QRCodeSVG value={qrValue} size={200} level="H" includeMargin />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                    </div>
                  )}
                </div>
                {ticket.statut === "used" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-gray-100 rounded-full p-4">
                      <Check className="w-10 h-10 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Infos */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Référence</span>
                <span className="text-xs font-bold text-gray-900 font-mono">{ticket.reference}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Type</span>
                <span className="text-xs font-bold text-gray-900">{ticket.ticket_types.nom}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Nom</span>
                <span className="text-xs font-bold text-gray-900">{ticket.buyer_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Prix</span>
                <span className="text-xs font-bold text-gray-900">
                  {ticket.montant_total > 0 ? formatMontant(ticket.montant_total, devise) : "Gratuit"}
                </span>
              </div>
              {ticket.scanned_at && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Scanné le</span>
                  <span className="text-xs font-bold text-gray-900">
                    {new Date(ticket.scanned_at).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security note */}
      <div className="px-5 mt-6 mb-3">
        <div className="flex items-center gap-2 justify-center">
          <Shield className="w-3.5 h-3.5 text-gray-600" />
          <p className="text-[11px] text-gray-600">Présentez ce QR code à l&apos;entrée</p>
        </div>
      </div>

      {/* Download / Save to gallery */}
      {ticket.statut === "valid" && (
        <div className="px-5 mb-3">
          <button
            onClick={downloadTicketAsImage}
            disabled={saving}
            className="w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white rounded-2xl p-4 flex items-center gap-3 transition disabled:opacity-60"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              {saving ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : saved ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <ImageDown className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-bold">{saved ? "Billet enregistré !" : "Enregistrer mon billet"}</p>
              <p className="text-xs text-white/70">{saved ? "Image sauvegardée dans vos fichiers" : "Télécharger en image PNG"}</p>
            </div>
            <Download className="w-4 h-4 text-white/70" />
          </button>
        </div>
      )}

      {/* ═══ Social Invite — "Partager avec mes amis" ═══ */}
      {ticket.statut === "valid" && (
        <div className="px-5 mb-6">
          <button
            onClick={() => {
              const baseUrl = window.location.origin;
              const shareUrl = `${baseUrl}/evenement/${ticket.events.id}?ref=${encodeURIComponent(ticket.buyer_name)}`;
              const shareText = `Je vais à ${ticket.events.nom} 🎉 Rejoins-moi !`;
              
              if (navigator.share) {
                navigator.share({
                  title: ticket.events.nom,
                  text: shareText,
                  url: shareUrl,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
              }
            }}
            className="w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-4 flex items-center gap-3 transition active:scale-[0.98] hover:from-purple-600/30 hover:to-pink-600/30"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-bold text-white">Partager avec mes amis</p>
              <p className="text-xs text-gray-400">Les meilleurs moments se vivent ensemble</p>
            </div>
            <Send className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-[11px] text-gray-600 font-medium">
          Propulsé par <span className="text-white font-bold">Binq</span>
        </p>
      </div>
      </div>{/* end max-w container */}
    </div>
  );
}
