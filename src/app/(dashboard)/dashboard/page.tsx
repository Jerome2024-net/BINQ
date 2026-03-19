"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  Zap,
  QrCode,
  Package,
  TrendingUp,
  ArrowRight,
  Store,
} from "lucide-react";
import { type DeviseCode, DEFAULT_DEVISE } from "@/lib/currencies";
import { formatMontant } from "@/lib/currencies";

interface BoutiqueInfo {
  id: string;
  nom: string;
  slug: string;
  logo_url: string | null;
}

interface Stats {
  totalProduits: number;
  totalCommandes: number;
  totalVentes: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [boutique, setBoutique] = useState<BoutiqueInfo | null>(null);
  const [stats, setStats] = useState<Stats>({ totalProduits: 0, totalCommandes: 0, totalVentes: 0 });
  const [loading, setLoading] = useState(true);
  const [devise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("binq_devise") as DeviseCode) || DEFAULT_DEVISE;
    }
    return DEFAULT_DEVISE;
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/ma-boutique");
        const data = await res.json();
        if (data.boutique) {
          setBoutique(data.boutique);
          setStats({
            totalProduits: data.stats?.totalProduits || 0,
            totalCommandes: data.stats?.totalCommandes || 0,
            totalVentes: data.stats?.totalVentes || 0,
          });
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // PAS DE BOUTIQUE → Onboarding marchand
  // ═══════════════════════════════════════════
  if (!boutique) {
    return (
      <div className="px-4 pt-6 pb-28">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-black tracking-tight text-gray-900">
            Salut, {user?.prenom || "là"} 👋
          </h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Commencez à encaisser en quelques secondes</p>
        </div>

        {/* Grande carte CTA */}
        <Link
          href="/ma-boutique"
          className="block bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-cyan-50/60 rounded-[20px] p-6 border border-emerald-200/50 hover:border-emerald-300 hover:shadow-xl transition-all group active:scale-[0.99] mb-6"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-gray-900">🏪 Créez votre point de vente</p>
              <p className="text-[13px] text-gray-500 mt-1">Encaissez vos clients simplement</p>
            </div>
          </div>
          <span className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-500 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-500/25 group-hover:bg-emerald-400 transition active:scale-[0.98]">
            <Zap className="w-5 h-5" />
            Créer mon point de vente
          </span>
        </Link>

        {/* 3 avantages — ultra simple */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: QrCode, label: "QR prêt en 30s" },
            { icon: Zap, label: "Paiement instantané" },
            { icon: Package, label: "Produits illimités" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 py-4 px-2 bg-white rounded-2xl border border-gray-100">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <item.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-[11px] font-bold text-gray-600 text-center leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // A UNE BOUTIQUE → Dashboard marchand
  // ═══════════════════════════════════════════
  return (
    <div className="px-4 pt-5 pb-28 space-y-5">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[11px] font-bold text-emerald-600">En ligne · Prêt à encaisser</span>
        </div>
        <h1 className="text-[22px] font-black tracking-tight text-gray-900">
          {boutique.nom}
        </h1>
      </div>

      {/* Accès rapide terminal */}
      <Link
        href="/ma-boutique"
        className="block bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-cyan-50/60 rounded-[20px] p-5 border border-emerald-200/50 hover:border-emerald-300 hover:shadow-xl transition-all group active:scale-[0.99]"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <QrCode className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-base font-black text-gray-900">Ouvrir mon terminal</p>
            <p className="text-[13px] text-gray-500 mt-0.5">QR code, encaissement, produits</p>
          </div>
        </div>
        <span className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 group-hover:bg-emerald-400 transition">
          <Zap className="w-4 h-4" />
          Encaisser maintenant
        </span>
      </Link>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-xl font-black text-gray-900">{stats.totalCommandes}</p>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">Ventes</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-sm font-black text-gray-900">{formatMontant(stats.totalVentes, devise)}</p>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">Revenus</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-xl font-black text-gray-900">{stats.totalProduits}</p>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">Produits</p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="space-y-2.5">
        <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Actions rapides</h2>

        <Link
          href="/ma-boutique"
          className="flex items-center gap-3.5 bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all active:scale-[0.99]"
        >
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-gray-900 flex-1">Encaisser un montant</p>
          <ArrowRight className="w-4 h-4 text-gray-300" />
        </Link>

        <Link
          href="/ma-boutique"
          className="flex items-center gap-3.5 bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all active:scale-[0.99]"
        >
          <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-cyan-600" />
          </div>
          <p className="text-sm font-bold text-gray-900 flex-1">Gérer mes produits</p>
          <ArrowRight className="w-4 h-4 text-gray-300" />
        </Link>

        <Link
          href="/commandes"
          className="flex items-center gap-3.5 bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all active:scale-[0.99]"
        >
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-violet-600" />
          </div>
          <p className="text-sm font-bold text-gray-900 flex-1">Voir mes commandes</p>
          <ArrowRight className="w-4 h-4 text-gray-300" />
        </Link>

        <Link
          href={`/boutique/${boutique.slug}`}
          target="_blank"
          className="flex items-center gap-3.5 bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all active:scale-[0.99]"
        >
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-sm font-bold text-gray-900 flex-1">Voir ma boutique (client)</p>
          <ArrowRight className="w-4 h-4 text-gray-300" />
        </Link>
      </div>
    </div>
  );
}
