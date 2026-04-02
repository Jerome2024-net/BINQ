"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess } from "@/lib/haptics";
import { ArrowRight, Eye, EyeOff, Loader2, Star } from "lucide-react";

export default function InscriptionPage() {
  const router = useRouter();
  const { register } = useAuth();
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
          <Star className="w-4 h-4 text-white fill-white" />
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
