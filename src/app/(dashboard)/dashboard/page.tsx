"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowRight, ChevronRight } from "lucide-react";
import { type DeviseCode, DEFAULT_DEVISE, formatMontant } from "@/lib/currencies";

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
        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // PAS DE BOUTIQUE → Onboarding épuré
  // ═══════════════════════════════════════════
  if (!boutique) {
    return (
      <div className="px-4 pt-8 pb-28 flex flex-col items-center">
        {/* Header */}
        <h1 className="text-[22px] font-black tracking-tight text-gray-900 self-start">
          Salut, {user?.prenom || "là"} 👋
        </h1>

        {/* Montant central */}
        <div className="mt-16 mb-2 text-center">
          <p className="text-[42px] font-black tracking-tight text-gray-900 leading-none">0 FCFA</p>
          <p className="text-[13px] text-gray-400 font-medium mt-2">Aujourd&apos;hui</p>
        </div>

        {/* CTA */}
        <Link
          href="/ma-boutique"
          className="mt-10 w-full max-w-[280px] flex items-center justify-center py-4 bg-gray-900 text-white font-bold text-[15px] rounded-2xl hover:bg-gray-800 transition-all active:scale-[0.98]"
        >
          Créer ma boutique
        </Link>

        <p className="text-[12px] text-gray-400 mt-4">Encaissez vos clients par QR code</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // A UNE BOUTIQUE → Dashboard épuré
  // ═══════════════════════════════════════════
  return (
    <div className="px-4 pt-8 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[22px] font-black tracking-tight text-gray-900">
          {boutique.nom}
        </h1>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-600">En ligne</span>
        </div>
      </div>

      {/* Montant central */}
      <div className="mt-12 mb-1 text-center">
        <p className="text-[42px] font-black tracking-tight text-gray-900 leading-none">
          {formatMontant(stats.totalVentes, devise)}
        </p>
        <p className="text-[13px] text-gray-400 font-medium mt-2">Revenus</p>
      </div>

      {/* Stats inline */}
      <div className="flex items-center justify-center gap-6 mt-6">
        <div className="text-center">
          <p className="text-lg font-black text-gray-900">{stats.totalCommandes}</p>
          <p className="text-[11px] text-gray-400">Ventes</p>
        </div>
        <div className="w-px h-6 bg-gray-200" />
        <div className="text-center">
          <p className="text-lg font-black text-gray-900">{stats.totalProduits}</p>
          <p className="text-[11px] text-gray-400">Produits</p>
        </div>
      </div>

      {/* CTA principal */}
      <div className="mt-10 flex justify-center">
        <Link
          href="/ma-boutique"
          className="w-full max-w-[280px] flex items-center justify-center py-4 bg-gray-900 text-white font-bold text-[15px] rounded-2xl hover:bg-gray-800 transition-all active:scale-[0.98]"
        >
          Encaisser
        </Link>
      </div>

      {/* Actions */}
      <div className="mt-10 space-y-1">
        {[
          { href: "/ma-boutique", label: "Gérer mes produits" },
          { href: "/commandes", label: "Mes commandes" },
          { href: `/boutique/${boutique.slug}`, label: "Voir ma boutique", external: true },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            target={action.external ? "_blank" : undefined}
            className="flex items-center justify-between py-3.5 border-b border-gray-100 group"
          >
            <span className="text-[14px] font-semibold text-gray-700 group-hover:text-gray-900 transition">{action.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
          </Link>
        ))}
      </div>
    </div>
  );
}
