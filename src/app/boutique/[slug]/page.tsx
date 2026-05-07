"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Store,
  ShoppingBag,
  MapPin,
  Phone,
  BadgeCheck,
  Loader2,
  ArrowLeft,
  Share2,
  Clock,
  Package,
  Search,
  QrCode,
  ShieldCheck,
  Zap,
  Truck,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";
import type { MapboxPlace } from "@/lib/mapbox";

const MapboxAddressPicker = dynamic(() => import("@/components/location/MapboxAddressPicker"), {
  ssr: false,
  loading: () => <div className="mt-1 h-24 rounded-xl bg-white border border-blue-100 animate-pulse" />,
});

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
  user_id: string;
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
  stock?: number | null;
}

interface CartItem extends Produit {
  quantite: number;
}

export default function BoutiquePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();
  const produitsRef = useRef<HTMLDivElement>(null);
  const autoAddedProductIdRef = useRef<string | null>(null);

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ reference: string; total: number } | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [clientNom, setClientNom] = useState("");
  const [clientTelephone, setClientTelephone] = useState("");
  const [adresseLivraison, setAdresseLivraison] = useState("");
  const [lieuLivraison, setLieuLivraison] = useState<MapboxPlace | null>(null);
  const [noteLivraison, setNoteLivraison] = useState("");

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

  const boutiqueUrl = typeof window !== "undefined" ? `${window.location.origin}/boutique/${boutique?.slug || slug}` : "";

  const handleShare = async () => {
    if (!boutique) return;
    if (navigator.share) {
      try { await navigator.share({ title: boutique.nom, text: `Decouvrez ${boutique.nom} sur Binq`, url: boutiqueUrl }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(boutiqueUrl); setShared(true); setTimeout(() => setShared(false), 2000); } catch { /* ignore */ }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(boutiqueUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const shareToSocial = (platform: string) => {
    const text = encodeURIComponent(`Decouvrez ${boutique?.nom} sur Binq`);
    const url = encodeURIComponent(boutiqueUrl);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    };
    window.open(urls[platform], "_blank");
  };

  const scrollToProduits = () => {
    produitsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const addToCart = (produit: Produit) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === produit.id);
      if (existing) {
        const max = produit.stock ?? 99;
        return prev.map((item) => item.id === produit.id ? { ...item, quantite: Math.min(max, item.quantite + 1) } : item);
      }
      return [...prev, { ...produit, quantite: 1 }];
    });
    setShowCart(true);
  };

  useEffect(() => {
    if (typeof window === "undefined" || produits.length === 0) return;
    const productId = new URLSearchParams(window.location.search).get("add");
    if (!productId || autoAddedProductIdRef.current === productId) return;

    const produit = produits.find((item) => item.id === productId);
    if (!produit) return;

    autoAddedProductIdRef.current = productId;
    addToCart(produit);
  }, [produits]);

  const updateCartQuantity = (produitId: string, nextQuantity: number) => {
    setCart((prev) => prev
      .map((item) => {
        if (item.id !== produitId) return item;
        const max = item.stock ?? 99;
        return { ...item, quantite: Math.max(1, Math.min(max, nextQuantity)) };
      })
      .filter((item) => item.quantite > 0)
    );
  };

  const removeFromCart = (produitId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== produitId));
  };

  const resetCheckout = () => {
    setCart([]);
    setShowCart(false);
    setOrderSuccess(null);
    setCheckoutError("");
    setClientNom("");
    setClientTelephone("");
    setAdresseLivraison("");
    setLieuLivraison(null);
    setNoteLivraison("");
  };

  const handleCheckout = async () => {
    if (!boutique || cart.length === 0) return;
    setCheckoutError("");

    if (!clientNom.trim() || !clientTelephone.trim() || !adresseLivraison.trim()) {
      setCheckoutError("Nom, téléphone et adresse sont requis.");
      return;
    }

    if (!lieuLivraison || !Number.isFinite(lieuLivraison.latitude) || !Number.isFinite(lieuLivraison.longitude)) {
      setCheckoutError("Confirmez la position GPS de livraison avec « Utiliser ma position actuelle » ou choisissez une adresse proposée.");
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch("/api/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ produit_id: item.id, quantite: item.quantite })),
          client_nom: clientNom,
          client_telephone: clientTelephone,
          adresse_livraison: adresseLivraison,
          delivery_latitude: lieuLivraison?.latitude ?? null,
          delivery_longitude: lieuLivraison?.longitude ?? null,
          delivery_place_id: lieuLivraison?.id ?? null,
          delivery_geocoded_address: lieuLivraison?.address ?? null,
          note_livraison: noteLivraison,
          frais_livraison: deliveryFee,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || "Impossible de créer la commande.");
        return;
      }
      if (data.payment_url) {
        window.location.href = data.payment_url;
        return;
      }
      setOrderSuccess({ reference: data.commande?.reference || "CMD", total: totalCart });
      setCart([]);
    } catch {
      setCheckoutError("Erreur réseau. Réessayez.");
    } finally {
      setCheckingOut(false);
    }
  };

  // Filter products
  const categories = Array.from(new Set(produits.map(p => p.categorie).filter(Boolean))) as string[];
  const filtered = produits.filter(p => {
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCat && p.categorie !== selectedCat) return false;
    return true;
  });
  const cartCount = cart.reduce((sum, item) => sum + item.quantite, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + Number(item.prix) * item.quantite, 0);
  const deliveryFee = cartSubtotal > 0 && cartSubtotal < 10000 ? 1000 : 0;
  const serviceFee = cartSubtotal > 0 ? Math.ceil(cartSubtotal * 0.1) : 0;
  const totalCart = cartSubtotal + deliveryFee + serviceFee;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-black animate-spin mx-auto" />
          <p className="text-gray-400 text-sm mt-3">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !boutique) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Store className="w-9 h-9 text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Boutique introuvable</h2>
          <p className="text-gray-500 text-sm mb-6">{error || "Cette boutique n'existe pas ou a ete desactivee."}</p>
          <button
            onClick={() => window.history.length > 1 ? router.back() : router.push("/")}
            className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />Retour
          </button>
        </div>
      </div>
    );
  }

  const devise = (boutique.devise as DeviseCode) || "XOF";
  const ownerName = boutique.owner ? `${boutique.owner.prenom} ${boutique.owner.nom}` : null;
  const ownerInitials = boutique.owner
    ? `${boutique.owner.prenom?.[0] || ""}${boutique.owner.nom?.[0] || ""}`.toUpperCase()
    : "?";
  const memberSince = boutique.created_at
    ? new Date(boutique.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null;


  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header sticky ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-2.5">
          <button
            onClick={() => window.history.length > 1 ? router.back() : router.push("/")}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 text-sm truncate">{boutique.nom}</h1>
            <p className="text-[11px] text-gray-400 truncate">
              {boutique.categorie ? `${boutique.categorie.nom}` : "Boutique"}
              {boutique.ville ? ` • ${boutique.ville}` : ""}
            </p>
          </div>
          <button onClick={() => setShowQRModal(true)} className="p-2 rounded-xl hover:bg-gray-100 transition active:scale-95">
            <QrCode className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={handleShare} className="p-2 rounded-xl hover:bg-gray-100 transition active:scale-95 relative">
            <Share2 className="w-5 h-5 text-gray-600" />
            {shared && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                OK
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto">

        {/* ═══ 1. HERO BOUTIQUE ═══ */}
        <div className="relative">
          {/* Cover */}
          <div className="h-48 overflow-hidden">
            {boutique.banner_url ? (
              <img src={boutique.banner_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
          </div>

          {/* Info overlaid on cover */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end gap-3">
              {/* Logo */}
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-lg flex-shrink-0 flex items-center justify-center border-2 border-white">
                {boutique.logo_url ? (
                  <img src={boutique.logo_url} alt={boutique.nom} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-7 h-7 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-0.5">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-black text-white truncate">{boutique.nom}</h2>
                  {boutique.is_verified && <BadgeCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {boutique.categorie && (
                    <span className="text-white/80 text-xs">{boutique.categorie.icone} {boutique.categorie.nom}</span>
                  )}
                  {boutique.ville && (
                    <span className="text-white/70 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{boutique.ville}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges sous le hero */}
        <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="flex-shrink-0 flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-semibold px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />Paiement securise
          </span>
          {boutique.is_verified && (
            <span className="flex-shrink-0 flex items-center gap-1.5 bg-blue-50 text-blue-600 text-[11px] font-semibold px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />Vendeur verifie
            </span>
          )}
          {produits.length > 0 && (
            <span className="flex-shrink-0 flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[11px] font-semibold px-3 py-1.5 rounded-full">
              <Package className="w-3 h-3" />{produits.length} produit{produits.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ═══ 2. RECHERCHE ═══ */}
        {produits.length > 0 && (
          <div className="px-4 pb-3" ref={produitsRef}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition placeholder:text-gray-400"
              />
            </div>

            {/* Category pills */}
            {categories.length > 0 && (
              <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setSelectedCat(null)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    !selectedCat ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Tout
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                      selectedCat === cat ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ 4. PRODUITS — Centre de la page ═══ */}
        <div className="px-4 pt-2 pb-4">
          <h3 className="font-bold text-gray-900 mb-3">
            {search || selectedCat
              ? `${filtered.length} resultat${filtered.length > 1 ? "s" : ""}`
              : "Nos produits"
            }
          </h3>

          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">
                {search || selectedCat ? "Aucun produit trouve" : "Aucun produit pour le moment"}
              </p>
              {(search || selectedCat) && (
                <button
                  onClick={() => { setSearch(""); setSelectedCat(null); }}
                  className="mt-2 text-xs text-black font-semibold underline"
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

                const cartItem = cart.find((item) => item.id === p.id);
                const outOfStock = p.stock !== null && p.stock !== undefined && p.stock <= 0;

                return (
                  <article
                    key={p.id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all group"
                  >
                    <Link href={`/produit/${p.id}`} className="aspect-square bg-gray-50 relative overflow-hidden block">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                          <ShoppingBag className="w-10 h-10 text-gray-200" />
                        </div>
                      )}
                      {hasPromo && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">-{discount}%</span>
                      )}
                      {p.ventes > 0 && (
                        <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          {p.ventes} vendu{p.ventes > 1 ? "s" : ""}
                        </span>
                      )}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                          <span className="bg-white text-gray-900 text-[11px] font-black px-2.5 py-1 rounded-full">Rupture</span>
                        </div>
                      )}
                    </Link>
                    <div className="p-3">
                      <Link href={`/produit/${p.id}`} className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug min-h-[2rem] hover:text-blue-600 transition">{p.nom}</Link>
                      <div className="flex items-baseline gap-1.5 mt-1.5">
                        <span className="text-sm font-black text-black">{formatMontant(p.prix, pDevise)}</span>
                        {hasPromo && (
                          <span className="text-[10px] text-gray-400 line-through">{formatMontant(p.prix_barre!, pDevise)}</span>
                        )}
                      </div>
                      {cartItem ? (
                        <div className="mt-2 flex items-center justify-between gap-2 bg-gray-50 rounded-xl p-1">
                          <button
                            onClick={() => cartItem.quantite <= 1 ? removeFromCart(p.id) : updateCartQuantity(p.id, cartItem.quantite - 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-700 active:scale-95 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-black text-gray-900">{cartItem.quantite}</span>
                          <button
                            onClick={() => updateCartQuantity(p.id, cartItem.quantite + 1)}
                            className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center active:scale-95 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(p)}
                          disabled={outOfStock}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 bg-black disabled:bg-gray-200 disabled:text-gray-500 text-white py-2 rounded-lg text-xs font-bold active:scale-[0.97] transition"
                        >
                          <Plus className="w-3 h-3" />Ajouter
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ 5. CONFIANCE VENDEUR ═══ */}
        <div className="px-4 pb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {boutique.owner?.avatar_url ? (
                  <img src={boutique.owner.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-gray-500">{ownerInitials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {ownerName && (
                  <p className="text-sm font-semibold text-gray-900">Vendu par {ownerName}</p>
                )}
                <div className="flex items-center gap-3 mt-0.5">
                  {memberSince && (
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />Membre depuis {memberSince}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Trust badges */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />Paiement securise avec Binq
              </span>
              {boutique.is_verified && (
                <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                  <BadgeCheck className="w-3.5 h-3.5" />Verifie
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ═══ STICKY BOTTOM BAR ═══ */}
      {produits.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-xl border-t border-gray-100 safe-area-bottom">
          <div className="max-w-lg mx-auto px-4 py-2.5 flex gap-2">
            <button
              onClick={() => cart.length > 0 ? setShowCart(true) : scrollToProduits()}
              className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-bold text-sm active:scale-[0.97] transition"
            >
              <ShoppingBag className="w-4 h-4" />
              {cart.length > 0 ? `${cartCount} article${cartCount > 1 ? "s" : ""} · ${formatMontant(totalCart, devise)}` : `Produits (${produits.length})`}
            </button>
            <button
              onClick={() => setShowQRModal(true)}
              className="px-4 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm transition active:scale-95"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              className="px-4 flex items-center justify-center bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══ CART + DELIVERY CHECKOUT ═══ */}
      {showCart && boutique && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={() => setShowCart(false)}>
          <div className="bg-white w-full max-w-lg sm:rounded-[2rem] rounded-t-[2rem] max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-4 flex items-center gap-3 z-10">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-gray-900">Votre panier</h3>
                <p className="text-xs text-gray-500 truncate">{boutique.nom} · Livraison locale</p>
              </div>
              <button onClick={() => setShowCart(false)} className="p-2 rounded-xl hover:bg-gray-100 transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {orderSuccess ? (
              <div className="p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-1">Commande envoyée</h3>
                <p className="text-sm text-gray-500 mb-5">Le commerce reçoit la commande et vous contacte pour confirmer la livraison.</p>
                <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Référence</span>
                    <span className="font-mono font-bold text-gray-900">{orderSuccess.reference}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total</span>
                    <span className="font-black text-blue-600">{formatMontant(orderSuccess.total, devise)}</span>
                  </div>
                </div>
                <button onClick={resetCheckout} className="w-full py-3.5 rounded-2xl bg-black text-white font-bold active:scale-[0.98] transition">
                  Continuer mes achats
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-5">
                {cart.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-900">Panier vide</p>
                    <button onClick={() => setShowCart(false)} className="mt-4 px-5 py-2.5 rounded-xl bg-black text-white text-sm font-bold">
                      Voir les produits
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                          <div className="w-14 h-14 rounded-xl bg-white overflow-hidden flex items-center justify-center shrink-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.nom} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{item.nom}</p>
                            <p className="text-xs font-semibold text-blue-600 mt-0.5">{formatMontant(item.prix, (item.devise as DeviseCode) || devise)}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <button onClick={() => item.quantite <= 1 ? removeFromCart(item.id) : updateCartQuantity(item.id, item.quantite - 1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-black">{item.quantite}</span>
                              <button onClick={() => updateCartQuantity(item.id, item.quantite + 1)} className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-black text-gray-900">Livraison</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Nom complet</label>
                          <input value={clientNom} onChange={e => setClientNom(e.target.value)} placeholder="Ex: Jérôme K." className="mt-1 w-full px-3 py-3 rounded-xl bg-white border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Téléphone</label>
                          <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input value={clientTelephone} onChange={e => setClientTelephone(e.target.value)} placeholder="+229 ..." className="w-full pl-9 pr-3 py-3 rounded-xl bg-white border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Adresse de livraison</label>
                          <MapboxAddressPicker
                            value={adresseLivraison}
                            onChange={setAdresseLivraison}
                            onPlaceSelect={setLieuLivraison}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Note optionnelle</label>
                          <input value={noteLivraison} onChange={e => setNoteLivraison(e.target.value)} placeholder="Ex: appelez à l'arrivée" className="mt-1 w-full px-3 py-3 rounded-xl bg-white border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Sous-total</span>
                        <span className="font-semibold text-gray-900">{formatMontant(cartSubtotal, devise)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Livraison</span>
                        <span className="font-semibold text-gray-900">{deliveryFee === 0 ? "Offerte" : formatMontant(deliveryFee, devise)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Frais de service Binq</span>
                        <span className="font-semibold text-gray-900">{formatMontant(serviceFee, devise)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200 flex justify-between">
                        <span className="font-black text-gray-900">Total</span>
                        <span className="font-black text-blue-600">{formatMontant(totalCart, devise)}</span>
                      </div>
                    </div>

                    {checkoutError && (
                      <p className="text-sm font-semibold text-red-600 bg-red-50 rounded-xl px-3 py-2">{checkoutError}</p>
                    )}

                    <button
                      onClick={handleCheckout}
                      disabled={checkingOut}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-black text-white font-black disabled:opacity-60 active:scale-[0.98] transition shadow-xl shadow-black/10"
                    >
                      {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                      {checkingOut ? "Envoi de la commande..." : "Commander maintenant"}
                    </button>
                    <p className="text-[11px] text-center text-gray-400 pb-2">Paiement sécurisé et confirmation avec le commerce.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ QR MODAL ═══ */}
      {showQRModal && boutique && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQRModal(false)}>
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 transition">
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-black flex items-center justify-center">
              <QrCode className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-lg font-black text-gray-900 mb-1">{boutique.nom}</h3>
            <p className="text-xs text-gray-500 mb-5">Scannez ou partagez ce QR pour acceder a cette boutique</p>

            <div className="bg-gray-50 rounded-2xl p-5 inline-block mb-5">
              <QRCodeSVG value={boutiqueUrl} size={180} level="H" includeMargin />
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-3 bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm active:scale-[0.97] transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Lien copie !" : "Copier le lien"}
              </button>

              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => shareToSocial("whatsapp")} className="py-2.5 bg-green-50 text-green-700 font-semibold rounded-xl text-[11px] hover:bg-green-100 transition">
                  WhatsApp
                </button>
                <button onClick={() => shareToSocial("facebook")} className="py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-xl text-[11px] hover:bg-blue-100 transition">
                  Facebook
                </button>
                <button onClick={() => shareToSocial("twitter")} className="py-2.5 bg-sky-50 text-sky-700 font-semibold rounded-xl text-[11px] hover:bg-sky-100 transition">
                  Twitter
                </button>
                <button onClick={() => shareToSocial("telegram")} className="py-2.5 bg-cyan-50 text-cyan-700 font-semibold rounded-xl text-[11px] hover:bg-cyan-100 transition">
                  Telegram
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Binq */}
      <div className="text-center pb-24 pt-2">
        <p className="text-[11px] text-gray-300">Propulse par <span className="font-semibold text-gray-400">Binq</span></p>
      </div>

      <div className="h-20" />
    </div>
  );
}
