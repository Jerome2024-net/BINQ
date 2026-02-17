"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { Star, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { login } = useAuth();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        showToast("success", "Bienvenue !", "Connexion réussie");
        // Hard redirect to ensure cookies are sent with the request
        // router.push() does client-side nav which may miss new auth cookies
        window.location.href = redirect || "/dashboard";
        return;
      } else {
        setError(result.error || "Identifiants incorrects");
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 text-white p-12 items-center justify-center relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent-500/10 rounded-full blur-[80px]" />
        
        <div className="relative max-w-md">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow">
              <Star className="w-6 h-6 text-white fill-current" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Binq</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight leading-tight">
            Bon retour parmi nous !
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Connectez-vous pour retrouver vos tontines, suivre vos cotisations
            et gérer vos groupes d&apos;épargne.
          </p>
          <div className="mt-12 space-y-4">
            {[
              "Suivi en temps réel de vos cotisations",
              "Notifications de paiement instantanées",
              "Historique complet et transparent",
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
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow">
              <Star className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Binq
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Connexion</h2>
          <p className="text-gray-500 mb-8 text-[15px]">
            Entrez vos identifiants pour accéder à votre compte
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-500">Se souvenir de moi</span>
              </label>
              <Link
                href="#"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-[15px]">
              Pas encore de compte ?{" "}
              <Link
                href="/inscription"
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Créer un compte
              </Link>
            </p>
          </div>

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

export default function ConnexionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    }>
      <ConnexionForm />
    </Suspense>
  );
}
