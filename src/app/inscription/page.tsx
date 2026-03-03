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
  Wallet,
  SendHorizonal,
  ShieldCheck,
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex selection:bg-amber-500/20 selection:text-amber-900">
      
      {/* ══════════════════════════════════════════
          GAUCHE - Branding (White Premium)
          ══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 bg-white p-12 items-center justify-center relative overflow-hidden border-r border-gray-100">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative max-w-md z-10 w-full">
          <Link href="/" className="inline-flex items-center gap-3 group mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/50 group-hover:shadow-amber-300/60 transition-all duration-300">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-gray-900 group-hover:text-amber-600 transition-colors">Binq</span>
          </Link>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold mb-6">
            Votre portefeuille intelligent
          </div>

          <h1 className="text-4xl font-black mb-6 tracking-tight leading-[1.1] text-gray-900">
            Gérez votre <br/>argent <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">simplement.</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed font-medium">
            Créez votre compte en moins d&apos;une minute et accédez à votre portefeuille numérique sécurisé.
          </p>
          
          <div className="mt-12 space-y-5 border-t border-gray-100 pt-10">
            {[
              { title: "Dépôt par carte", desc: "Alimentez votre portefeuille par Visa ou Mastercard.", icon: Wallet },
              { title: "Transferts gratuits", desc: "Envoyez de l'argent entre utilisateurs Binq, sans frais.", icon: SendHorizonal },
              { title: "Sécurité maximale", desc: "Chiffrement AES-256 et infrastructure certifiée.", icon: ShieldCheck },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <item.icon className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold text-base mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DROITE - Formulaire Inscription
          ══════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto bg-white lg:bg-gray-50">
        <div className="w-full max-w-[440px] my-auto">
          
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-3 group mb-10 mt-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/50">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-gray-900">Binq</span>
          </Link>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Créer un compte</h2>
            <p className="text-gray-500 text-[15px]">
              Remplissez vos informations pour commencer.
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 ml-1">Prénom</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    placeholder="Jean"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 ml-1">Nom</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  placeholder="jean.dupont@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Téléphone</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-mono"
                  placeholder="+33 6 12 34 56 78"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Mot de passe</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-mono"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 px-1">Au moins 8 caractères</p>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 shadow-sm hover:shadow-md"
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

          <p className="text-xs text-gray-400 text-center mt-6">
            En m&apos;inscrivant, j&apos;accepte les <Link href="#" className="underline hover:text-gray-900 transition-colors">Conditions d&apos;Utilisation</Link> et la <Link href="#" className="underline hover:text-gray-900 transition-colors">Politique de Confidentialité</Link>.
          </p>

          <div className="mt-10 pt-8 border-t border-gray-100 text-center font-medium">
            <p className="text-gray-500 text-[15px]">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/connexion"
                className="text-amber-600 hover:text-amber-700 hover:underline transition-colors"
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
