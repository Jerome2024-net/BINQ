"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess } from "@/lib/haptics";
import { ArrowRight, Eye, EyeOff, Loader2, QrCode } from "lucide-react";

export default function InscriptionPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await register(formData);
      if (result.success) {
        hapticSuccess();
        showToast("success", "Bienvenue !", "Votre compte a été créé avec succès.");
        router.push("/dashboard");
      } else {
        setError(result.error || "Une erreur est survenue lors de l'inscription");
      }
    } catch {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12 font-sans antialiased">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/25">
          <QrCode className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-neutral-900">Binq</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-1.5">Créer un compte</h1>
          <p className="text-sm text-neutral-400">Lancez votre billetterie en quelques minutes</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Google OAuth */}
        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all active:scale-[0.98]"
        >
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          S&apos;inscrire avec Google
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-neutral-100" />
          <span className="text-[11px] text-neutral-300 font-medium">ou</span>
          <div className="flex-1 h-px bg-neutral-100" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-neutral-500 mb-1.5">Prénom</label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder-neutral-300 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition-all"
                placeholder="Jean"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-neutral-500 mb-1.5">Nom</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder-neutral-300 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition-all"
                placeholder="Dupont"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-500 mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder-neutral-300 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition-all"
              placeholder="vous@exemple.com"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-500 mb-1.5">Téléphone</label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder-neutral-300 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition-all"
              placeholder="+33 6 12 34 56 78"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-500 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 pr-11 text-sm text-neutral-900 placeholder-neutral-300 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition-all"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5 ml-1">8 caractères minimum</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Créer mon compte <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-neutral-400 mt-6">
          En créant un compte, vous acceptez les{" "}
          <Link href="#" className="underline hover:text-neutral-600 transition-colors">CGU</Link>{" "}
          et la{" "}
          <Link href="#" className="underline hover:text-neutral-600 transition-colors">Politique de confidentialité</Link>.
        </p>

        <p className="text-center text-sm text-neutral-400 mt-8">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-neutral-900 font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>

      {/* Bottom branding */}
      <p className="mt-16 text-[11px] text-neutral-300">&copy; {new Date().getFullYear()} Binq</p>
    </div>
  );
}
