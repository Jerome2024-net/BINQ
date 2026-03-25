"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Check,
  Ticket,
  Loader2,
  AlertCircle,
  Heart,
  Send,
  Download,
} from "lucide-react";
import Link from "next/link";

interface TicketResult {
  qr_code: string;
  reference: string;
  buyer_name: string;
  montant_total: number;
  devise: string;
  event_id: string;
}

function TicketSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventName, setEventName] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    verifyPayment();
  }, []);

  async function verifyPayment() {
    try {
      const encoded = searchParams.get("d");
      const signature = searchParams.get("s");

      // CinetPay ajoute ?transaction_id=XX dans return_url ou le frontend stocke dans sessionStorage
      const txId =
        searchParams.get("transaction_id") ||
        searchParams.get("id") ||
        (typeof window !== "undefined"
          ? sessionStorage.getItem("cinetpay_tx_id")
          : null);

      const storedEventName =
        typeof window !== "undefined"
          ? sessionStorage.getItem("cinetpay_event_name")
          : null;
      if (storedEventName) setEventName(storedEventName);

      if (!encoded || !signature) {
        setError("Données de paiement manquantes");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/cinetpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: encoded,
          signature,
          transaction_id: txId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402 && retryCount < 10) {
          // Paiement pas encore confirmé → réessayer dans 3s
          setRetryCount((c) => c + 1);
          setTimeout(verifyPayment, 3000);
          return;
        }
        throw new Error(data.error || "Erreur de vérification");
      }

      setTickets(data.tickets || []);

      // Nettoyage sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cinetpay_tx_id");
        sessionStorage.removeItem("cinetpay_event_name");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur de vérification";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleInviteFriends() {
    if (!tickets.length) return;
    const buyerName = tickets[0].buyer_name;
    const eventId = tickets[0].event_id;
    const shareText = eventName
      ? `Je vais à ${eventName} 🎉 Rejoins-moi !`
      : "J'ai mon billet 🎉 Rejoins-moi !";
    const shareUrl = `${window.location.origin}/evenement/${eventId}?ref=${encodeURIComponent(buyerName)}`;

    if (navigator.share) {
      navigator
        .share({ title: eventName || "Binq", text: shareText, url: shareUrl })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    }
  }

  // ═══ LOADING ═══
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
        <p className="text-white font-bold text-lg">
          Vérification du paiement...
        </p>
        <p className="text-gray-500 text-sm mt-2">
          {retryCount > 0
            ? `Confirmation en cours... (${retryCount})`
            : "Quelques secondes..."}
        </p>
      </div>
    );
  }

  // ═══ ERROR ═══
  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-white font-bold text-lg mb-2">Erreur</p>
        <p className="text-gray-400 text-sm mb-6 text-center">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm"
        >
          Retour
        </button>
      </div>
    );
  }

  // ═══ SUCCESS ═══
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      {/* Confirmation */}
      <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-5 animate-in zoom-in-75 duration-300">
        <Check className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">
        Paiement confirmé 🎉
      </h1>
      <p className="text-gray-400 text-sm mb-8 text-center">
        {tickets.length > 1 ? `${tickets.length} billets` : "Ton billet"}{" "}
        {eventName ? (
          <>
            pour{" "}
            <span className="text-white font-semibold">{eventName}</span>
          </>
        ) : (
          ""
        )}{" "}
        est prêt
      </p>

      {/* Voir mes billets */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        {tickets.map((t, i) => (
          <Link
            key={t.qr_code}
            href={`/billet/${t.qr_code}`}
            className="block w-full bg-emerald-500 text-white rounded-2xl p-4 text-center font-bold text-sm transition hover:bg-emerald-600 active:scale-[0.98]"
          >
            <div className="flex items-center justify-center gap-2">
              <Ticket className="w-5 h-5" />
              <span>
                {tickets.length > 1
                  ? `Voir & enregistrer le billet ${i + 1}`
                  : "Voir & enregistrer mon billet"}
              </span>
              <Download className="w-4 h-4 opacity-70" />
            </div>
          </Link>
        ))}
      </div>

      {/* ═══ Social Invite ═══ */}
      <div className="w-full max-w-sm">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-white font-bold text-[15px] mb-1">
            Invite tes amis à te rejoindre
          </p>
          <p className="text-gray-500 text-xs mb-5">
            Les meilleurs moments se vivent ensemble
          </p>
          <button
            onClick={handleInviteFriends}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition hover:from-purple-500 hover:to-pink-500 active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            Inviter des amis
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-[11px] text-gray-600 font-medium">
          Propulsé par{" "}
          <span className="text-white font-bold">Binq</span>
        </p>
      </div>
    </div>
  );
}

export default function TicketSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      }
    >
      <TicketSuccessContent />
    </Suspense>
  );
}
