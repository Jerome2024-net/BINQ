"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, Wallet, ShieldCheck, Zap } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex selection:bg-amber-500/20 selection:text-amber-900">
      
      {/* ══════════════════════════════════════════
          GAUCHE - Branding (White Premium)
          ══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 bg-white p-12 items-center justify-center relative overflow-hidden border-r border-gray-100">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-100/40 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative max-w-md z-10 w-full">
          <Link href="/" className="inline-flex items-center gap-3 group mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/50 group-hover:shadow-amber-300/60 transition-all duration-300">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-gray-900 group-hover:text-amber-600 transition-colors">Binq</span>
          </Link>
          
          <h1 className="text-4xl font-black mb-6 tracking-tight leading-[1.1] text-gray-900">
            Votre portefeuille <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">intelligent.</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed font-medium">
            Connectez-vous pour accéder à votre portefeuille et gérer votre argent en toute sécurité.
          </p>
          
          <div className="mt-12 space-y-4 border-t border-gray-100 pt-10">
            {[
              { text: "Accès instantané à votre solde", icon: Zap },
              { text: "Chiffrement de bout en bout AES-256", icon: Lock },
              { text: "Infrastructure certifiée et sécurisée", icon: ShieldCheck },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-amber-100">
                  <item.icon className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-gray-600 font-medium text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DROITE - Formulaire
          ══════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white lg:bg-gray-50">
        <div className="w-full max-w-[400px]">
          
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-3 group mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/50">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-gray-900">Binq</span>
          </Link>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Bienvenue</h2>
            <p className="text-gray-500 text-[15px]">
              Entrez vos identifiants pour continuer
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">
                Adresse email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">
                Mot de passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-mono"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-full h-full border-2 border-gray-300 rounded-md peer-checked:border-amber-500 peer-checked:bg-amber-500 transition-all"></div>
                  <Lock className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">Garder ma session active</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 shadow-sm hover:shadow-md"
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
            <p className="text-gray-500 text-[15px]">
              Nouveau sur l&apos;application ?{" "}
              <Link
                href="/inscription"
                className="text-amber-600 hover:text-amber-700 hover:underline transition-colors"
              >
                Créer un compte
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <Link href="/" className="inline-flex items-center justify-center w-full gap-2 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100">
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
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>}>
      <ConnexionForm />
    </Suspense>
  );
}
