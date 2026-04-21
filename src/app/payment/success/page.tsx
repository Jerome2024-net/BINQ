"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Wallet,
  ArrowRight,
  Clock,
  Smartphone,
  CreditCard,
} from "lucide-react";
import dynamic from "next/dynamic";
const SuccessConfetti = dynamic(() => import("@/components/SuccessConfetti"), {
  ssr: false,
});

function SuccessContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const method = searchParams.get("method");
  const sessionId = searchParams.get("session_id");
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const isCard = method === "card" || !!sessionId;
  const isMobile = method && !isCard && method !== "binq";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      {showConfetti && <SuccessConfetti />}

      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 animate-in zoom-in-95 duration-300">
          {/* Icon */}
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5 animate-in zoom-in duration-500">
            {isMobile ? (
              <Clock className="w-10 h-10 text-blue-600" />
            ) : (
              <CheckCircle2 className="w-10 h-10 text-blue-600" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            {isMobile ? "Paiement en cours" : "Paiement réussi !"}
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            {isMobile ? (
              <>
                Votre paiement via{" "}
                <span className="font-semibold text-gray-900">
                  {method?.replace("-", " ")}
                </span>{" "}
                est en cours de traitement. Vous recevrez une confirmation dès
                que le paiement sera validé.
              </>
            ) : isCard ? (
              <>
                Votre paiement par{" "}
                <span className="font-semibold text-gray-900">
                  carte bancaire
                </span>{" "}
                a été traité avec succès. Le marchand recevra les fonds
                instantanément.
              </>
            ) : (
              <>
                Votre paiement a été traité avec succès. Merci pour votre
                confiance.
              </>
            )}
          </p>

          {/* Method badge */}
          <div className="inline-flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 mb-6 border border-gray-100">
            {isCard ? (
              <CreditCard className="w-4 h-4 text-blue-500" />
            ) : isMobile ? (
              <Smartphone className="w-4 h-4 text-orange-500" />
            ) : (
              <Wallet className="w-4 h-4 text-blue-500" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {isCard
                ? "Carte bancaire"
                : isMobile
                  ? method?.replace("-", " ")
                  : "Binq Wallet"}
            </span>
          </div>

          {/* Warning for mobile */}
          {isMobile && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6 text-left">
              <p className="text-xs text-amber-700">
                <strong>Note :</strong> Les paiements mobile money peuvent
                prendre quelques secondes à quelques minutes pour être
                confirmés. Veuillez patienter.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-blue-400 transition"
            >
              <Wallet className="w-5 h-5" />
              Aller au tableau de bord
            </Link>

            {code && (
              <Link
                href={`/pay/${code}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition text-sm"
              >
                <ArrowRight className="w-4 h-4" />
                Retour au paiement
              </Link>
            )}
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-5">
          Propulsé par Binq — Billetterie QR avec paiement intégré
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
