"use client";

import { useState, useEffect } from "react";
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
    valid: { label: "Valide", color: "text-emerald-400", icon: Check, bg: "bg-emerald-500/10 border-emerald-500/20" },
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
      <div className="px-5 mt-2">
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* Top — Event info */}
          <div className="bg-black p-5 pb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Billet</p>
            <h1 className="text-xl font-black text-white mb-3">{ticket.events.nom}</h1>

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
              <div className="relative">
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
    </div>
  );
}
