"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  Loader2,
  ArrowLeft,
  Share2,
  Ticket,
  Users,
  Minus,
  Plus,
  Check,
  AlertCircle,
} from "lucide-react";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";

interface TicketType {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  devise: string;
  quantite_total: number;
  quantite_vendue: number;
  max_par_personne: number;
  is_active: boolean;
}

interface Event {
  id: string;
  nom: string;
  description: string | null;
  date_debut: string;
  heure_debut: string | null;
  date_fin: string | null;
  heure_fin: string | null;
  lieu: string;
  adresse: string | null;
  ville: string | null;
  cover_url: string | null;
  devise: string;
  is_active: boolean;
  ticket_types: TicketType[];
}

export default function EvenementPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Achat
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketCodes, setTicketCodes] = useState<string[]>([]);

  useEffect(() => {
    loadEvent();
  }, []);

  async function loadEvent() {
    try {
      const res = await fetch(`/api/events/${params.id}`);
      if (!res.ok) throw new Error("Événement non trouvé");
      const data = await res.json();
      setEvent(data);
      if (data.ticket_types?.length === 1) {
        setSelectedType(data.ticket_types[0].id);
      }
    } catch {
      setError("Événement non trouvé");
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy() {
    if (!selectedType || !buyerName.trim()) return;
    setBuying(true);
    try {
      const res = await fetch("/api/tickets/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_type_id: selectedType,
          buyer_name: buyerName.trim(),
          buyer_email: buyerEmail.trim() || undefined,
          buyer_phone: buyerPhone.trim() || undefined,
          quantite: qty,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setTicketCodes(data.tickets.map((t: any) => t.qr_code));
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBuying(false);
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

  const selectedTicketType = event?.ticket_types.find((t) => t.id === selectedType);
  const total = selectedTicketType ? selectedTicketType.prix * qty : 0;
  const devise = (event?.devise || "XOF") as DeviseCode;

  // ═══ LOADING ═══
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  // ═══ ERROR ═══
  if (error && !event) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
        <p className="text-white font-bold text-lg mb-2">Événement introuvable</p>
        <p className="text-gray-400 text-sm mb-6">Cet événement n&apos;existe pas ou n&apos;est plus disponible</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm">
          Retour
        </button>
      </div>
    );
  }

  if (!event) return null;

  // ═══ SUCCESS — Billets achetés ═══
  if (success && ticketCodes.length > 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-6 animate-in zoom-in-75 duration-300">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Billet{ticketCodes.length > 1 ? "s" : ""} réservé{ticketCodes.length > 1 ? "s" : ""} !</h1>
        <p className="text-gray-400 text-sm mb-8 text-center">
          {ticketCodes.length > 1 ? `${ticketCodes.length} billets` : "Votre billet"} pour <span className="text-white font-semibold">{event.nom}</span>
        </p>

        <div className="w-full max-w-sm space-y-3">
          {ticketCodes.map((code, i) => (
            <a
              key={code}
              href={`/billet/${code}`}
              className="block w-full bg-white text-black rounded-2xl p-4 text-center font-bold text-sm transition hover:bg-gray-100 active:scale-[0.98]"
            >
              <Ticket className="w-5 h-5 mx-auto mb-1" />
              {ticketCodes.length > 1 ? `Voir le billet ${i + 1}` : "Voir mon billet"}
            </a>
          ))}
        </div>

        <button
          onClick={() => router.back()}
          className="mt-6 text-gray-500 text-sm font-medium hover:text-gray-300 transition"
        >
          Retour
        </button>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-gray-600 font-medium">Propulsé par <span className="text-white font-bold">Binq</span></p>
        </div>
      </div>
    );
  }

  // ═══ PAGE ÉVÉNEMENT ═══
  return (
    <div className="min-h-screen bg-black">
      {/* Cover */}
      <div className="relative">
        {event.cover_url ? (
          <div className="w-full h-56 sm:h-72 relative">
            <img src={event.cover_url} alt={event.nom} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-gray-900 to-gray-800 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Share */}
        <button
          onClick={() => {
            const url = window.location.href;
            if (navigator.share) {
              navigator.share({ title: event.nom, url }).catch(() => {});
            } else {
              navigator.clipboard.writeText(url);
            }
          }}
          className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Event info */}
      <div className="px-5 -mt-8 relative z-10">
        <h1 className="text-2xl font-black text-white mb-3">{event.nom}</h1>

        {/* Date */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white capitalize">{formatDate(event.date_debut)}</p>
            {event.heure_debut && (
              <p className="text-xs text-gray-400">
                {formatTime(event.heure_debut)}
                {event.heure_fin ? ` — ${formatTime(event.heure_fin)}` : ""}
              </p>
            )}
            {event.date_fin && event.date_fin !== event.date_debut && (
              <p className="text-xs text-gray-400">jusqu&apos;au {formatDate(event.date_fin)}</p>
            )}
          </div>
        </div>

        {/* Lieu */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{event.lieu}</p>
            {event.adresse && <p className="text-xs text-gray-400">{event.adresse}</p>}
            {event.ville && <p className="text-xs text-gray-400">{event.ville}</p>}
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="bg-white/5 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-300 whitespace-pre-line">{event.description}</p>
          </div>
        )}
      </div>

      {/* Billets */}
      <div className="px-5 pb-40">
        <h2 className="text-lg font-black text-white mb-4">Billets</h2>

        {event.ticket_types.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucun billet disponible</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {event.ticket_types.map((tt) => {
              const remaining = tt.quantite_total - tt.quantite_vendue;
              const soldOut = remaining <= 0;
              const isSelected = selectedType === tt.id;

              return (
                <button
                  key={tt.id}
                  onClick={() => !soldOut && setSelectedType(tt.id)}
                  disabled={soldOut}
                  className={`w-full text-left rounded-2xl p-4 transition border-2 ${
                    isSelected
                      ? "bg-white/10 border-white"
                      : soldOut
                      ? "bg-white/5 border-transparent opacity-50 cursor-not-allowed"
                      : "bg-white/5 border-transparent hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-white text-sm">{tt.nom}</p>
                    <p className="font-black text-white text-sm">
                      {tt.prix > 0 ? formatMontant(tt.prix, devise) : "Gratuit"}
                    </p>
                  </div>
                  {tt.description && (
                    <p className="text-xs text-gray-400 mb-2">{tt.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {soldOut ? (
                      <span className="text-xs font-bold text-red-400">Complet</span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {remaining} place{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {/* Indicateur sélection */}
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                      <span className="text-xs font-bold text-white">Sélectionné</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Formulaire d'achat */}
        {selectedType && selectedTicketType && (
          <div className="bg-white/5 rounded-2xl p-5 animate-in slide-in-from-bottom-4 duration-300">
            <h3 className="font-bold text-white mb-4">Réserver</h3>

            {/* Quantité */}
            {selectedTicketType.max_par_personne > 1 && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">Quantité</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-white font-bold w-6 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(selectedTicketType.max_par_personne, qty + 1))}
                    className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Nom */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Votre nom *</label>
              <input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Nom complet"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-white/30 transition"
              />
            </div>

            {/* Téléphone */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Téléphone</label>
              <input
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="+225 07 00 00 00"
                type="tel"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-white/30 transition"
              />
            </div>

            {/* Email */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Email <span className="text-gray-600">(optionnel)</span></label>
              <input
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="email@exemple.com"
                type="email"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-white/30 transition"
              />
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            )}

            {/* Total + CTA */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">Total</span>
              <span className="text-lg font-black text-white">
                {total > 0 ? formatMontant(total, devise) : "Gratuit"}
              </span>
            </div>

            <button
              onClick={handleBuy}
              disabled={buying || !buyerName.trim()}
              className="w-full py-4 bg-white text-black rounded-2xl font-bold text-[15px] transition hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {buying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Ticket className="w-5 h-5" />
                  {total > 0 ? `Réserver — ${formatMontant(total, devise)}` : "Réserver gratuitement"}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent pt-8 pb-6 px-5 pointer-events-none">
        <div className="text-center pointer-events-auto">
          <p className="text-[11px] text-gray-600 font-medium">
            Propulsé par <span className="text-white font-bold">Binq</span>
          </p>
        </div>
      </div>
    </div>
  );
}
