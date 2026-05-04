"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess, hapticError } from "@/lib/haptics";
import dynamic from "next/dynamic";
const SuccessConfetti = dynamic(() => import("@/components/SuccessConfetti"), { ssr: false });
import {
  ShoppingBag,
  Store,
  MapPin,
  BadgeCheck,
  Loader2,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Zap,
  Shield,
  Eye,
  Tag,
  LogIn,
  CreditCard,
  QrCode,
  Copy,
  ExternalLink,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";

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
  vues: number;
  stock: number | null;
  boutique: {
    id: string;
    nom: string;
    slug: string;
    logo_url: string | null;
    is_verified: boolean;
    ville: string | null;
    user_id: string;
  };
}

export default function ProduitPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const produitId = params.id as string;

  const [produit, setProduit] = useState<Produit | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);
  const [boughtRef, setBoughtRef] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!produitId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/produits/${produitId}`);
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Produit introuvable"); return; }
        setProduit(data.produit);
        setQrCode(data.qr_code || null);
      } catch { setError("Erreur de chargement"); }
      finally { setLoading(false); }
    };
    load();
  }, [produitId]);

  const productUrl = typeof window !== "undefined" ? `${window.location.origin}/produit/${produitId}` : "";
  const qrUrl = qrCode && typeof window !== "undefined" ? `${window.location.origin}/q/${qrCode}` : productUrl;

  const handleBuy = async () => {
    if (!produit || !user) return;
    setBuying(true);
    try {
      const res = await fetch("/api/marketplace/acheter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produit_id: produit.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Erreur");
        return;
      }
      if (data.payment_url) {
        window.location.href = data.payment_url;
        return;
      }
      if (data.code) {
        router.push(`/pay/${data.code}`);
        return;
      }
      setBought(true);
      setBoughtRef(data.reference);
      hapticSuccess();
      showToast("success", "Achat effectue !", `${produit.nom} achete avec succes`);
    } catch { hapticError(); showToast("error", "Erreur", "Erreur lors de l'achat"); }
    finally { setBuying(false); }
  };

  const handleShare = async () => {
    if (!produit) return;
    const url = qrUrl || productUrl;
    if (navigator.share) {
      try { await navigator.share({ title: produit.nom, text: `${produit.nom} — ${formatMontant(produit.prix, (produit.devise as DeviseCode) || "XOF")} sur Binq`, url }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); showToast("success", "Copie", "Lien copie"); } catch { /* ignore */ }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl || productUrl);
      setCopied(true);
      showToast("success", "Copie", "Lien produit copie");
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const shareToSocial = (platform: string) => {
    const url = qrUrl || productUrl;
    const text = produit ? `${produit.nom} — ${formatMontant(produit.prix, (produit.devise as DeviseCode) || "XOF")} sur Binq` : "Decouvrez ce produit sur Binq";
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    };
    if (urls[platform]) window.open(urls[platform], "_blank");
  };

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

  if (error || !produit) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{error || "Produit introuvable"}</p>
          <button
            onClick={() => window.history.length > 1 ? router.back() : router.push("/")}
            className="mt-4 inline-flex items-center gap-2 text-black font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />Retour
          </button>
        </div>
      </div>
    );
  }

  const devise = (produit.devise as DeviseCode) || "XOF";
  const hasPromo = produit.prix_barre && produit.prix_barre > produit.prix;
  const discount = hasPromo ? Math.round(((produit.prix_barre! - produit.prix) / produit.prix_barre!) * 100) : 0;
  const isOwnProduct = user && produit.boutique.user_id === user.id;
  const outOfStock = produit.stock !== null && produit.stock <= 0;

  // ═══ SUCCESS ═══
  if (bought) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <SuccessConfetti />
        <div className="bg-gray-50/80 rounded-3xl p-8 max-w-md w-full text-center border border-gray-200/50 backdrop-blur-xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Achat effectue !</h1>
          <p className="text-lg font-bold text-blue-600 mb-1">{produit.nom}</p>
          <p className="text-2xl font-black text-gray-900 mb-4">{formatMontant(produit.prix, devise)}</p>

          <div className="bg-gray-50/50 rounded-xl p-3 mb-5 border border-gray-200/50 text-left space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-gray-500">Boutique</span><span className="text-gray-700 font-semibold">{produit.boutique.nom}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Reference</span><span className="text-gray-700 font-mono">{boughtRef}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Paiement</span><span className="text-blue-600 font-semibold">Carte / Mobile Money</span></div>
          </div>

          <div className="flex gap-2">
            <Link href={`/boutique/${produit.boutique.slug}`} className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-600 transition text-sm">
              <Store className="w-4 h-4" />Retour a la boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`/boutique/${produit.boutique.slug}`)} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 truncate flex-1">{produit.nom}</h1>
        <button onClick={handleShare} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
          <Share2 className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Image */}
      <div className="aspect-square bg-gray-100 relative">
        {produit.image_url ? (
          <img src={produit.image_url} alt={produit.nom} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-gray-300" />
          </div>
        )}
        {hasPromo && (
          <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-2.5 py-1 rounded-lg">
            -{discount}%
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-900 font-bold px-4 py-2 rounded-xl">Rupture de stock</span>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="px-4 pt-4">
        <h2 className="text-xl font-black text-gray-900">{produit.nom}</h2>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-black text-blue-600">{formatMontant(produit.prix, devise)}</span>
          {hasPromo && (
            <span className="text-sm text-gray-400 line-through">{formatMontant(produit.prix_barre!, devise)}</span>
          )}
        </div>

        {produit.description && (
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{produit.description}</p>
        )}

        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{produit.vues} vues</span>
          {produit.ventes > 0 && <span className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" />{produit.ventes} vendus</span>}
          {produit.stock !== null && produit.stock > 0 && <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{produit.stock} en stock</span>}
        </div>

        {/* Vendeur info */}
        <Link
          href={`/boutique/${produit.boutique.slug}`}
          className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mt-5 border border-gray-100 hover:border-gray-200 transition"
        >
          <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
            {produit.boutique.logo_url ? (
              <img src={produit.boutique.logo_url} alt={produit.boutique.nom} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-900 text-sm truncate">{produit.boutique.nom}</span>
              {produit.boutique.is_verified && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
            </div>
            {produit.boutique.ville && (
              <span className="text-[11px] text-gray-500 flex items-center gap-0.5 mt-0.5"><MapPin className="w-3 h-3" />{produit.boutique.ville}</span>
            )}
          </div>
          <ExternalLink className="w-4 h-4 text-gray-300" />
        </Link>

        {/* ═══ QR CODE PRODUIT ═══ */}
        <div className="mt-5 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100/50 transition"
          >
            <div className="flex items-center gap-2.5">
              <QrCode className="w-4 h-4 text-black" />
              <span className="text-sm font-bold text-gray-900">QR Code produit</span>
            </div>
            <span className="text-xs text-black font-semibold">{showQR ? "Masquer" : "Afficher"}</span>
          </button>
          {showQR && (
            <div className="px-4 pb-4 text-center">
              <div className="bg-white p-4 rounded-xl border border-gray-100 inline-block">
                <QRCodeSVG
                  value={qrUrl || productUrl}
                  size={160}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Scannez pour acheter ce produit</p>
              {/* Copy link */}
              <button
                onClick={handleCopyLink}
                className="mt-3 w-full flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold transition"
              >
                <Copy className="w-3.5 h-3.5" />{copied ? "Copie !" : "Copier le lien"}
              </button>
              {/* Social share buttons */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                <button onClick={() => shareToSocial("whatsapp")} className="py-2.5 bg-green-50 text-green-700 font-semibold rounded-xl text-[11px] hover:bg-green-100 transition">
                  WhatsApp
                </button>
                <button onClick={() => shareToSocial("facebook")} className="py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-xl text-[11px] hover:bg-blue-100 transition">
                  Facebook
                </button>
                <button onClick={() => shareToSocial("twitter")} className="py-2.5 bg-sky-50 text-sky-700 font-semibold rounded-xl text-[11px] hover:bg-sky-100 transition">
                  X / Twitter
                </button>
                <button onClick={() => shareToSocial("telegram")} className="py-2.5 bg-cyan-50 text-cyan-700 font-semibold rounded-xl text-[11px] hover:bg-cyan-100 transition">
                  Telegram
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Buy section */}
        <div className="mt-6">
          {!user ? (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Connectez-vous pour acheter</p>
              <Link href={`/connexion?redirect=/produit/${produit.id}`} className="w-full inline-flex items-center justify-center gap-2 bg-blue-500 text-white py-3.5 rounded-xl font-bold hover:bg-blue-600 transition">
                <LogIn className="w-5 h-5" />Se connecter
              </Link>
            </div>
          ) : isOwnProduct ? (
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
              <p className="text-sm text-gray-500">C&apos;est votre produit</p>
            </div>
          ) : outOfStock ? (
            <button disabled className="w-full bg-gray-200 text-gray-500 py-3.5 rounded-xl font-bold cursor-not-allowed">
              Rupture de stock
            </button>
          ) : (
            <button
              onClick={handleBuy}
              disabled={buying}
              className="w-full flex items-center justify-center gap-2.5 bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-blue-500/20"
            >
              {buying ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Paiement en cours...</>
              ) : (
                <><Zap className="w-5 h-5" />Acheter — {formatMontant(produit.prix, devise)}</>
              )}
            </button>
          )}

          {user && !isOwnProduct && !outOfStock && (
            <div className="flex items-center justify-center gap-4 mt-3">
              <span className="flex items-center gap-1 text-gray-400 text-[10px]"><Zap className="w-3 h-3" />Instantane</span>
              <span className="flex items-center gap-1 text-gray-400 text-[10px]"><Shield className="w-3 h-3" />Securise</span>
              <span className="flex items-center gap-1 text-gray-400 text-[10px]"><CreditCard className="w-3 h-3" />Carte / Mobile Money</span>
            </div>
          )}
        </div>

        {/* Footer Binq */}
        <div className="text-center pt-6 pb-4">
          <p className="text-[11px] text-gray-300">Propulse par <span className="font-semibold text-gray-400">Binq</span></p>
        </div>
      </div>
    </div>
  );
}
