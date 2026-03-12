"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Store,
  ShoppingBag,
  MapPin,
  BadgeCheck,
  ChevronRight,
  Loader2,
  TrendingUp,
  Sparkles,
  X,
  Eye,
  Wallet,
  ArrowRight,
  Flame,
  Tag,
} from "lucide-react";
import { formatMontant } from "@/lib/currencies";
import { type DeviseCode, DEFAULT_DEVISE } from "@/lib/currencies";

interface Categorie {
  id: string;
  nom: string;
  slug: string;
  icone: string;
  ordre: number;
}

interface Boutique {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  ville: string | null;
  is_verified: boolean;
  vues: number;
  categorie: { nom: string; slug: string; icone: string } | null;
  produits: { count: number }[];
}

interface Produit {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  prix_barre: number | null;
  devise: string;
  image_url: string | null;
  categorie: string | null;
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

type ViewMode = "produits" | "boutiques";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("produits");
  const [sort, setSort] = useState("recent");
  const [solde, setSolde] = useState<number | null>(null);
  const [devise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("binq_devise") as DeviseCode) || DEFAULT_DEVISE;
    }
    return DEFAULT_DEVISE;
  });

  // Load categories + initial data + wallet balance
  useEffect(() => {
    const load = async () => {
      try {
        const fetches = [
          fetch("/api/categories"),
          fetch("/api/produits?limit=20"),
          fetch("/api/boutiques?limit=10"),
        ];
        if (user) fetches.push(fetch(`/api/wallet?devise=${devise}`));

        const responses = await Promise.all(fetches);
        const [catData, prodData, boutData] = await Promise.all(
          responses.slice(0, 3).map((r) => r.json())
        );
        setCategories(catData.categories || []);
        setProduits(prodData.produits || []);
        setBoutiques(boutData.boutiques || []);

        if (user && responses[3]) {
          const walletData = await responses[3].json();
          if (walletData.wallet) setSolde(walletData.wallet.solde || 0);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [user, devise]);

  // Search / filter
  useEffect(() => {
    if (!searchQuery && !selectedCategorie && sort === "recent") return;
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (selectedCategorie) params.set("categorie", selectedCategorie);
        params.set("sort", sort);
        params.set("limit", "30");

        if (viewMode === "produits") {
          const res = await fetch(`/api/produits?${params}`);
          const data = await res.json();
          setProduits(data.produits || []);
        } else {
          const bParams = new URLSearchParams();
          if (searchQuery) bParams.set("search", searchQuery);
          if (selectedCategorie) bParams.set("categorie", selectedCategorie);
          bParams.set("limit", "20");
          const res = await fetch(`/api/boutiques?${bParams}`);
          const data = await res.json();
          setBoutiques(data.boutiques || []);
        }
      } catch { /* ignore */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategorie, sort, viewMode]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28">

      {/* ── Greeting + Wallet Strip ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight">
            Salut, <span className="text-emerald-600">{user?.prenom || "là"}</span> 👋
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Trouvez les meilleurs produits locaux</p>
        </div>
        {user && solde !== null && (
          <Link href="/portefeuille" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-black text-emerald-700">{formatMontant(solde, devise)}</span>
          </Link>
        )}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher produits, boutiques..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* ── Category pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        <button
          onClick={() => setSelectedCategorie(null)}
          className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition ${
            !selectedCategorie
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          🔥 Tout
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategorie(selectedCategorie === cat.slug ? null : cat.slug)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategorie === cat.slug
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{cat.icone}</span>
            {cat.nom}
          </button>
        ))}
      </div>

      {/* ── View toggle + Sort ── */}
      <div className="flex items-center gap-2">
        <div className="flex bg-gray-100 rounded-xl p-0.5">
          <button
            onClick={() => setViewMode("produits")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              viewMode === "produits" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 inline mr-1" />Produits
          </button>
          <button
            onClick={() => setViewMode("boutiques")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              viewMode === "boutiques" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            <Store className="w-3.5 h-3.5 inline mr-1" />Boutiques
          </button>
        </div>
        {viewMode === "produits" && (
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="ml-auto text-xs bg-gray-100 border-0 rounded-lg px-2.5 py-2 text-gray-600 font-semibold outline-none"
          >
            <option value="recent">Plus récents</option>
            <option value="populaire">Populaires</option>
            <option value="prix-asc">Prix croissant</option>
            <option value="prix-desc">Prix décroissant</option>
          </select>
        )}
      </div>

      {/* ── Ma boutique CTA ── */}
      {user && (
        <Link
          href="/ma-boutique"
          className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl p-3.5 border border-emerald-200/50 hover:border-emerald-300 transition-all group"
        >
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Ouvrir ma boutique</p>
            <p className="text-[11px] text-gray-500">Vendez vos produits gratuitement</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
        </Link>
      )}

      {/* ═══ PRODUITS VIEW ═══ */}
      {viewMode === "produits" && (
        <div>
          {produits.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-bold text-sm">Aucun produit trouvé</p>
              <p className="text-gray-400 text-xs mt-1">Soyez le premier à vendre !</p>
              <Link href="/ma-boutique" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 transition-all active:scale-95 mt-4">
                <Store className="w-4 h-4" />
                Créer ma boutique
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {produits.map((p) => {
                const dv = (p.devise as DeviseCode) || "XOF";
                const hasPromo = p.prix_barre && p.prix_barre > p.prix;
                const discount = hasPromo ? Math.round(((p.prix_barre! - p.prix) / p.prix_barre!) * 100) : 0;

                return (
                  <Link
                    key={p.id}
                    href={`/produit/${p.id}`}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all group"
                  >
                    {/* Image */}
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-10 h-10 text-gray-200" />
                        </div>
                      )}
                      {hasPromo && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          -{discount}%
                        </span>
                      )}
                      {p.ventes > 0 && (
                        <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" />{p.ventes}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">{p.nom}</p>
                      <div className="flex items-baseline gap-1.5 mt-1.5">
                        <span className="text-sm font-black text-emerald-600">{formatMontant(p.prix, dv)}</span>
                        {hasPromo && (
                          <span className="text-[10px] text-gray-400 line-through">{formatMontant(p.prix_barre!, dv)}</span>
                        )}
                      </div>
                      {p.boutique && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Store className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] text-gray-500 truncate">{p.boutique.nom}</span>
                          {p.boutique.is_verified && <BadgeCheck className="w-3 h-3 text-emerald-500 shrink-0" />}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ BOUTIQUES VIEW ═══ */}
      {viewMode === "boutiques" && (
        <div className="space-y-3">
          {boutiques.length === 0 ? (
            <div className="text-center py-16">
              <Store className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-bold text-sm">Aucune boutique trouvée</p>
              <p className="text-gray-400 text-xs mt-1">Soyez le premier à vendre !</p>
            </div>
          ) : (
            boutiques.map((b) => (
              <Link
                key={b.id}
                href={`/boutique/${b.slug}`}
                className="flex items-center gap-3.5 bg-white rounded-2xl border border-gray-100 p-3.5 hover:shadow-md hover:border-gray-200 transition-all"
              >
                {/* Logo */}
                <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.nom} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-6 h-6 text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-gray-900 text-sm truncate">{b.nom}</p>
                    {b.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </div>
                  {b.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{b.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {b.categorie && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        {b.categorie.icone} {b.categorie.nom}
                      </span>
                    )}
                    {b.ville && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />{b.ville}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5" />{b.vues}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
