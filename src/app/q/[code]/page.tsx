"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

export default function QRRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    const resolve = async () => {
      try {
        const res = await fetch(`/api/qr/${encodeURIComponent(code)}`);
        const data = await res.json();

        if (!res.ok || !data.redirectUrl) {
          setError(data.error || "QR Code invalide ou expiré");
          return;
        }

        router.replace(data.redirectUrl);
      } catch {
        setError("Erreur de connexion. Réessayez.");
      }
    };

    resolve();
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">QR Code invalide</h1>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 px-6 py-3 bg-black text-white rounded-xl font-medium"
            >
              Retour à l&apos;accueil
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-black mx-auto" />
            <p className="text-gray-600 font-medium">Chargement...</p>
            <p className="text-gray-400 text-sm">Redirection en cours</p>
          </div>
        )}
      </div>
    </div>
  );
}
