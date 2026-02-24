"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import { Lock, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase automatically exchanges the token from the URL hash
  useEffect(() => {
    const supabase = createClient();
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        // Listen for auth state change (exchange happening)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
          if (event === "PASSWORD_RECOVERY") {
            setSessionReady(true);
          }
        });
        // Wait a bit for the exchange
        setTimeout(() => setSessionReady(true), 1000);
        return () => subscription.unsubscribe();
      }
    };
    checkSession();
  }, [searchParams]);

  // Password strength
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthLabel = ["", "Très faible", "Faible", "Moyen", "Fort", "Très fort"][strength] || "";
  const strengthColor = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"][strength] || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.refresh();
          router.push("/dashboard");
        }, 3000);
      }
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Left side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 text-white p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent-500/10 rounded-full blur-[80px]" />

        <div className="relative max-w-md">
          <div className="flex items-center gap-2.5 mb-10">
            <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/ChatGPT_Image_24_f%C3%A9vr._2026_15_44_47_sgwgvi" alt="Binq" className="h-11 w-auto brightness-0 invert" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight leading-tight">
            Nouveau départ
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Choisissez un mot de passe fort pour sécuriser votre compte.
          </p>
          <div className="mt-12 space-y-4">
            {[
              "Au moins 8 caractères",
              "Mélangez majuscules et minuscules",
              "Ajoutez des chiffres et caractères spéciaux",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-accent-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5 text-accent-400" />
                </div>
                <span className="text-gray-400 text-[15px]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/ChatGPT_Image_24_f%C3%A9vr._2026_15_44_47_sgwgvi" alt="Binq" className="h-9 w-auto" />
          </div>

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe modifié !</h2>
              <p className="text-gray-500 mb-6">
                Votre mot de passe a été mis à jour avec succès.
                <br />Vous allez être redirigé...
              </p>
              <Link href="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2">
                Aller au tableau de bord
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Nouveau mot de passe</h2>
              <p className="text-gray-500 mb-8 text-[15px]">
                Choisissez un nouveau mot de passe sécurisé pour votre compte.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
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
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              i < strength ? strengthColor : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${strength <= 2 ? "text-red-500" : strength <= 3 ? "text-yellow-600" : "text-green-600"}`}>
                        {strengthLabel}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field pl-12"
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !sessionReady}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    <>
                      Réinitialiser le mot de passe
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
