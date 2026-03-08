"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess } from "@/lib/haptics";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, Zap, Smartphone, Star } from "lucide-react";

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
        hapticSuccess();
        showToast("success", "Bienvenue !", "Connexion réussie");
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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex selection:bg-emerald-500/20">

      {/* ── Left Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center relative overflow-hidden border-r border-white/[0.04]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/[0.06] rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-md z-10 w-full">
          <Link href="/" className="inline-flex items-center gap-3 group mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-black text-2xl tracking-tight text-white group-hover:text-emerald-400 transition-colors">Binq</span>
          </Link>

          <h1 className="text-4xl font-black mb-6 tracking-tight leading-[1.1]">
            Votre argent,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              mobile.
            </span>
          </h1>
          <p className="text-white/40 text-lg leading-relaxed font-medium">
            Connectez-vous pour accéder à votre portefeuille et gérer votre argent en toute sécurité.
          </p>

          <div className="mt-12 space-y-3 border-t border-white/[0.06] pt-10">
            {[
              { text: "Accès instantané à votre solde", icon: Zap, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10" },
              { text: "Chiffrement de bout en bout", icon: Lock, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/10" },
              { text: "Infrastructure certifiée et sécurisée", icon: ShieldCheck, color: "text-violet-400 bg-violet-500/10 border-violet-500/10" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-white/50 font-medium text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[400px]">

          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-3 group mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-black text-2xl tracking-tight text-white">Binq</span>
          </Link>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black mb-2">Bienvenue</h2>
            <p className="text-white/30 text-[15px]">Entrez vos identifiants pour continuer</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-white/50 ml-1">Adresse email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-white/50 ml-1">Mot de passe</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all font-mono"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center font-medium">
            <p className="text-white/30 text-[15px]">
              Nouveau sur l&apos;application ?{" "}
              <Link href="/inscription" className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
                Créer un compte
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <Link href="/" className="inline-flex items-center justify-center w-full gap-2 py-3 text-sm font-bold text-white/25 hover:text-white/50 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl transition-colors border border-white/[0.05]">
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
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>}>
      <ConnexionForm />
    </Suspense>
  );
}
