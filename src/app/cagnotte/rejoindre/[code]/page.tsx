"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";
import {
  Users,
  Target,
  Calendar,
  Loader2,
  Star,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  LogIn,
} from "lucide-react";

interface CagnottePublic {
  id: string;
  nom: string;
  description: string | null;
  objectif_montant: number | null;
  date_limite: string | null;
  devise: string;
  icone: string;
  couleur: string;
  solde: number;
  nombre_membres: number;
  membres_apercu: { prenom: string; avatar_url: string | null }[];
}

function formatMontant(montant: number, devise: string = "EUR"): string {
  if (devise === "USD") return `$${montant.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${montant.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function RejoindeCagnottePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const code = (params.code as string)?.toUpperCase();

  const [cagnotte, setCagnotte] = useState<CagnottePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!code) return;
    fetch(`/api/cagnottes/public/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setCagnotte(data);
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = async () => {
    if (!user) {
      router.push(`/connexion?redirect=/cagnotte/rejoindre/${code}`);
      return;
    }

    setJoining(true);
    try {
      const res = await fetch("/api/cagnottes/rejoindre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.cagnotte_id) {
          // Déjà membre → rediriger
          showToast("success", "Vous êtes déjà membre !");
          router.push("/dashboard/cagnottes");
          return;
        }
        throw new Error(data.error);
      }

      setJoined(true);
      showToast("success", `Vous avez rejoint "${data.nom}" !`);
      setTimeout(() => router.push("/dashboard/cagnottes"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setJoining(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // ── Error ──
  if (error && !cagnotte) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!cagnotte) return null;

  const progress = cagnotte.objectif_montant
    ? Math.min(100, Math.round((Number(cagnotte.solde) / cagnotte.objectif_montant) * 100))
    : null;

  // ── Joined success ──
  if (joined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vous avez rejoint la cagnotte !</h1>
          <p className="text-gray-500 mb-6">Redirection vers votre espace...</p>
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // ── Main ──
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      {/* Navbar simple */}
      <nav className="px-4 sm:px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-white fill-current" />
          </div>
          <span className="text-lg font-bold text-gray-900">Binq</span>
        </Link>
        {!user && (
          <Link
            href={`/connexion?redirect=/cagnotte/rejoindre/${code}`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Se connecter
          </Link>
        )}
      </nav>

      {/* Card invitation */}
      <div className="max-w-lg mx-auto px-4 pt-8 pb-16">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-indigo-600 mb-2">Vous êtes invité(e) à rejoindre</p>
          <h1 className="text-3xl font-bold text-gray-900">une cagnotte commune</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Header couleur */}
          <div
            className="relative p-6 pb-8 text-white"
            style={{ background: `linear-gradient(135deg, ${cagnotte.couleur}, ${cagnotte.couleur}CC)` }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />

            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl backdrop-blur-sm border border-white/10">
                {cagnotte.icone}
              </div>
              <div>
                <h2 className="text-xl font-bold">{cagnotte.nom}</h2>
                {cagnotte.description && (
                  <p className="text-white/70 text-sm mt-1 line-clamp-2">{cagnotte.description}</p>
                )}
              </div>
            </div>

            {/* Solde */}
            <div className="relative z-10 mt-6">
              <p className="text-3xl font-bold tracking-tight">
                {formatMontant(Number(cagnotte.solde), cagnotte.devise)}
              </p>
              {progress !== null && cagnotte.objectif_montant && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-white/80 mb-1.5">
                    <span>{progress}% atteint</span>
                    <span>Objectif : {formatMontant(cagnotte.objectif_montant, cagnotte.devise)}</span>
                  </div>
                  <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Infos */}
          <div className="p-6 space-y-4">
            {/* Membres */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {cagnotte.nombre_membres} membre{cagnotte.nombre_membres > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-500">participent déjà</p>
                </div>
              </div>
              {/* Avatars */}
              <div className="flex -space-x-2">
                {cagnotte.membres_apercu.map((m, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700"
                  >
                    {m.prenom?.[0]?.toUpperCase() || "?"}
                  </div>
                ))}
              </div>
            </div>

            {/* Date limite */}
            {cagnotte.date_limite && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Date limite</p>
                  <p className="text-xs text-gray-500">{formatDate(cagnotte.date_limite)}</p>
                </div>
              </div>
            )}

            {/* Objectif */}
            {cagnotte.objectif_montant && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Target className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Objectif</p>
                  <p className="text-xs text-gray-500">{formatMontant(cagnotte.objectif_montant, cagnotte.devise)}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}

            {/* CTA */}
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              {joining ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {user ? "Rejoindre la cagnotte" : "Se connecter pour rejoindre"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-400">
              En rejoignant, vous pourrez contribuer depuis votre portefeuille Binq
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
