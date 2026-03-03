"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Phone,
  Loader2,
  SendHorizonal,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex selection:bg-emerald-500/20">

      {/* ── Left Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center relative overflow-hidden border-r border-white/[0.04]">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.06] rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-md z-10 w-full">
          <Link href="/" className="inline-flex items-center gap-3 group mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <span className="font-black text-2xl tracking-tight text-white group-hover:text-emerald-400 transition-colors">Binq</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-6">
            Mobile Money Nouvelle Génération
          </div>

          <h1 className="text-4xl font-black mb-6 tracking-tight leading-[1.1]">
            Gérez votre <br />argent{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              simplement.
            </span>
          </h1>
          <p className="text-white/40 text-lg leading-relaxed font-medium">
            Créez votre compte en moins d&apos;une minute et accédez à votre portefeuille numérique sécurisé.
          </p>

          <div className="mt-12 space-y-5 border-t border-white/[0.06] pt-10">
            {[
              { title: "Dépôt par carte", desc: "Alimentez votre portefeuille par Visa ou Mastercard.", icon: CreditCard, color: "text-emerald-400 bg-emerald-500/10" },
              { title: "Transferts gratuits", desc: "Envoyez de l'argent entre utilisateurs Binq, sans frais.", icon: SendHorizonal, color: "text-cyan-400 bg-cyan-500/10" },
              { title: "Sécurité maximale", desc: "Chiffrement AES-256 et infrastructure certifiée.", icon: ShieldCheck, color: "text-violet-400 bg-violet-500/10" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 border border-white/[0.05] ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base mb-1">{item.title}</h3>
                  <p className="text-white/30 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[440px] my-auto">

          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-3 group mb-10 mt-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <span className="font-black text-2xl tracking-tight text-white">Binq</span>
          </Link>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black mb-2">Créer un compte</h2>
            <p className="text-white/30 text-[15px]">Remplissez vos informations pour commencer.</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-white/50 ml-1">Prénom</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                    placeholder="Jean"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-white/50 ml-1">Nom</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-white/50 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                  placeholder="jean.dupont@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-white/50 ml-1">Téléphone</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all font-mono"
                  placeholder="+33 6 12 34 56 78"
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all font-mono"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[11px] text-white/20 mt-2 px-1">Au moins 8 caractères</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-white/15 text-center mt-6">
            En m&apos;inscrivant, j&apos;accepte les{" "}
            <Link href="#" className="underline hover:text-white/40 transition-colors">Conditions d&apos;Utilisation</Link>{" "}
            et la{" "}
            <Link href="#" className="underline hover:text-white/40 transition-colors">Politique de Confidentialité</Link>.
          </p>

          <div className="mt-10 pt-8 border-t border-white/[0.05] text-center font-medium">
            <p className="text-white/30 text-[15px]">
              Vous avez déjà un compte ?{" "}
              <Link href="/connexion" className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
