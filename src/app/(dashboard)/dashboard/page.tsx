"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Store,
  ShoppingBag,
  ChevronRight,
  Loader2,
  Flame,
  Zap,
  BadgeCheck,
} from "lucide-react";
import { type DeviseCode, DEFAULT_DEVISE } from "@/lib/currencies";
import { formatMontant } from "@/lib/currencies";

interface Produit {
  id: string;
  nom: string;
  prix: number;
  prix_barre: number | null;
  devise: string;
  image_url: string | null;
  ventes: number;
  boutique: {
    id: string;
    nom: string;
    slug: string;
    logo_url: string | null;
    is_verified: boolean;
    ville: string | null;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [produits, setProduits] = useState<Produit[]>([]);
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
        const res = await fetch("/api/produits?limit=12&sort=populaire");
        const data = await res.json();
        setProduits(data.produits || []);
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

  return (
    <div className="px-4 pt-5 pb-28 space-y-5">

      {/* ── 1. HEADER ── */}
      <div>
        <h1 className="text-[22px] font-black tracking-tight text-gray-900">
          Salut, {user?.prenom || "l\u00e0"} \ud83d\udc4b
        </h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Achetez ou encaissez facilement</p>
      </div>

      {/* ── 2. PRIMARY CTA — Cr\u00e9er mon point de vente ── */}
      <Link
        href="/ma-boutique"
        className="block bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-cyan-50/60 rounded-[20px] p-5 border border-emerald-200/50 hover:border-emerald-300 hover:shadow-xl transition-all group active:scale-[0.99]"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-gray-900">\ud83c\udfea Cr\u00e9er mon point de vente</p>
            <p className="text-[13px] text-gray-500 mt-0.5">Encaissez vos clients simplement</p>
          </div>
        </div>
        <div className="mt-4">
          <span className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-500/20 group-hover:shadow-lg group-hover:shadow-emerald-500/30">
            <Zap className="w-4 h-4" />
            Cr\u00e9er mon point de vente
          </span>
        </div>
      </Link>

      {/* ── 3. SECONDARY CTA — Explorer ── */}
      <Link
        href="/explorer"
        className="flex items-center gap-3.5 bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all group active:scale-[0.99]"
      >
        <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
          <Store className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">\ud83d\udecd\ufe0f Explorer les boutiques</p>
          <p className="text-[11px] text-gray-400 mt-0.5">D\u00e9couvrez les points de vente autour de vous</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition shrink-0" />
      </Link>

      {/* ── 4. PRODUITS POPULAIRES — Horizontal scroll ── */}
      {produits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-black text-gray-900">Produits populaires</h2>
            <Link href="/explorer" className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5 hover:text-emerald-500 transition">
              Voir tout <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            {produits.map((p) => {
              const dv = (p.devise as DeviseCode) || "XOF";
              const hasPromo = p.prix_barre && p.prix_barre > p.prix;
              const discount = hasPromo ? Math.round(((p.prix_barre! - p.prix) / p.prix_barre!) * 100) : 0;

              return (
                <Link
                  key={p.id}
                  href={`/produit/${p.id}`}
                  className="shrink-0 w-[150px] bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-gray-200" />
                      </div>
                    )}
                    {hasPromo && (
                      <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        -{discount}%
                      </span>
                    )}
                    {p.ventes > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <Flame className="w-2 h-2" />{p.ventes}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    <p className="text-[11px] font-bold text-gray-900 line-clamp-1 leading-tight">{p.nom}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-[13px] font-black text-emerald-600">{formatMontant(p.prix, dv)}</span>
                      {hasPromo && (
                        <span className="text-[9px] text-gray-400 line-through">{formatMontant(p.prix_barre!, dv)}</span>
                      )}
                    </div>
                    {p.boutique && (
                      <div className="flex items-center gap-0.5 mt-1">
                        <span className="text-[9px] text-gray-400 truncate">{p.boutique.nom}</span>
                        {p.boutique.is_verified && <BadgeCheck className="w-2.5 h-2.5 text-emerald-500 shrink-0" />}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
