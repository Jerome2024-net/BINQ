"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Store,
  ShoppingBag,
  MapPin,
  BadgeCheck,
  Phone,
  MessageCircle,
  Loader2,
  ArrowLeft,
  Eye,
  Share2,
  Star,
  Clock,
  Package,
  ChevronRight,
  Search,
  Grid3X3,
  List,
} from "lucide-react";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";

interface Boutique {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  ville: string | null;
  telephone: string | null;
  whatsapp: string | null;
  is_verified: boolean;
  vues: number;
  devise: string;
  created_at: string;
  categorie: { nom: string; slug: string; icone: string } | null;
  owner: { prenom: string; nom: string; avatar_url: string | null } | null;
}

interface Produit {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  prix_barre: number | null;
  devise: string;
  image_url: string | null;
  ventes: number;
  categorie: string | null;
}

export default function BoutiquePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/boutiques/${slug}`);
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Boutique introuvable"); return; }
        setBoutique(data.boutique);
        setProduits(data.produits || []);
      } catch { setError("Erreur de chargement"); }
      finally { setLoading(false); }
    };
    load();
  }, [slug]);

  const handleShare = async () => {
    if (!boutique) return;
    const url = `${window.location.origin}/boutique/${boutique.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: boutique.nom, text: `Decouvrez ${boutique.nom} sur Binq`, url }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000); } catch { /* ignore */ }
    }
  };

  // Filter products
  const categories = Array.from(new Set(produits.map(p => p.categorie).filter(Boolean))) as string[];
  const filtered = produits.filter(p => {
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCat && p.categorie !== selectedCat) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center mx-auto">
              <Loader2 className="w-7 h-7 text-black animate-spin" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-4 font-medium">Chargement de la boutique...</p>
        </div>
      </div>
    );
  }

  if (error || !boutique) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Store className="w-9 h-9 text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Boutique introuvable</h2>
          <p className="text-gray-500 text-sm mb-6">{error || "Cette boutique n'existe pas ou a ete desactivee."}</p>
          <Link href="/explorer" className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition">
            <ArrowLeft className="w-4 h-4" />Explorer les boutiques
          </Link>
        </div>
      </div>
    );
  }

  const devise = (boutique.devise as DeviseCode) || "XOF";
  const ownerInitials = boutique.owner
    ? `${boutique.owner.prenom?.[0] || ""}${boutique.owner.nom?.[0] || ""}`.toUpperCase()
    : "?";
  const memberSince = boutique.created_at
    ? new Date(boutique.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── Floating header ── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/explorer" className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition active:scale-95">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 text-sm truncate">{boutique.nom}</h1>
            {boutique.ville && <p className="text-[11px] text-gray-400 truncate">{boutique.ville}</p>}
          </div>
          <button
            onClick={handleShare}
            className="p-2 rounded-xl hover:bg-gray-100 transition active:scale-95 relative"
          >
            <Share2 className="w-5 h-5 text-gray-700" />
            {shared && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                Copie!
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* ── Hero Banner ── */}
        <div className="relative">
          <div className="h-44 bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
            {boutique.banner_url ? (
              <img
                src={boutique.banner_url}
                alt=""
                className="w-full h-full object-cover opacity-60"
              />
            ) : (
              <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black" />
            )}
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>

          {/* ── Profile Card (overlapping banner) ── */}
          <div className="relative -mt-16 mx-4">
            <div className="bg-white rounded-2xl shadow-lg shadow-black/5 p-5 border border-gray-100">
              <div className="flex items-start gap-4">
                {/* Logo boutique */}
                <div className="relative flex-shrink-0">
                  <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden ring-4 ring-white shadow-md bg-gray-100 flex items-center justify-center">
                    {boutique.logo_url ? (
                      <img src={boutique.logo_url} alt={boutique.nom} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  {boutique.is_verified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                      <BadgeCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-gray-900 truncate">{boutique.nom}</h2>
                  </div>
                  {boutique.categorie && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <span>{boutique.categorie.icone}</span>
                      {boutique.categorie.nom}
                    </p>
                  )}
                  {boutique.ville && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{boutique.ville}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              {boutique.description && (
                <p className="text-sm text-gray-600 mt-4 leading-relaxed">{boutique.description}</p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-1 mt-4 pt-4 border-t border-gray-100">
                <div className="flex-1 text-center">
                  <p className="text-lg font-black text-gray-900">{produits.length}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Produits</p>
                </div>
                <div className="w-px h-8 bg-gray-100" />
                <div className="flex-1 text-center">
                  <p className="text-lg font-black text-gray-900">{boutique.vues}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Vues</p>
                </div>
                <div className="w-px h-8 bg-gray-100" />
                <div className="flex-1 text-center">
                  <p className="text-lg font-black text-gray-900">
                    {produits.reduce((s, p) => s + (p.ventes || 0), 0)}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Ventes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Owner card ── */}
        {boutique.owner && (
          <div className="mx-4 mt-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {boutique.owner.avatar_url ? (
                  <img src={boutique.owner.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-gray-500">{ownerInitials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {boutique.owner.prenom} {boutique.owner.nom}
                </p>
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {memberSince ? `Membre depuis ${memberSince}` : "Vendeur Binq"}
                </p>
              </div>
              {boutique.is_verified && (
                <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-lg">
                  <BadgeCheck className="w-3 h-3" />Verifie
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Search + Category filters ── */}
        <div className="px-4 mt-5">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition placeholder:text-gray-400"
            />
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCat(null)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  !selectedCat
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Tout
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                    selectedCat === cat
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Products header ── */}
        <div className="px-4 mt-5 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">
            {search || selectedCat ? `${filtered.length} resultat${filtered.length > 1 ? "s" : ""}` : `${produits.length} produit${produits.length > 1 ? "s" : ""}`}
          </h3>
        </div>

        {/* ── Product grid ── */}
        <div className="px-4 mt-3 pb-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Package className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium text-sm">
                {search || selectedCat ? "Aucun produit trouve" : "Aucun produit pour le moment"}
              </p>
              {(search || selectedCat) && (
                <button
                  onClick={() => { setSearch(""); setSelectedCat(null); }}
                  className="mt-3 text-xs text-black font-semibold underline"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((p) => {
                const pDevise = (p.devise as DeviseCode) || devise;
                const hasPromo = p.prix_barre && p.prix_barre > p.prix;
                const discount = hasPromo ? Math.round(((p.prix_barre! - p.prix) / p.prix_barre!) * 100) : 0;

                return (
                  <Link
                    key={p.id}
                    href={`/produit/${p.id}`}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:shadow-black/5 hover:border-gray-200 transition-all duration-300 group active:scale-[0.98]"
                  >
                    {/* Image */}
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.nom}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                          <ShoppingBag className="w-10 h-10 text-gray-200" />
                        </div>
                      )}
                      {/* Promo badge */}
                      {hasPromo && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                          -{discount}%
                        </span>
                      )}
                      {/* Sales badge */}
                      {p.ventes > 0 && (
                        <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          {p.ventes} vendu{p.ventes > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug min-h-[2.25rem]">
                        {p.nom}
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-sm font-black text-black">
                          {formatMontant(p.prix, pDevise)}
                        </span>
                        {hasPromo && (
                          <span className="text-[10px] text-gray-400 line-through">
                            {formatMontant(p.prix_barre!, pDevise)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Contact Bar ── */}
      {(boutique.whatsapp || boutique.telephone) && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-xl border-t border-gray-100 safe-area-bottom">
          <div className="max-w-lg mx-auto px-4 py-3 flex gap-2">
            {boutique.whatsapp && (
              <a
                href={`https://wa.me/${boutique.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1fb855] transition active:scale-[0.98] shadow-sm"
              >
                <MessageCircle className="w-4.5 h-4.5" />
                WhatsApp
              </a>
            )}
            {boutique.telephone && (
              <a
                href={`tel:${boutique.telephone}`}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition active:scale-[0.98] shadow-sm ${
                  boutique.whatsapp
                    ? "flex-shrink-0 w-14 bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "flex-1 bg-black text-white hover:bg-gray-800"
                }`}
              >
                <Phone className="w-4.5 h-4.5" />
                {!boutique.whatsapp && "Appeler"}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
