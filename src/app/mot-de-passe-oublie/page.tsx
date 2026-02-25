"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 text-white p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent-500/10 rounded-full blur-[80px]" />

        <div className="relative max-w-md">
          <div className="flex items-center gap-2 mb-10">
            <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/B48C52E2-4F45-4BD6-9E28-570D27746459_jrqlgo" alt="Binq" className="h-16 w-auto brightness-0 invert" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight leading-tight">
            Pas de panique !
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Réinitialisez votre mot de passe en quelques secondes.
            Un lien sécurisé vous sera envoyé par email.
          </p>
          <div className="mt-12 space-y-4">
            {[
              "Lien de réinitialisation sécurisé",
              "Valable pendant 1 heure",
              "Vos données restent protégées",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-accent-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-2.5 h-2.5 text-accent-400" />
                </div>
                <span className="text-gray-400 text-[15px]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/B48C52E2-4F45-4BD6-9E28-570D27746459_jrqlgo" alt="Binq" className="h-14 w-auto" />
          </div>

          {sent ? (
            /* Success State */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
              <p className="text-gray-500 mb-6">
                Un lien de réinitialisation a été envoyé à{" "}
                <span className="font-semibold text-gray-700">{email}</span>.
                <br />Vérifiez votre boîte de réception et vos spams.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="btn-secondary w-full"
                >
                  Utiliser une autre adresse
                </button>
                <Link href="/connexion" className="btn-primary w-full flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la connexion
                </Link>
              </div>
            </div>
          ) : (
            /* Form State */
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Mot de passe oublié</h2>
              <p className="text-gray-500 mb-8 text-[15px]">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-12"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      Envoyer le lien
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link
                  href="/connexion"
                  className="text-primary-600 hover:text-primary-700 font-semibold text-[15px] inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}

          <div className="mt-6">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 transition-colors">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
