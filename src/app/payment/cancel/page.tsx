"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

function CancelContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            Paiement annulé
          </h1>

          <p className="text-gray-600 mb-6">
            Le paiement a été annulé. Aucun montant n&apos;a été débité de
            votre compte. Vous pouvez réessayer quand vous le souhaitez.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            {code ? (
              <Link
                href={`/pay/${code}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-blue-400 transition"
              >
                <RefreshCw className="w-5 h-5" />
                Réessayer le paiement
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-blue-400 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour à l&apos;accueil
              </Link>
            )}

            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Tableau de bord
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-5">
          Propulsé par Binq — Paiements universels pour l&apos;Afrique
        </p>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CancelContent />
    </Suspense>
  );
}
