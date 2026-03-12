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
  ExternalLink,
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
}

export default function BoutiquePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      try { await navigator.share({ title: boutique.nom, text: `Découvrez ${boutique.nom} sur Binq`, url }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error || !boutique) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{error || "Boutique introuvable"}</p>
          <Link href="/explorer" className="mt-4 inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm">
            <ArrowLeft className="w-4 h-4" />Retour au marketplace
          </Link>
        </div>
      </div>
    );
  }

  const devise = (boutique.devise as DeviseCode) || "XOF";

  return (
    <div className="min-h-screen bg-white">
      {/* Header bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/explorer" className="p-1.5 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <h1 className="font-bold text-gray-900 truncate flex-1">{boutique.nom}</h1>
        <button onClick={handleShare} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
          <Share2 className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Banner + Info */}
      <div className="bg-gradient-to-b from-emerald-500 to-emerald-600 px-5 pt-6 pb-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center ring-2 ring-white/30 overflow-hidden">
            {boutique.logo_url ? (
              <img src={boutique.logo_url} alt={boutique.nom} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">{boutique.nom}</h2>
              {boutique.is_verified && <BadgeCheck className="w-5 h-5 text-white" />}
            </div>
            {boutique.categorie && (
              <p className="text-emerald-100 text-sm">{boutique.categorie.icone} {boutique.categorie.nom}</p>
            )}
          </div>
        </div>

        {boutique.description && (
          <p className="text-emerald-100 text-sm mb-4">{boutique.description}</p>
        )}

        <div className="flex items-center gap-4 text-emerald-100 text-xs">
          {boutique.ville && (
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{boutique.ville}</span>
          )}
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{boutique.vues} vues</span>
          <span className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" />{produits.length} produits</span>
        </div>

        {/* Contact buttons */}
        {(boutique.whatsapp || boutique.telephone) && (
          <div className="flex gap-2 mt-4">
            {boutique.whatsapp && (
              <a href={`https://wa.me/${boutique.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-xs font-semibold transition">
                <MessageCircle className="w-3.5 h-3.5" />WhatsApp
              </a>
            )}
            {boutique.telephone && (
              <a href={`tel:${boutique.telephone}`} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-xs font-semibold transition">
                <Phone className="w-3.5 h-3.5" />Appeler
              </a>
            )}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="px-4 py-5">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-gray-400" />
          Produits ({produits.length})
        </h3>

        {produits.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aucun produit pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {produits.map((p) => {
              const pDevise = (p.devise as DeviseCode) || devise;
              const hasPromo = p.prix_barre && p.prix_barre > p.prix;
              const discount = hasPromo ? Math.round(((p.prix_barre! - p.prix) / p.prix_barre!) * 100) : 0;

              return (
                <Link
                  key={p.id}
                  href={`/produit/${p.id}`}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    {hasPromo && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">{p.nom}</p>
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      <span className="text-sm font-black text-emerald-600">{formatMontant(p.prix, pDevise)}</span>
                      {hasPromo && (
                        <span className="text-[10px] text-gray-400 line-through">{formatMontant(p.prix_barre!, pDevise)}</span>
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
  );
}
