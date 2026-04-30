"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess } from "@/lib/haptics";
import { ArrowRight, Eye, EyeOff, Loader2, QrCode, Store, Truck } from "lucide-react";

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
    <div className="relative min-h-screen bg-[#fff6cf] flex flex-col items-center justify-center px-4 font-sans antialiased overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,197,94,0.20),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(250,204,21,0.42),transparent_30%),linear-gradient(180deg,#fff7d6_0%,#fffbea_62%,#f7f9fe_100%)]" />
      <div className="absolute -top-24 right-[-6rem] w-72 h-72 bg-yellow-300/40 rounded-full blur-3xl" />
      <div className="absolute top-40 left-[-5rem] w-64 h-64 bg-emerald-300/30 rounded-full blur-3xl" />

      {/* Logo */}
      <Link href="/" className="relative z-10 flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 via-green-500 to-yellow-400 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-500/25">
          <QrCode className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-950">Binq</span>
      </Link>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] rounded-[2rem] bg-white/90 border border-white p-6 sm:p-8 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black uppercase tracking-wider mb-4">
            <Store className="w-3.5 h-3.5" /> Espace partenaire
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.04em] text-slate-950 mb-2">Connectez votre commerce</h1>
          <p className="text-sm text-slate-500">Gérez vos commandes, vos produits et vos livraisons Binq.</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all"
              placeholder="vous@exemple.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-semibold text-slate-600">Mot de passe</label>
              <Link href="/mot-de-passe-oublie" className="text-[12px] text-emerald-600 hover:text-emerald-700 transition-colors font-semibold">
                Oublié ?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 pr-11 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 active:scale-[0.98] shadow-lg shadow-emerald-600/20"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Se connecter <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-slate-500 font-semibold">
          <Truck className="w-4 h-4 text-emerald-500" /> Livraison locale · Paiement sécurisé
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          Nouveau partenaire ?{" "}
          <Link href="/inscription" className="text-slate-950 font-bold hover:underline">
            Devenir partenaire
          </Link>
        </p>
      </div>

      {/* Bottom subtle branding */}
      <p className="relative z-10 mt-10 text-[11px] text-slate-400">&copy; {new Date().getFullYear()} Binq</p>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-6 h-6 text-neutral-400 animate-spin" /></div>}>
      <ConnexionForm />
    </Suspense>
  );
}
