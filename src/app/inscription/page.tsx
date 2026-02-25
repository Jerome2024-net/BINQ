"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  MailCheck,
} from "lucide-react";

// Password strength calculator
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Faible", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Moyen", color: "bg-amber-500" };
  if (score <= 3) return { score, label: "Bon", color: "bg-blue-500" };
  return { score, label: "Excellent", color: "bg-green-500" };
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>}>
      <InscriptionForm />
    </Suspense>
  );
}

function InscriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { register } = useAuth();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: "",
  });

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      const result = await register(formData);
      if (result.success) {
        setRegisteredEmail(formData.email);
        setEmailSent(true);
        showToast("success", "Compte créé !", "Vérifiez votre email pour confirmer votre inscription");
      } else {
        setError(result.error || "Erreur lors de l'inscription");
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
          <div className="flex items-center gap-1.5 mb-10">
            <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/ChatGPT_Image_24_f%C3%A9vr._2026_18_41_17_iwqq1o" alt="Binq" className="h-11 w-auto brightness-0 invert" />
            <span className="text-2xl font-bold tracking-tight">Binq</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight leading-tight">
            Rejoignez la communauté
          </h1>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed">
            Créez votre compte et commencez à gérer vos tontines de manière
            digitale, transparente et sécurisée.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "100%", label: "Gratuit" },
              { value: "2 min", label: "Inscription" },
              { value: "24/7", label: "Disponible" },
              { value: "SSL", label: "Sécurisé" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-4 text-center border border-white/[0.06]">
                <div className="text-xl font-bold text-accent-400">{stat.value}</div>
                <div className="text-[13px] text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-1.5 mb-8 justify-center">
            <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/ChatGPT_Image_24_f%C3%A9vr._2026_18_41_17_iwqq1o" alt="Binq" className="h-9 w-auto" />
            <span className="text-xl font-bold text-gray-900 tracking-tight">Binq</span>
          </div>

          {/* Email confirmation screen */}
          {emailSent ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-accent-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MailCheck className="w-10 h-10 text-accent-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Vérifiez votre email</h2>
              <p className="text-gray-500 mb-2 text-[15px]">
                Un email de confirmation a été envoyé à
              </p>
              <p className="font-semibold text-primary-600 mb-6">{registeredEmail}</p>
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-primary-700 mb-6">
                <p className="font-medium mb-1">Étapes suivantes :</p>
                <ol className="list-decimal list-inside space-y-1 text-left">
                  <li>Ouvrez votre boîte mail</li>
                  <li>Cliquez sur le lien de confirmation</li>
                  <li>Connectez-vous à votre compte</li>
                </ol>
              </div>
              <div className="space-y-3">
                <Link href={redirect ? `/connexion?redirect=${encodeURIComponent(redirect)}` : "/connexion"} className="btn-primary w-full flex items-center justify-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Aller à la connexion
                </Link>
                {redirect && redirect.startsWith("/rejoindre/") && (
                  <p className="text-xs text-gray-400 text-center">
                    Après confirmation, connectez-vous pour rejoindre la tontine automatiquement.
                  </p>
                )}
                <button
                  onClick={() => { setEmailSent(false); setFormData({ nom: "", prenom: "", email: "", telephone: "", password: "", confirmPassword: "" }); }}
                  className="text-sm text-gray-400 hover:text-gray-600 w-full transition-colors"
                >
                  Utiliser un autre email
                </button>
              </div>
            </div>
          ) : (
          <>
          <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Inscription</h2>
          <p className="text-gray-500 mb-8 text-[15px]">
            Créez votre compte pour commencer
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="input-field pl-12"
                    placeholder="Nom"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prénom
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    className="input-field pl-12"
                    placeholder="Prénom"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-12"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="input-field pl-12"
                  placeholder="+33 6 12 34 56 78"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-12 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score <= 1 ? "text-red-500" :
                      passwordStrength.score <= 2 ? "text-amber-500" :
                      passwordStrength.score <= 3 ? "text-blue-500" : "text-green-500"
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pl-12"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5"
                required
              />
              <span className="text-[13px] text-gray-500">
                J&apos;accepte les{" "}
                <Link href="#" className="text-primary-600 hover:underline">
                  conditions d&apos;utilisation
                </Link>{" "}
                et la{" "}
                <Link href="#" className="text-primary-600 hover:underline">
                  politique de confidentialité
                </Link>
              </span>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-[15px]">
              Déjà un compte ?{" "}
              <Link
                href={redirect ? `/connexion?redirect=${encodeURIComponent(redirect)}` : "/connexion"}
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Se connecter
              </Link>
            </p>
          </div>

          <div className="mt-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 transition-colors">
              ← Retour à l&apos;accueil
            </Link>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
