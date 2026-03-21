"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag } from "lucide-react";
import { type DeviseCode, DEFAULT_DEVISE, formatMontant } from "@/lib/currencies";

interface BoutiqueInfo {
  id: string;
  nom: string;
  slug: string;
  logo_url: string | null;
  categorie?: { nom: string; slug: string; icone: string } | null;
}

interface ProduitInfo {
  id: string;
  nom: string;
  prix: number;
  devise: string;
  image_url: string | null;
  boutique?: { nom: string; slug: string } | null;
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
  const [walletSolde, setWalletSolde] = useState<number>(0);
  const [boutiques, setBoutiques] = useState<BoutiqueInfo[]>([]);
  const [produits, setProduits] = useState<ProduitInfo[]>([]);
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
        const [meRes, boutiquesRes, produitsRes, walletRes] = await Promise.all([
          fetch("/api/boutiques/me"),
          fetch("/api/boutiques?limit=10"),
          fetch("/api/produits?limit=10"),
          fetch(`/api/wallet?devise=${devise}`),
        ]);
        const [meData, boutiquesData, produitsData, walletData] = await Promise.all([
          meRes.json(),
          boutiquesRes.json(),
          produitsRes.json(),
          walletRes.json(),
        ]);

        if (meData.boutique) {
          setBoutique(meData.boutique);
          setStats({
            totalProduits: meData.stats?.totalProduits || 0,
            totalCommandes: meData.stats?.totalCommandes || 0,
            totalVentes: meData.stats?.totalVentes || 0,
          });
        }
        if (walletData.wallet) {
          setWalletSolde(walletData.wallet.solde || 0);
        }
        setBoutiques(boutiquesData.boutiques || []);
        setProduits(produitsData.produits || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [devise]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // PAS DE BOUTIQUE → Onboarding épuré
  // ═══════════════════════════════════════════
  if (!boutique) {
    return (
      <div className="px-5 pt-10 pb-28">
        <h1 className="text-[22px] font-black tracking-tight text-gray-900">
          Salut, {user?.prenom || "là"} 👋
        </h1>

        <div className="mt-20 text-center">
          <p className="text-[44px] font-black tracking-tight text-gray-900 leading-none">0 FCFA</p>
          <p className="text-[13px] text-gray-500 font-semibold mt-3">Aujourd&apos;hui</p>
        </div>

        <div className="mt-14 flex justify-center">
          <Link
            href="/ma-boutique"
            className="w-full max-w-[280px] flex items-center justify-center py-4 bg-emerald-500 text-white font-bold text-[15px] rounded-2xl hover:bg-emerald-400 transition-all active:scale-[0.97]"
          >
            Créer ma boutique
          </Link>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // A UNE BOUTIQUE → Dashboard + Découverte
  // ═══════════════════════════════════════════
  const otherBoutiques = boutiques.filter((b) => b.id !== boutique.id);

  return (
    <div className="px-5 pt-10 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-black tracking-tight text-gray-900">
          Salut, {user?.prenom || "là"} 👋
        </h1>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-600">En ligne</span>
        </div>
      </div>

      {/* Montant central — solde wallet */}
      <Link href="/portefeuille" className="block mt-12 text-center active:scale-[0.98] transition-transform">
        <p className="text-[42px] font-black tracking-tight text-gray-900 leading-none">
          {formatMontant(walletSolde, devise)}
        </p>
        <p className="text-[13px] text-gray-500 font-medium mt-2">Solde disponible</p>
      </Link>

      {/* Stats inline */}
      <div className="flex items-center justify-center gap-8 mt-6">
        <div className="text-center">
          <p className="text-lg font-black text-gray-900">{stats.totalCommandes}</p>
          <p className="text-[11px] text-gray-400">Ventes</p>
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="text-center">
          <p className="text-lg font-black text-gray-900">{stats.totalProduits}</p>
          <p className="text-[11px] text-gray-400">Produits</p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 flex justify-center">
        <Link
          href="/ma-boutique"
          className="w-full max-w-[280px] flex items-center justify-center py-4 bg-emerald-500 text-white font-bold text-[15px] rounded-2xl hover:bg-emerald-400 transition-all active:scale-[0.97]"
        >
          Encaisser
        </Link>
      </div>

      {/* ─── Découverte ─── */}

      {/* Boutiques */}
      {otherBoutiques.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-gray-900">Boutiques</h2>
            <Link href="/explorer" className="text-[12px] font-semibold text-emerald-600">Voir tout</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {otherBoutiques.slice(0, 8).map((b) => (
              <Link key={b.id} href={`/boutique/${b.slug}`} className="flex-shrink-0 w-[72px] text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">{b.categorie?.icone || "🏪"}</span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-gray-600 mt-1.5 truncate">{b.nom}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Produits récents */}
      {produits.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-gray-900">Produits récents</h2>
            <Link href="/explorer" className="text-[12px] font-semibold text-emerald-600">Voir tout</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {produits.slice(0, 10).map((p) => (
              <Link key={p.id} href={`/produit/${p.id}`} className="flex-shrink-0 w-36 rounded-2xl border border-gray-100 overflow-hidden bg-white">
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-gray-200" />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-[12px] font-semibold text-gray-900 truncate">{p.nom}</p>
                  <p className="text-[12px] font-bold text-emerald-600 mt-0.5">
                    {p.prix?.toLocaleString("fr-FR")} {p.devise || "FCFA"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
