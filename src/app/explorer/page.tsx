"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BinqLogo from "@/components/BinqLogo";
import {
  BadgeCheck,
  ChevronDown,
  Clock,
  Loader2,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  X,
  Zap,
} from "lucide-react";

interface Categorie {
  id: string;
  nom: string;
  slug: string;
  icone: string | null;
}

interface Boutique {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  ville: string | null;
  adresse?: string | null;
  devise?: string | null;
  is_verified: boolean;
  vues?: number;
  categorie: { nom: string; slug: string; icone: string | null } | null;
  produits?: { count: number }[];
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
  stock?: number | null;
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

const QUICK_CATEGORIES = [
  { slug: "", nom: "Tout", icone: "✨" },
  { slug: "restauration", nom: "Restaurants", icone: "🍽️" },
  { slug: "alimentation", nom: "Courses", icone: "🛒" },
  { slug: "mode", nom: "Mode", icone: "👟" },
  { slug: "beaute", nom: "Beauté", icone: "💄" },
  { slug: "services", nom: "Services", icone: "⚡" },
];

function formatPrice(value: number, devise = "XOF") {
  return `${Number(value || 0).toLocaleString("fr-FR")} ${devise}`;
}

export default function ExplorerPublicPage() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("produits");
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const displayedCategories = useMemo(() => {
    if (categories.length === 0) return QUICK_CATEGORIES;
    const mapped = categories.map((cat) => ({
      slug: cat.slug,
      nom: cat.nom,
      icone: cat.icone || "🏪",
    }));
    return [{ slug: "", nom: "Tout", icone: "✨" }, ...mapped];
  }, [categories]);

  const fetchExplorer = useCallback(
    async ({ append = false, nextOffset = 0 } = {}) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        if (selectedCategory) params.set("categorie", selectedCategory);
        params.set("limit", "20");
        params.set("offset", String(nextOffset));

        const productParams = new URLSearchParams(params);
        productParams.set("sort", sort);

        const [catRes, prodRes, shopRes] = await Promise.all([
          categories.length === 0 ? fetch("/api/categories") : null,
          fetch(`/api/produits?${productParams}`),
          fetch(`/api/boutiques?${params}`),
        ]);

        if (catRes) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        const [prodData, shopData] = await Promise.all([
          prodRes.json(),
          shopRes.json(),
        ]);

        const nextProduits: Produit[] = prodData.produits || [];
        const nextBoutiques: Boutique[] = shopData.boutiques || [];

        setProduits((prev) =>
          append ? [...prev, ...nextProduits] : nextProduits
        );
        setBoutiques((prev) =>
          append ? [...prev, ...nextBoutiques] : nextBoutiques
        );
        setHasMore(
          viewMode === "produits"
            ? nextProduits.length === 20
            : nextBoutiques.length === 20
        );
        setOffset(nextOffset + 20);
      } catch {
        if (!append) {
          setProduits([]);
          setBoutiques([]);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [categories.length, searchQuery, selectedCategory, sort, viewMode]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
      fetchExplorer({ nextOffset: 0 });
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchExplorer]);

  const activeItemsCount =
    viewMode === "produits" ? produits.length : boutiques.length;

  return (
    <div className="min-h-screen bg-[#fff8d8] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-yellow-900/5 bg-[#fff8d8]/92 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-10">
          <Link href="/" className="flex items-center gap-2">
            <BinqLogo size="sm" />
          </Link>

          <nav className="hidden items-center gap-2 sm:flex">
            <Link
              href="/explorer"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#14852F] shadow-sm ring-1 ring-yellow-900/5"
            >
              Livraison
            </Link>
          </nav>

          <button
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-2xl p-2 text-slate-600 hover:bg-slate-50 sm:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="space-y-1 border-t border-yellow-900/5 bg-[#fff8d8] px-5 py-3 sm:hidden">
            <Link
              href="/explorer"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl bg-white px-3 py-2.5 text-sm font-black text-[#14852F]"
            >
              Livraison
            </Link>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden bg-[#ffde33]">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#14852F]/12 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 pb-10 pt-8 sm:pt-12 lg:grid-cols-[1fr_500px] lg:items-center lg:px-10 lg:pb-16 lg:pt-16">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#14852F] shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Binq Clients
            </div>
            <h1 className="max-w-3xl text-[44px] font-black leading-[0.9] tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-[84px]">
              Courses, repas et boutiques livrés vite.
            </h1>
            <p className="mt-5 max-w-xl text-base font-extrabold leading-relaxed text-slate-800 sm:text-lg">
              Entrez votre adresse, trouvez les commerces autour de vous et commandez en quelques secondes.
            </p>
            <div className="mt-7 max-w-2xl rounded-[2rem] bg-white p-2.5 shadow-2xl shadow-yellow-900/15">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#14852F]" />
                  <input
                    type="text"
                    placeholder="Saisissez votre adresse de livraison"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full rounded-[1.35rem] border-0 bg-slate-50 py-4 pl-12 pr-11 text-[15px] font-extrabold text-slate-950 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-[#14852F]/10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Effacer la recherche"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button className="rounded-[1.35rem] bg-[#14852F] px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#0f6f27]">
                  Voir autour de moi
                </button>
              </div>
              <div className="mt-2 border-t border-slate-100 pt-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit, restaurant ou boutique"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full rounded-[1.15rem] border-0 bg-white py-3 pl-11 pr-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-yellow-200/60"
                />
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-slate-800">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm"><Truck className="h-4 w-4 text-[#14852F]" /> Livraison rapide</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm"><Zap className="h-4 w-4 text-[#14852F]" /> Tout en une app</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm"><Store className="h-4 w-4 text-[#14852F]" /> Commerces locaux</span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -left-8 top-12 h-28 w-28 rounded-full bg-white/55 blur-2xl" />
            <div className="relative rotate-1 rounded-[2.5rem] bg-white p-5 shadow-2xl shadow-yellow-900/20">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#14852F]">Top demandes</p>
                  <p className="mt-1 text-xl font-black text-slate-950">Livré à votre porte</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#14852F] text-white shadow-lg shadow-emerald-700/25">
                  <ShoppingBag className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  ["Poulet braisé", "Chez Awa", "3 500 FCFA", "🔥"],
                  ["Panier fruits", "Marché Frais", "5 000 FCFA", "🥭"],
                  ["Sneakers mode", "Binq Fashion", "12 000 FCFA", "👟"],
                ].map(([name, shop, price, emoji]) => (
                  <div key={name} className="flex items-center gap-3 rounded-3xl bg-[#fff8d8] p-3 ring-1 ring-yellow-900/5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">{emoji}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-950">{name}</p>
                      <p className="truncate text-xs font-bold text-slate-400">{shop}</p>
                    </div>
                    <p className="text-sm font-black text-emerald-700">{price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-40 border-b border-yellow-900/5 bg-white/88 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="flex gap-3 overflow-x-auto py-4 scrollbar-none">
            {displayedCategories.map((category) => {
              const active = selectedCategory === category.slug;
              return (
                <button
                  key={category.slug || "all"}
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`shrink-0 rounded-[1.4rem] border px-4 py-3 text-sm font-black transition ${
                    active
                      ? "border-transparent bg-[#14852F] text-white shadow-lg shadow-emerald-700/20"
                      : "border-slate-100 bg-white text-slate-800 shadow-sm hover:border-yellow-200 hover:bg-yellow-50 hover:text-[#14852F] hover:shadow-md"
                  }`}
                >
                  <span className="mr-1.5">{category.icone}</span>
                  {category.nom}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <main className="bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#14852F]">Autour de vous</p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.035em] text-slate-950">
              Qu&apos;est-ce qu&apos;on livre aujourd&apos;hui ?
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Restaurants, supermarchés, pharmacies, boutiques et services.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-100">
              <button
                onClick={() => setViewMode("produits")}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                  viewMode === "produits"
                    ? "bg-[#14852F] text-white"
                    : "text-slate-500 hover:text-slate-950"
                }`}
              >
                Produits
              </button>
              <button
                onClick={() => setViewMode("boutiques")}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                  viewMode === "boutiques"
                    ? "bg-[#14852F] text-white"
                    : "text-slate-500 hover:text-slate-950"
                }`}
              >
                Boutiques
              </button>
            </div>
            {viewMode === "produits" && (
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="rounded-2xl border border-slate-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 shadow-sm outline-none"
              >
                <option value="recent">Récents</option>
                <option value="populaire">Populaires</option>
                <option value="prix-asc">Prix ↑</option>
                <option value="prix-desc">Prix ↓</option>
              </select>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : activeItemsCount === 0 ? (
          <EmptyState
            onReset={() => {
              setSearchQuery("");
              setSelectedCategory("");
            }}
          />
        ) : viewMode === "produits" ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {produits.map((produit) => (
              <ProductCard key={produit.id} produit={produit} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {boutiques.map((boutique) => (
              <ShopCard key={boutique.id} boutique={boutique} />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => fetchExplorer({ append: true, nextOffset: offset })}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-100 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-60"
            >
              {loadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {loadingMore ? "Chargement..." : "Voir plus"}
            </button>
          </div>
        )}
      </div>
      </main>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-sm">
      <div className="aspect-[4/3] bg-emerald-50" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 rounded-full bg-slate-100" />
        <div className="h-3 w-full rounded-full bg-slate-100" />
        <div className="h-3 w-1/2 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function ProductCard({ produit }: { produit: Produit }) {
  const discount = produit.prix_barre && produit.prix_barre > produit.prix;

  return (
    <Link href={`/produit/${produit.id}`} className="group block h-full">
      <article className="h-full overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm shadow-emerald-950/5 ring-1 ring-slate-100/70 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-950/10">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50">
          {produit.image_url ? (
            <Image
              src={produit.image_url}
              alt={produit.nom}
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-emerald-200" />
            </div>
          )}
          {discount && (
            <div className="absolute left-3 top-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-slate-950 shadow-sm">
              Promo
            </div>
          )}
        </div>
        <div className="space-y-4 p-4">
          <div>
            <h3 className="line-clamp-2 text-[16px] font-black leading-snug text-slate-950 transition group-hover:text-emerald-700">
              {produit.nom}
            </h3>
            {produit.description && (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
                {produit.description}
              </p>
            )}
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Prix</p>
              <p className="text-lg font-black text-[#14852F]">{formatPrice(produit.prix, produit.devise)}</p>
            </div>
            <span className="rounded-full bg-[#14852F] px-3 py-2 text-xs font-black text-white shadow-lg shadow-emerald-700/20">Commander</span>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
            <ShopAvatar src={produit.boutique.logo_url} name={produit.boutique.nom} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-slate-700">
                {produit.boutique.nom}
              </p>
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3 w-3" /> {produit.boutique.ville || "Autour de vous"}
              </p>
            </div>
            {produit.boutique.is_verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

function ShopCard({ boutique }: { boutique: Boutique }) {
  const productCount = boutique.produits?.[0]?.count || 0;

  return (
    <Link href={`/boutique/${boutique.slug}`} className="group block h-full">
      <article className="h-full overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm shadow-emerald-950/5 ring-1 ring-slate-100/70 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-950/10">
        <div className="h-20 bg-gradient-to-br from-[#14852F] via-emerald-600 to-lime-400" />
        <div className="-mt-8 p-5 pt-0">
        <div className="flex gap-4">
          <ShopAvatar src={boutique.logo_url} name={boutique.nom} large />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-950 transition group-hover:text-emerald-700">
                {boutique.nom}
              </h3>
              {boutique.is_verified && (
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              )}
            </div>
            <p className="mt-1 text-sm font-bold text-emerald-700">
              {boutique.categorie?.nom || "Commerce local"}
            </p>
            {boutique.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
                {boutique.description}
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-black text-slate-600">
          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-800 ring-1 ring-emerald-100">
            <Store className="mx-auto mb-1 h-4 w-4" />
            {productCount} produit{productCount > 1 ? "s" : ""}
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
            <MapPin className="mx-auto mb-1 h-4 w-4 text-emerald-600" />
            {boutique.ville || "Local"}
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
            <Clock className="mx-auto mb-1 h-4 w-4 text-emerald-600" />
            Ouvert
          </div>
        </div>
        </div>
      </article>
    </Link>
  );
}

function ShopAvatar({
  src,
  name,
  large = false,
}: {
  src: string | null;
  name: string;
  large?: boolean;
}) {
  const size = large ? "h-16 w-16 rounded-3xl" : "h-9 w-9 rounded-2xl";

  return (
    <div className={`${size} relative shrink-0 overflow-hidden bg-emerald-50 ring-1 ring-emerald-100`}>
      {src ? (
        <Image src={src} alt="" fill className="object-cover" unoptimized />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-black text-emerald-700">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-[2rem] border border-white bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50">
        <Store className="h-8 w-8 text-emerald-300" />
      </div>
      <h3 className="text-xl font-black text-slate-950">Aucun résultat trouvé</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
        Essayez une autre recherche ou choisissez une autre catégorie pour
        explorer Binq Clients.
      </p>
      <button
        onClick={onReset}
        className="mt-5 rounded-full bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
