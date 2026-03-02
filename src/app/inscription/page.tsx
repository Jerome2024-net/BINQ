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
  Bitcoin,
  Globe,
  Wallet,
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
      const result = await register(
        formData.email,
        formData.password,
        formData.prenom,
        formData.nom,
        formData.telephone
      );

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
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* ══════════════════════════════════════════
          GAUCHE - Branding (Dark Premium)
          ══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0a0a0a] p-12 items-center justify-center relative overflow-hidden border-r border-white/5">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative max-w-md z-10 w-full">
          <Link href="/" className="inline-flex items-center gap-3 group mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all duration-300">
              <Bitcoin className="w-6 h-6 text-zinc-950" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white group-hover:text-amber-400 transition-colors">Binq</span>
          </Link>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-500 text-xs font-bold mb-6">
            L'avenir de la monnaie
          </div>

          <h1 className="text-4xl font-black mb-6 tracking-tight leading-[1.1] text-white">
            Rejoignez la <br/>révolution <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Bitcoin.</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed font-medium">
            Créez votre compte en moins d'une minute et accédez à la plateforme d'achat la plus simple et sécurisée.
          </p>
          
          <div className="mt-12 space-y-6 border-t border-white/5 pt-10">
            {[
              { title: "Achat instantané", desc: "Achetez du BTC par carte bancaire en 2 clics.", icon: Bitcoin },
              { title: "Transparence totale", desc: "1.5% de frais uniques sur les achats.", icon: Globe },
              { title: "Autonomie financière", desc: "Gérez votre portefeuille sans intermédiaire.", icon: Wallet },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <item.icon className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base mb-1">{item.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DROITE - Formulaire Inscription
          ══════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[440px] my-auto">
          
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-3 group mb-10 mt-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Bitcoin className="w-6 h-6 text-zinc-950" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">Binq</span>
          </Link>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-white mb-2">Créer un compte</h2>
            <p className="text-zinc-400 text-[15px]">
              Remplissez vos informations pour commencer.
            </p>
          </div>

          {error && (
             <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-medium animate-fade-in">
               <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] shrink-0" />
               {error}
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-zinc-300 ml-1">Prénom</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                    placeholder="Jean"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-zinc-300 ml-1">Nom</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-zinc-300 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  placeholder="jean.dupont@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-zinc-300 ml-1">Téléphone</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono"
                  placeholder="+33 6 12 34 56 78"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-zinc-300 ml-1">Mot de passe</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 px-1">Au moins 8 caractères</p>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 rounded-2xl bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
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

          <p className="text-xs text-zinc-500 text-center mt-6">
            En m'inscrivant, j'accepte les <Link href="#" className="underline hover:text-white transition-colors">Conditions d'Utilisation</Link> et la <Link href="#" className="underline hover:text-white transition-colors">Politique de Confidentialité</Link>.
          </p>

          <div className="mt-10 pt-8 border-t border-white/5 text-center font-medium">
            <p className="text-zinc-500 text-[15px]">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/connexion"
                className="text-white hover:text-amber-400 hover:underline transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
