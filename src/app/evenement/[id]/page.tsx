"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Heart,
  Sparkles,
  Send,
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
  logo_url: string | null;
  devise: string;
  is_active: boolean;
  total_vendu: number;
  ticket_types: TicketType[];
}

export default function EvenementPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  // Referral
  const referrer = searchParams.get("ref");

  // Achat
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketCodes, setTicketCodes] = useState<string[]>([]);
  const [justBoughtName, setJustBoughtName] = useState("");

  useEffect(() => {
    setMounted(true);
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
    setError("");
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
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'achat");

      // ═══ Paiement requis → redirection CinetPay ═══
      if (data.requires_payment && data.payment_url) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("cinetpay_tx_id", String(data.transaction_id));
          sessionStorage.setItem("cinetpay_event_name", event?.nom || "");
        }
        window.location.href = data.payment_url;
        return;
      }

      // ═══ Billets créés directement ═══
      if (data.tickets && data.tickets.length > 0) {
        setTicketCodes(data.tickets.map((t: any) => t.qr_code));
        setJustBoughtName(buyerName.trim());
        setSuccess(true);
      } else {
        throw new Error("Aucun billet créé");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setBuying(false);
    }
  }

  function handleInviteFriends() {
    if (!event || !mounted) return;
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/evenement/${event.id}?ref=${encodeURIComponent(justBoughtName || buyerName.trim())}`;
    const shareText = `Je vais à ${event.nom} 🎉 Rejoins-moi !`;
    
    if (navigator.share) {
      navigator.share({
        title: event.nom,
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
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
  const sousTotal = selectedTicketType ? selectedTicketType.prix * qty : 0;
  const fraisService = sousTotal > 0 ? Math.ceil(sousTotal * 0.1) : 0;
  const total = sousTotal + fraisService;
  const devise = (event?.devise || "XOF") as DeviseCode;

  // Social proof — total participants & capacity
  const totalParticipants = event?.total_vendu || event?.ticket_types.reduce((sum, tt) => sum + tt.quantite_vendue, 0) || 0;
  const totalCapacity = event?.ticket_types.reduce((sum, tt) => sum + tt.quantite_total, 0) || 0;
  const fillPercent = totalCapacity > 0 ? Math.min(100, Math.round((totalParticipants / totalCapacity) * 100)) : 0;

  // ═══ LOADING ═══
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // ═══ ERROR ═══
  if (error && !event) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-900 font-bold text-lg mb-2">Événement introuvable</p>
        <p className="text-gray-500 text-sm mb-6">Cet événement n&apos;existe pas ou n&apos;est plus disponible</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm">
          Retour
        </button>
      </div>
    );
  }

  if (!event) return null;

  // ═══ SUCCESS — Billet confirmé + Invite tes amis ═══
  if (success && ticketCodes.length > 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        {/* Confirmation */}
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-5 animate-in zoom-in-75 duration-300">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Ton billet est confirmé 🎉</h1>
        <p className="text-gray-500 text-sm mb-8 text-center">
          {ticketCodes.length > 1 ? `${ticketCodes.length} billets` : "1 billet"} pour <span className="text-gray-900 font-semibold">{event.nom}</span>
        </p>

        {/* Voir mes billets */}
        <div className="w-full max-w-sm space-y-3 mb-8">
          {ticketCodes.map((code, i) => (
            <a
              key={code}
              href={`/billet/${code}`}
              className="block w-full bg-emerald-500 text-white rounded-2xl p-4 text-center font-bold text-sm transition hover:bg-emerald-600 active:scale-[0.98]"
            >
              <Ticket className="w-5 h-5 mx-auto mb-1" />
              {ticketCodes.length > 1 ? `Voir le billet ${i + 1}` : "Voir mon billet"}
            </a>
          ))}
        </div>

        {/* ═══ Social Invite Section ═══ */}
        <div className="w-full max-w-sm">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-gray-900 font-bold text-[15px] mb-1">Invite tes amis à te rejoindre</p>
            <p className="text-gray-500 text-xs mb-5">Les meilleurs moments se vivent ensemble</p>

            <button
              onClick={handleInviteFriends}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition hover:from-purple-500 hover:to-pink-500 active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              Inviter des amis
            </button>
          </div>

          {/* Social proof */}
          {totalParticipants > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="flex -space-x-2">
                {[...Array(Math.min(3, totalParticipants))].map((_, i) => (
                  <div key={i} className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                <span className="text-gray-900 font-bold">+{totalParticipants}</span> personne{totalParticipants > 1 ? "s" : ""} participe{totalParticipants > 1 ? "nt" : ""}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => router.back()}
          className="mt-8 text-gray-400 text-sm font-medium hover:text-gray-600 transition"
        >
          Retour
        </button>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-gray-400 font-medium">Propulsé par <span className="text-emerald-600 font-bold">Binq</span></p>
        </div>
      </div>
    );
  }

  // ═══ PAGE ÉVÉNEMENT ═══
  return (
    <div className="min-h-screen bg-white">
      {/* Desktop centered container */}
      <div className="max-w-2xl mx-auto">
      {/* Cover */}
      <div className="relative">
        {event.cover_url ? (
          <div className="w-full h-56 sm:h-72 lg:h-80 relative lg:rounded-b-3xl overflow-hidden">
            <img src={event.cover_url} alt={event.nom} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-emerald-500 to-emerald-600 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition shadow-sm"
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
          className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition shadow-sm"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Event info */}
      <div className="px-5 -mt-8 relative z-10">
        {/* ═══ Referral Banner — "X participe à cet événement" ═══ */}
        {referrer && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-2xl p-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{referrer} participe à cet événement</p>
                <p className="text-xs text-purple-600">Rejoins-le et vivez ça ensemble 🎉</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          {event.logo_url && (
            <img src={event.logo_url} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-white shrink-0 shadow-lg" />
          )}
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900">{event.nom}</h1>
        </div>

        {/* ═══ Social Proof Bar ═══ */}
        {totalParticipants > 0 && (
          <div className="mb-4 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {[...Array(Math.min(4, totalParticipants))].map((_, i) => (
                    <div key={i} className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-[1.5px] border-white flex items-center justify-center">
                      <Users className="w-2.5 h-2.5 text-white" />
                    </div>
                  ))}
                  {totalParticipants > 4 && (
                    <div className="w-6 h-6 bg-gray-100 rounded-full border-[1.5px] border-white flex items-center justify-center">
                      <span className="text-[8px] font-bold text-gray-600">+{totalParticipants - 4}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  <span className="font-bold text-gray-900">{totalParticipants}</span> personne{totalParticipants > 1 ? "s" : ""} participe{totalParticipants > 1 ? "nt" : ""}
                </p>
              </div>
              {fillPercent >= 70 && (
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  🔥 {fillPercent}% rempli
                </span>
              )}
            </div>
            {/* Progress bar */}
            {totalCapacity > 0 && (
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    fillPercent >= 90 ? "bg-red-500" : fillPercent >= 70 ? "bg-orange-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Date */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 capitalize">{formatDate(event.date_debut)}</p>
            {event.heure_debut && (
              <p className="text-xs text-gray-500">
                {formatTime(event.heure_debut)}
                {event.heure_fin ? ` — ${formatTime(event.heure_fin)}` : ""}
              </p>
            )}
            {event.date_fin && event.date_fin !== event.date_debut && (
              <p className="text-xs text-gray-500">jusqu&apos;au {formatDate(event.date_fin)}</p>
            )}
          </div>
        </div>

        {/* Lieu */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{event.lieu}</p>
            {event.adresse && <p className="text-xs text-gray-500">{event.adresse}</p>}
            {event.ville && <p className="text-xs text-gray-500">{event.ville}</p>}
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
            <p className="text-sm text-gray-600 whitespace-pre-line">{event.description}</p>
          </div>
        )}
      </div>

      {/* Billets */}
      <div className="px-5 pb-40">
        <h2 className="text-lg lg:text-xl font-black text-gray-900 mb-4">Billets</h2>

        {event.ticket_types.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucun billet disponible</p>
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
                      ? "bg-emerald-50 border-emerald-500"
                      : soldOut
                      ? "bg-gray-50 border-transparent opacity-50 cursor-not-allowed"
                      : "bg-gray-50 border-transparent hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-gray-900 text-sm">{tt.nom}</p>
                    <p className="font-black text-gray-900 text-sm">
                      {tt.prix > 0 ? formatMontant(tt.prix, devise) : "Gratuit"}
                    </p>
                  </div>
                  {tt.description && (
                    <p className="text-xs text-gray-500 mb-2">{tt.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {soldOut ? (
                      <span className="text-xs font-bold text-red-500">Complet</span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {remaining} place{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {/* Indicateur sélection */}
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600">Sélectionné</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Formulaire d'achat */}
        {selectedType && selectedTicketType && (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 animate-in slide-in-from-bottom-4 duration-300">
            <h3 className="font-bold text-gray-900 mb-4">Réserver</h3>

            {/* Quantité */}
            {selectedTicketType.max_par_personne > 1 && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Quantité</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-300 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-gray-900 font-bold w-6 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(selectedTicketType.max_par_personne, qty + 1))}
                    className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-300 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Nom */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Votre nom *</label>
              <input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Nom complet"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 transition"
              />
            </div>

            {/* Téléphone */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Téléphone</label>
              <input
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="+225 07 00 00 00"
                type="tel"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 transition"
              />
            </div>

            {/* Email */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Email <span className="text-gray-400">(optionnel)</span></label>
              <input
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="email@exemple.com"
                type="email"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 transition"
              />
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Détail prix */}
            {sousTotal > 0 && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Sous-total</span>
                  <span className="text-sm font-semibold text-gray-700">{formatMontant(sousTotal, devise)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Frais de service (10%)</span>
                  <span className="text-sm font-semibold text-gray-700">{formatMontant(fraisService, devise)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-lg font-black text-gray-900">{formatMontant(total, devise)}</span>
                </div>
              </div>
            )}
            {sousTotal === 0 && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-lg font-black text-gray-900">Gratuit</span>
              </div>
            )}

            <button
              onClick={handleBuy}
              disabled={buying || !buyerName.trim()}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-[15px] transition hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {buying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Ticket className="w-5 h-5" />
                  {total > 0 ? `Payer — ${formatMontant(total, devise)}` : "Réserver gratuitement"}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-6 px-5 pointer-events-none">
        <div className="text-center pointer-events-auto">
          <p className="text-[11px] text-gray-400 font-medium">
            Propulsé par <span className="text-emerald-600 font-bold">Binq</span>
          </p>
        </div>
      </div>
      </div>{/* end max-w container */}
    </div>
  );
}
