"use client";

import { Check, X, AlertTriangle, ScanLine, User, Ticket, Hash, Calendar, MapPin, Phone, Shield, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface ScanResultProps {
  result: {
    valid: boolean;
    error?: string;
    status_code?: string;
    ticket?: {
      reference?: string;
      buyer_name?: string;
      buyer_phone?: string;
      type?: string;
      event?: string;
      prix?: number;
      devise?: string;
      scanned_at?: string;
      entry_number?: number;
      total_sold?: number;
    };
  };
  onScanNext: () => void;
  onClose: () => void;
}

export default function ScanResultOverlay({ result, onScanNext, onClose }: ScanResultProps) {
  const [showContent, setShowContent] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Staggered animations
    const t1 = setTimeout(() => setShowContent(true), 100);
    const t2 = setTimeout(() => setShowDetails(true), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const isValid = result.valid;
  const isAlreadyUsed = result.status_code === "ALREADY_USED";
  const isCancelled = result.status_code === "CANCELLED";
  const isExpired = result.status_code === "EXPIRED";
  const isNotFound = result.status_code === "NOT_FOUND";
  const ticket = result.ticket;

  // Color scheme based on result
  const bg = isValid
    ? "from-blue-500 via-blue-600 to-blue-700"
    : isAlreadyUsed
    ? "from-orange-500 via-orange-600 to-orange-700"
    : "from-red-500 via-red-600 to-red-700";

  const iconBg = isValid ? "bg-white/20" : isAlreadyUsed ? "bg-white/20" : "bg-white/20";

  const StatusIcon = isValid ? Check : isAlreadyUsed ? AlertTriangle : X;

  const statusTitle = isValid
    ? "ENTRÉE VALIDÉE"
    : isAlreadyUsed
    ? "DÉJÀ SCANNÉ"
    : isCancelled
    ? "BILLET ANNULÉ"
    : isExpired
    ? "BILLET EXPIRÉ"
    : isNotFound
    ? "BILLET INTROUVABLE"
    : "BILLET INVALIDE";

  const statusSubtitle = isValid
    ? "Accès autorisé"
    : isAlreadyUsed
    ? "Ce billet a déjà été utilisé"
    : isCancelled
    ? "Ce billet a été annulé"
    : isExpired
    ? "Ce billet n'est plus valide"
    : isNotFound
    ? "Aucun billet ne correspond à ce code"
    : result.error || "Vérification échouée";

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Full-screen colored background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${bg} transition-opacity duration-300`} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        {/* Animated icon */}
        <div
          className={`transition-all duration-500 ${
            showContent ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <div className={`w-28 h-28 ${iconBg} rounded-full flex items-center justify-center mb-6 mx-auto`}>
            <div className={`w-20 h-20 bg-white rounded-full flex items-center justify-center ${isValid ? "shadow-lg shadow-blue-800/30" : ""}`}>
              <StatusIcon className={`w-10 h-10 ${isValid ? "text-blue-600" : isAlreadyUsed ? "text-orange-600" : "text-red-600"}`} />
            </div>
          </div>
        </div>

        {/* Status title */}
        <div
          className={`transition-all duration-500 delay-100 text-center ${
            showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">
            {statusTitle}
          </h1>
          <p className="text-white/70 text-base font-medium">
            {statusSubtitle}
          </p>
        </div>

        {/* Entry counter badge — only for valid */}
        {isValid && ticket?.entry_number && (
          <div
            className={`mt-5 transition-all duration-500 delay-200 ${
              showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <span className="text-lg font-black text-blue-600">#{ticket.entry_number}</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Entrée n°{ticket.entry_number}</p>
                <p className="text-white/60 text-xs">{ticket.total_sold} participant{(ticket.total_sold || 0) > 1 ? "s" : ""} au total</p>
              </div>
            </div>
          </div>
        )}

        {/* Ticket details card */}
        {ticket && (
          <div
            className={`w-full max-w-sm mt-6 transition-all duration-500 delay-300 ${
              showDetails ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              {/* Buyer name — prominent */}
              {ticket.buyer_name && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-black text-lg leading-tight">{ticket.buyer_name}</p>
                    {ticket.buyer_phone && (
                      <p className="text-white/50 text-sm flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {ticket.buyer_phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Details grid */}
              <div className="space-y-3">
                {ticket.reference && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-white/40" />
                      <span className="text-white/60 text-sm">Référence</span>
                    </div>
                    <span className="text-white font-bold text-sm font-mono">{ticket.reference}</span>
                  </div>
                )}
                {ticket.type && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-white/40" />
                      <span className="text-white/60 text-sm">Type</span>
                    </div>
                    <span className="text-white font-bold text-sm">{ticket.type}</span>
                  </div>
                )}
                {ticket.event && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white/40" />
                      <span className="text-white/60 text-sm">Événement</span>
                    </div>
                    <span className="text-white font-bold text-sm text-right max-w-[180px] truncate">{ticket.event}</span>
                  </div>
                )}
                {/* Scanned at — for already used */}
                {isAlreadyUsed && ticket.scanned_at && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white/40" />
                      <span className="text-white/60 text-sm">Scanné le</span>
                    </div>
                    <span className="text-white font-bold text-sm">{formatTime(ticket.scanned_at)}</span>
                  </div>
                )}
                {/* Scanned at — for valid (just now) */}
                {isValid && ticket.scanned_at && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white/40" />
                      <span className="text-white/60 text-sm">Heure</span>
                    </div>
                    <span className="text-white font-bold text-sm">
                      {new Date(ticket.scanned_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Not found — no ticket info */}
        {!ticket && isNotFound && (
          <div
            className={`w-full max-w-sm mt-6 transition-all duration-500 delay-300 ${
              showDetails ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
              <Shield className="w-10 h-10 text-white/40 mx-auto mb-3" />
              <p className="text-white/80 text-sm">
                Ce QR code ne correspond à aucun billet.
                Vérifiez que le client a un billet valide.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="relative px-6 pb-8 pt-4">
        <button
          onClick={onScanNext}
          className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black text-base transition active:scale-[0.97] flex items-center justify-center gap-2.5 shadow-lg"
        >
          <ScanLine className="w-5 h-5" />
          Scanner suivant
        </button>
      </div>
    </div>
  );
}
