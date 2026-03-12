"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess, hapticError, hapticMedium } from "@/lib/haptics";
import {
  Store,
  Plus,
  Edit3,
  Trash2,
  ShoppingBag,
  Eye,
  TrendingUp,
  Package,
  Loader2,
  Camera,
  ImagePlus,
  Save,
  X,
  AlertTriangle,
  ExternalLink,
  Share2,
  Copy,
  BarChart3,
  DollarSign,
  QrCode,
} from "lucide-react";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";

interface Boutique {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  categorie_id: string | null;
  logo_url: string | null;
  banner_url: string | null;
  telephone: string | null;
  whatsapp: string | null;
  adresse: string | null;
  ville: string | null;
  devise: string;
  is_verified: boolean;
  vues: number;
  categorie: { nom: string; slug: string; icone: string } | null;
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
  is_active: boolean;
  stock: number | null;
  ventes: number;
  qr_code: string | null;
}

interface Stats {
  totalProduits: number;
  totalCommandes: number;
  totalVentes: number;
  vues: number;
}

interface Categorie {
  id: string;
  nom: string;
  slug: string;
  icone: string;
}

export default function MaBoutiquePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProduits: 0, totalCommandes: 0, totalVentes: 0, vues: 0 });
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedQR, setExpandedQR] = useState<string | null>(null);

  // Formulaire création boutique
  const [showCreate, setShowCreate] = useState(false);
  const [formNom, setFormNom] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCat, setFormCat] = useState("");
  const [formVille, setFormVille] = useState("");
  const [formTel, setFormTel] = useState("");
  const [formLogo, setFormLogo] = useState<File | null>(null);
  const [formBanner, setFormBanner] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Formulaire ajout produit
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodNom, setProdNom] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrix, setProdPrix] = useState("");
  const [prodPrixBarre, setProdPrixBarre] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodCategorie, setProdCategorie] = useState("");
  const [prodStock, setProdStock] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, catRes] = await Promise.all([
          fetch("/api/boutiques/me"),
          fetch("/api/categories"),
        ]);
        const [meData, catData] = await Promise.all([meRes.json(), catRes.json()]);
        setCategories(catData.categories || []);

        if (meData.boutique) {
          setBoutique(meData.boutique);
          setProduits(meData.produits || []);
          setStats(meData.stats || { totalProduits: 0, totalCommandes: 0, totalVentes: 0, vues: 0 });
        } else {
          setShowCreate(true);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormBanner(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const uploadBoutiqueImage = async (file: File, type: "logo" | "banner", boutiqueId: string): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    fd.append("boutiqueId", boutiqueId);
    try {
      const res = await fetch("/api/boutiques/upload", { method: "POST", body: fd });
      const data = await res.json();
      return res.ok ? data.url : null;
    } catch { return null; }
  };

  // Créer boutique
  const handleCreateBoutique = async () => {
    if (!formNom.trim()) { showToast("error", "Erreur", "Nom requis"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/boutiques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formNom.trim(),
          description: formDesc.trim() || undefined,
          categorie_id: formCat || undefined,
          ville: formVille.trim() || undefined,
          telephone: formTel.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", "Erreur", data.error); return; }

      // Upload images if selected
      if (formLogo && data.boutique?.id) {
        await uploadBoutiqueImage(formLogo, "logo", data.boutique.id);
      }
      if (formBanner && data.boutique?.id) {
        await uploadBoutiqueImage(formBanner, "banner", data.boutique.id);
      }

      // Reload boutique data to get updated URLs
      const meRes = await fetch("/api/boutiques/me");
      const meData = await meRes.json();
      if (meData.boutique) {
        setBoutique(meData.boutique);
        setProduits(meData.produits || []);
        setStats(meData.stats || { totalProduits: 0, totalCommandes: 0, totalVentes: 0, vues: 0 });
      } else {
        setBoutique(data.boutique);
      }

      setShowCreate(false);
      hapticSuccess();
      showToast("success", "Boutique créée !", "Ajoutez maintenant vos produits");
    } catch { hapticError(); showToast("error", "Erreur", "Erreur de création"); }
    finally { setCreating(false); }
  };

  // Ajouter produit
  const handleAddProduct = async () => {
    if (!prodNom.trim() || !prodPrix) { showToast("error", "Erreur", "Nom et prix requis"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/produits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: prodNom.trim(),
          description: prodDesc.trim() || undefined,
          prix: parseFloat(prodPrix),
          prix_barre: prodPrixBarre ? parseFloat(prodPrixBarre) : undefined,
          image_url: prodImage.trim() || undefined,
          categorie: prodCategorie.trim() || undefined,
          stock: prodStock ? parseInt(prodStock) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", "Erreur", data.error); return; }
      setProduits((prev) => [{ ...data.produit, qr_code: data.qr_code || null }, ...prev]);
      setStats((s) => ({ ...s, totalProduits: s.totalProduits + 1 }));
      setShowAddProduct(false);
      setProdNom(""); setProdDesc(""); setProdPrix(""); setProdPrixBarre(""); setProdImage(""); setProdCategorie(""); setProdStock("");
      hapticSuccess();
      showToast("success", "Produit ajouté !", "Visible sur le marketplace");
    } catch { hapticError(); showToast("error", "Erreur", "Erreur"); }
    finally { setSaving(false); }
  };

  // Supprimer produit
  const handleDeleteProduct = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/produits/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProduits((prev) => prev.filter((p) => p.id !== id));
        setStats((s) => ({ ...s, totalProduits: s.totalProduits - 1 }));
        hapticSuccess();
        showToast("success", "Supprimé", "Produit supprimé");
      }
    } catch { hapticError(); }
    finally { setDeletingId(null); }
  };

  // Share boutique
  const handleShare = async () => {
    if (!boutique) return;
    const url = `${window.location.origin}/boutique/${boutique.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: boutique.nom, text: `Découvrez ${boutique.nom} sur Binq`, url }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); showToast("success", "Copié", "Lien copié"); } catch { /* ignore */ }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const devise = (boutique?.devise as DeviseCode) || "XOF";

  return (
    <div className="space-y-5 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Ma boutique</h1>
          <p className="text-xs text-gray-500 mt-0.5">Gérez vos produits et ventes</p>
        </div>
        {boutique && (
          <button onClick={handleShare} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition">
            <Share2 className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* ═══ CRÉATION BOUTIQUE ═══ */}
      {showCreate && !boutique && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="text-center mb-5">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Store className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-black text-gray-900">Créer votre boutique</h2>
            <p className="text-xs text-gray-500 mt-1">Gratuit — Vendez vos produits en 2 minutes</p>
          </div>

          <div className="space-y-3">
            {/* Banner upload */}
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Photo de couverture</label>
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-400 transition flex items-center justify-center overflow-hidden bg-gray-50 relative group"
              >
                {bannerPreview ? (
                  <>
                    <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <ImagePlus className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <p className="text-[11px] text-gray-400">Ajouter une couverture</p>
                  </div>
                )}
              </button>
              <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerSelect} className="hidden" />
            </div>

            {/* Logo upload */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-400 transition flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0 relative group"
              >
                {logoPreview ? (
                  <>
                    <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </>
                ) : (
                  <Camera className="w-5 h-5 text-gray-300" />
                )}
              </button>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-700">Logo de la boutique</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Format carré recommandé</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Nom de la boutique *</label>
              <input value={formNom} onChange={(e) => setFormNom(e.target.value)} placeholder="Ex: Café Binq" className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Description</label>
              <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Décrivez votre boutique..." rows={2} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Catégorie</label>
              <select value={formCat} onChange={(e) => setFormCat(e.target.value)} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition">
                <option value="">Choisir une catégorie</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Ville</label>
                <input value={formVille} onChange={(e) => setFormVille(e.target.value)} placeholder="Dakar" className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Téléphone</label>
                <input value={formTel} onChange={(e) => setFormTel(e.target.value)} placeholder="+221..." className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
              </div>
            </div>
            <button
              onClick={handleCreateBoutique}
              disabled={creating || !formNom.trim()}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-bold transition disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
              {creating ? "Création..." : "Créer ma boutique"}
            </button>
          </div>
        </div>
      )}

      {/* ═══ DASHBOARD BOUTIQUE ═══ */}
      {boutique && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Package, label: "Produits", value: stats.totalProduits.toString(), color: "text-violet-600 bg-violet-50" },
              { icon: ShoppingBag, label: "Ventes", value: stats.totalCommandes.toString(), color: "text-emerald-600 bg-emerald-50" },
              { icon: DollarSign, label: "Revenus", value: formatMontant(stats.totalVentes, devise), color: "text-cyan-600 bg-cyan-50" },
              { icon: Eye, label: "Vues", value: stats.vues.toString(), color: "text-orange-600 bg-orange-50" },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-3.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="text-lg font-black text-gray-900">{s.value}</p>
                <p className="text-[10px] text-gray-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Boutique info */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg truncate">{boutique.nom}</p>
                <p className="text-emerald-100 text-xs">binq.app/boutique/{boutique.slug}</p>
              </div>
            </div>
          </div>

          {/* Add product button */}
          <button
            onClick={() => { hapticMedium(); setShowAddProduct(true); }}
            className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-3 rounded-xl font-bold text-sm transition border border-emerald-200/50"
          >
            <Plus className="w-4 h-4" />Ajouter un produit
          </button>

          {/* Add product form */}
          {showAddProduct && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Nouveau produit</h3>
                <button onClick={() => setShowAddProduct(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Nom du produit *</label>
                  <input value={prodNom} onChange={(e) => setProdNom(e.target.value)} placeholder="Ex: Café latte" className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Description</label>
                  <textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={2} placeholder="Décrivez votre produit..." className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Prix *</label>
                    <input type="number" value={prodPrix} onChange={(e) => setProdPrix(e.target.value)} placeholder="1500" className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Prix barré</label>
                    <input type="number" value={prodPrixBarre} onChange={(e) => setProdPrixBarre(e.target.value)} placeholder="2000" className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Image URL</label>
                  <input value={prodImage} onChange={(e) => setProdImage(e.target.value)} placeholder="https://..." className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Catégorie</label>
                    <input value={prodCategorie} onChange={(e) => setProdCategorie(e.target.value)} placeholder="Boissons" className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Stock</label>
                    <input type="number" value={prodStock} onChange={(e) => setProdStock(e.target.value)} placeholder="Illimité" className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
                  </div>
                </div>
                <button
                  onClick={handleAddProduct}
                  disabled={saving || !prodNom.trim() || !prodPrix}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-bold transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Ajout..." : "Ajouter le produit"}
                </button>
              </div>
            </div>
          )}

          {/* Products list */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              Mes produits ({produits.length}/20)
            </h3>
            {produits.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-2xl">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun produit encore</p>
                <p className="text-xs text-gray-400 mt-0.5">Ajoutez votre premier produit</p>
              </div>
            ) : (
              <div className="space-y-2">
                {produits.map((p) => {
                  const qrLink = p.qr_code ? `${window.location.origin}/q/${p.qr_code}` : `${window.location.origin}/produit/${p.id}`;
                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div className="flex items-center gap-3 p-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.nom} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-gray-300" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{p.nom}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-emerald-600">{formatMontant(p.prix, devise)}</span>
                            {p.ventes > 0 && <span className="text-[10px] text-gray-400">{p.ventes} ventes</span>}
                            {!p.is_active && <span className="text-[10px] text-red-500 font-semibold">Desactive</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setExpandedQR(expandedQR === p.id ? null : p.id)}
                            className={`p-2 rounded-lg transition ${expandedQR === p.id ? "bg-emerald-50 text-emerald-600" : "text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"}`}
                            title="QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({ title: p.nom, text: `${p.nom} — ${formatMontant(p.prix, devise)} sur Binq`, url: qrLink }).catch(() => {});
                              } else {
                                navigator.clipboard.writeText(qrLink).then(() => showToast("success", "Copié", "Lien QR copié")).catch(() => {});
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition"
                            title="Partager"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            disabled={deletingId === p.id}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                          >
                            {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable QR section */}
                      {expandedQR === p.id && (
                        <div className="px-3 pb-3 animate-in slide-in-from-top-1 duration-200">
                          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                            <div className="inline-block bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrLink)}`}
                                alt="QR Code"
                                className="w-40 h-40"
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 font-medium">Scannez pour acheter ce produit</p>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(qrLink).then(() => showToast("success", "Copié", "Lien QR copié")).catch(() => {});
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-bold transition border border-gray-200"
                              >
                                <Copy className="w-3.5 h-3.5" />Copier le lien
                              </button>
                              <button
                                onClick={() => {
                                  if (navigator.share) {
                                    navigator.share({ title: p.nom, text: `${p.nom} — ${formatMontant(p.prix, devise)} sur Binq`, url: qrLink }).catch(() => {});
                                  }
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-lg text-xs font-bold transition"
                              >
                                <Share2 className="w-3.5 h-3.5" />Partager
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
