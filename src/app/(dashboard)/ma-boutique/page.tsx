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
  Trash2,
  ShoppingBag,
  Package,
  Loader2,
  Camera,
  ImagePlus,
  Save,
  X,
  ExternalLink,
  Share2,
  Copy,
  QrCode,
  Check,
  ArrowLeft,
  Zap,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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

  // Création boutique (ultra simple)
  const [formNom, setFormNom] = useState("");
  const [formCat, setFormCat] = useState("");

  // Formulaire ajout produit
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodNom, setProdNom] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrix, setProdPrix] = useState("");
  const [prodPrixBarre, setProdPrixBarre] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  const [prodImagePreview, setProdImagePreview] = useState<string | null>(null);
  const prodImageRef = useRef<HTMLInputElement>(null);
  const [prodCategorie, setProdCategorie] = useState("");
  const [prodStock, setProdStock] = useState("");

  // POS Terminal
  const [activeTab, setActiveTab] = useState<"terminal" | "produits" | "historique" | "reglages">("terminal");
  const [encaisserMode, setEncaisserMode] = useState(false);
  const [encaisserMontant, setEncaisserMontant] = useState("");
  const [encaisserQR, setEncaisserQR] = useState(false);
  const [modeCaisse, setModeCaisse] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loadingCommandes, setLoadingCommandes] = useState(false);

  // Réglages
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

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
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // ═══ HANDLERS ═══

  const handleCreateBoutique = async () => {
    if (!formNom.trim()) { showToast("error", "Erreur", "Nom requis"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/boutiques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: formNom.trim(), categorie_id: formCat || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", "Erreur", data.error); return; }
      const meRes = await fetch("/api/boutiques/me");
      const meData = await meRes.json();
      if (meData.boutique) {
        setBoutique(meData.boutique);
        setProduits(meData.produits || []);
        setStats(meData.stats || { totalProduits: 0, totalCommandes: 0, totalVentes: 0, vues: 0 });
      } else { setBoutique(data.boutique); }
      hapticSuccess();
      showToast("success", "Boutique créée !", "Vous pouvez encaisser maintenant");
    } catch { hapticError(); showToast("error", "Erreur", "Erreur de création"); }
    finally { setCreating(false); }
  };

  const handleAddProduct = async () => {
    if (!prodNom.trim() || !prodPrix) { showToast("error", "Erreur", "Nom et prix requis"); return; }
    setSaving(true);
    try {
      let imageUrl = prodImage.trim() || undefined;
      if (prodImageFile) {
        const fd = new FormData();
        fd.append("file", prodImageFile);
        const upRes = await fetch("/api/produits/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (upRes.ok && upData.url) imageUrl = upData.url;
      }
      const res = await fetch("/api/produits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: prodNom.trim(), description: prodDesc.trim() || undefined,
          prix: parseFloat(prodPrix), prix_barre: prodPrixBarre ? parseFloat(prodPrixBarre) : undefined,
          image_url: imageUrl, categorie: prodCategorie.trim() || undefined,
          stock: prodStock ? parseInt(prodStock) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", "Erreur", data.error); return; }
      setProduits((prev) => [{ ...data.produit, qr_code: data.qr_code || null }, ...prev]);
      setStats((s) => ({ ...s, totalProduits: s.totalProduits + 1 }));
      setShowAddProduct(false);
      setProdNom(""); setProdDesc(""); setProdPrix(""); setProdPrixBarre(""); setProdImage(""); setProdCategorie(""); setProdStock("");
      setProdImageFile(null); setProdImagePreview(null);
      hapticSuccess();
      showToast("success", "Produit ajouté !", "Les clients peuvent l'acheter");
    } catch { hapticError(); showToast("error", "Erreur", "Erreur"); }
    finally { setSaving(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/produits/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProduits((prev) => prev.filter((p) => p.id !== id));
        setStats((s) => ({ ...s, totalProduits: s.totalProduits - 1 }));
        hapticSuccess(); showToast("success", "Supprimé", "Produit retiré");
      }
    } catch { hapticError(); }
    finally { setDeletingId(null); }
  };

  const handleShare = async () => {
    if (!boutique) return;
    const url = `${window.location.origin}/boutique/${boutique.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: boutique.nom, text: `${boutique.nom} sur Binq`, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); showToast("success", "Copié", "Lien copié"); } catch {}
    }
  };

  const handleEncaisser = () => {
    if (!encaisserMontant || parseFloat(encaisserMontant) <= 0) {
      showToast("error", "Erreur", "Entrez un montant"); return;
    }
    hapticSuccess();
    setEncaisserQR(true);
  };

  const resetEncaisser = () => {
    setEncaisserMode(false); setEncaisserMontant(""); setEncaisserQR(false);
  };

  const loadCommandes = async () => {
    setLoadingCommandes(true);
    try {
      const res = await fetch("/api/commandes");
      const data = await res.json();
      setCommandes(data.commandes || []);
    } catch {}
    finally { setLoadingCommandes(false); }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !boutique) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("type", "logo"); fd.append("boutiqueId", boutique.id);
      if (boutique.logo_url) fd.append("oldUrl", boutique.logo_url);
      const res = await fetch("/api/boutiques/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) { setBoutique((b) => b ? { ...b, logo_url: data.url } : b); hapticSuccess(); showToast("success", "Logo mis à jour", ""); }
    } catch { hapticError(); }
    finally { setUploadingLogo(false); }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !boutique) return;
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("type", "banner"); fd.append("boutiqueId", boutique.id);
      if (boutique.banner_url) fd.append("oldUrl", boutique.banner_url);
      const res = await fetch("/api/boutiques/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) { setBoutique((b) => b ? { ...b, banner_url: data.url } : b); hapticSuccess(); showToast("success", "Couverture mise à jour", ""); }
    } catch { hapticError(); }
    finally { setUploadingBanner(false); }
  };

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const devise = (boutique?.devise as DeviseCode) || "XOF";
  const boutiqueUrl = boutique ? `${typeof window !== "undefined" ? window.location.origin : ""}/boutique/${boutique.slug}` : "";
  const payUrl = user ? `${typeof window !== "undefined" ? window.location.origin : ""}/pay/user/${user.id}` : "";

  // ═══ MODE CAISSE — QR plein écran permanent ═══
  if (boutique && modeCaisse) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-6">
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse mb-4" />
        <h1 className="text-xl font-black text-gray-900 mb-1">{boutique.nom}</h1>
        <p className="text-xs text-gray-400 mb-6">Mode caisse actif</p>
        <div className="bg-white p-4 rounded-3xl border-[3px] border-gray-900 shadow-xl mb-4">
          <QRCodeSVG value={boutiqueUrl} size={300} level="H" />
        </div>
        <p className="text-2xl font-black text-gray-900 mb-1">💳 Payez ici</p>
        <p className="text-sm text-gray-500 mb-3">Scannez et payez instantanément</p>
        <p className="text-xs text-gray-400 mb-6">Mobile Money · Carte · QR</p>
        <div className="flex items-center gap-2 mb-8 animate-pulse">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          <span className="text-sm font-semibold text-emerald-600">En attente de paiement...</span>
        </div>
        <button
          onClick={() => setModeCaisse(false)}
          className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
        >
          Quitter le mode caisse
        </button>
      </div>
    );
  }

  // ═══ PAS DE BOUTIQUE → CRÉATION EN 30 SECONDES ═══
  if (!boutique) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Ouvrez votre boutique</h1>
            <p className="text-sm text-gray-500 mt-2">Commencez à encaisser en 30 secondes</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1.5">Nom de votre boutique</label>
              <input
                value={formNom}
                onChange={(e) => setFormNom(e.target.value)}
                placeholder="Ex: Café Chez Mama"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base outline-none focus:border-emerald-500 transition"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1.5">Catégorie</label>
              <select
                value={formCat}
                onChange={(e) => setFormCat(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base outline-none focus:border-emerald-500 transition"
              >
                <option value="">Choisir</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreateBoutique}
              disabled={creating || !formNom.trim()}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-xl font-black text-base transition disabled:opacity-50 active:scale-[0.98]"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {creating ? "Création..." : "Créer ma boutique →"}
            </button>
          </div>
          <p className="text-center text-[11px] text-gray-400 mt-6">
            Gratuit · Sans engagement · Logo et détails modifiables après
          </p>
        </div>
      </div>
    );
  }

  // ═══ ENCAISSER — Saisie montant ═══
  if (encaisserMode && !encaisserQR) {
    return (
      <div className="min-h-screen bg-white flex flex-col px-6">
        <button onClick={resetEncaisser} className="flex items-center gap-1.5 text-gray-500 font-semibold text-sm pt-6 mb-4">
          <ArrowLeft className="w-4 h-4" />Retour
        </button>
        <div className="flex-1 flex flex-col items-center justify-center -mt-12">
          <h1 className="text-xl font-black text-gray-900 mb-1">Encaisser</h1>
          <p className="text-sm text-gray-500 mb-10">Entrez le montant</p>
          <div className="text-center mb-10 w-full max-w-xs">
            <input
              type="number"
              inputMode="numeric"
              value={encaisserMontant}
              onChange={(e) => setEncaisserMontant(e.target.value)}
              placeholder="0"
              className="w-full text-6xl font-black text-center text-gray-900 bg-transparent outline-none border-none placeholder:text-gray-200"
              autoFocus
            />
            <p className="text-sm text-gray-400 mt-3 font-semibold">{devise}</p>
          </div>
          <button
            onClick={handleEncaisser}
            disabled={!encaisserMontant || parseFloat(encaisserMontant) <= 0}
            className="w-full max-w-xs py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-lg transition disabled:opacity-30 active:scale-[0.98] shadow-lg shadow-emerald-500/20"
          >
            Générer le QR
          </button>
        </div>
      </div>
    );
  }

  // ═══ ENCAISSER — QR avec montant ═══
  if (encaisserMode && encaisserQR) {
    const amount = parseFloat(encaisserMontant) || 0;
    const qrValue = `${payUrl}?amount=${amount}`;
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="bg-white p-4 rounded-3xl border-[3px] border-gray-900 shadow-xl mb-4 animate-in zoom-in-95 duration-300">
          <QRCodeSVG value={qrValue} size={260} level="H" />
        </div>
        <p className="text-4xl font-black text-gray-900 mb-1">{formatMontant(amount, devise)}</p>
        <p className="text-lg font-black text-gray-800 mb-0.5">💳 Payez ici</p>
        <p className="text-sm text-gray-500 mb-3">Scannez et payez instantanément</p>
        <div className="flex items-center gap-2 mb-8 animate-pulse">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          <span className="text-sm font-semibold text-emerald-600">En attente de paiement...</span>
        </div>
        <button
          onClick={() => { hapticSuccess(); resetEncaisser(); }}
          className="w-full max-w-xs py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-base transition active:scale-[0.98] shadow-lg shadow-emerald-500/20"
        >
          ✓ Nouvelle vente
        </button>
        <button onClick={() => setEncaisserQR(false)} className="mt-4 text-sm text-gray-500 font-semibold hover:text-gray-700">
          ← Modifier le montant
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // DASHBOARD POS — Terminal de vente
  // ═══════════════════════════════════════════════
  return (
    <div className="pb-28">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-emerald-600">Ouvert · Prêt à encaisser</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900">{boutique.nom}</h1>
          </div>
          {boutique.logo_url && (
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100">
              <img src={boutique.logo_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Tab pills */}
      <div className="flex gap-1.5 px-4 mb-5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {([
          { id: "terminal" as const, label: "Encaisser" },
          { id: "produits" as const, label: "Produits" },
          { id: "historique" as const, label: "Commandes" },
          { id: "reglages" as const, label: "Réglages" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === "historique" && commandes.length === 0) loadCommandes();
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
              activeTab === tab.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: ENCAISSER (Terminal) ═══ */}
      {activeTab === "terminal" && (
        <div className="flex flex-col items-center px-4">
          {/* QR DOMINANT — impossible à ignorer */}
          <div className="bg-white p-3 rounded-3xl border-[3px] border-gray-900 shadow-xl mb-3">
            <QRCodeSVG value={boutiqueUrl} size={280} level="H" />
          </div>
          <p className="text-xl font-black text-gray-900 mb-0.5">💳 Payez ici</p>
          <p className="text-sm text-gray-500 mb-2">Scannez et payez instantanément</p>
          <p className="text-[11px] text-gray-400 mb-3">Mobile Money · Carte · QR</p>

          {/* État dynamique — toujours visible */}
          <div className="flex items-center gap-2 mb-5 animate-pulse">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            <span className="text-sm font-semibold text-emerald-600">En attente de paiement...</span>
          </div>

          {/* ENCAISSER — seul bouton principal, right under QR */}
          <button
            onClick={() => { setEncaisserMode(true); hapticMedium(); }}
            className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-lg transition active:scale-[0.98] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2.5 mb-4"
          >
            <Zap className="w-5 h-5" />Encaisser un montant
          </button>

          {/* Partager + Mode caisse */}
          <div className="flex items-center gap-4 mt-2">
            <button onClick={handleShare} className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold hover:text-emerald-600 transition">
              <Share2 className="w-3.5 h-3.5" />Partager mon QR
            </button>
            <span className="text-gray-200">|</span>
            <button onClick={() => { setModeCaisse(true); hapticMedium(); }} className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold hover:text-emerald-600 transition">
              <QrCode className="w-3.5 h-3.5" />Mode caisse
            </button>
          </div>

          {/* Mini stats — discret */}
          <div className="w-full grid grid-cols-3 gap-2 mt-6">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-gray-900">{stats.totalCommandes}</p>
              <p className="text-[10px] text-gray-500 font-medium">Ventes</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-sm font-black text-gray-900">{formatMontant(stats.totalVentes, devise)}</p>
              <p className="text-[10px] text-gray-500 font-medium">Revenus</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-gray-900">{stats.totalProduits}</p>
              <p className="text-[10px] text-gray-500 font-medium">Produits</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: PRODUITS ═══ */}
      {activeTab === "produits" && (
        <div className="px-4">
          <button
            onClick={() => { hapticMedium(); setShowAddProduct(true); }}
            className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-3.5 rounded-xl font-bold text-sm transition border border-emerald-200/50 mb-4"
          >
            <Plus className="w-4 h-4" />Ajouter un produit
          </button>

          {/* Formulaire ajout produit */}
          {showAddProduct && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Nouveau produit</h3>
                <button onClick={() => setShowAddProduct(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                {/* Photo */}
                <div>
                  <label className="text-xs font-semibold text-gray-700">Photo du produit</label>
                  <input ref={prodImageRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) { showToast("error", "Erreur", "Image trop lourde (max 5 Mo)"); return; }
                        setProdImageFile(file); setProdImagePreview(URL.createObjectURL(file)); setProdImage("");
                      }
                    }}
                  />
                  {prodImagePreview ? (
                    <div className="mt-1.5 relative">
                      <img src={prodImagePreview} alt="Preview" className="w-full h-36 object-cover rounded-xl border border-gray-200" />
                      <button type="button"
                        onClick={() => { setProdImageFile(null); setProdImagePreview(null); if (prodImageRef.current) prodImageRef.current.value = ""; }}
                        className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
                      ><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => prodImageRef.current?.click()}
                      className="w-full mt-1.5 flex items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-8 text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition"
                    >
                      <Camera className="w-5 h-5" />Prendre ou choisir une photo
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Nom du produit *</label>
                  <input value={prodNom} onChange={(e) => setProdNom(e.target.value)} placeholder="Ex: Burger Classic"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Prix *</label>
                    <input type="number" inputMode="numeric" value={prodPrix} onChange={(e) => setProdPrix(e.target.value)} placeholder="2 500"
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Ancien prix</label>
                    <input type="number" value={prodPrixBarre} onChange={(e) => setProdPrixBarre(e.target.value)} placeholder="3 000"
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Description <span className="text-gray-400">(optionnel)</span></label>
                  <textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={2} placeholder="Décrivez votre produit..."
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Catégorie</label>
                    <input value={prodCategorie} onChange={(e) => setProdCategorie(e.target.value)} placeholder="Boissons"
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Stock</label>
                    <input type="number" value={prodStock} onChange={(e) => setProdStock(e.target.value)} placeholder="Illimité"
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition" />
                  </div>
                </div>

                <button onClick={handleAddProduct} disabled={saving || !prodNom.trim() || !prodPrix}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50 active:scale-[0.98]"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Ajout..." : "Ajouter le produit"}
                </button>
              </div>
            </div>
          )}

          {/* Liste produits */}
          {produits.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">Aucun produit</p>
              <p className="text-xs text-gray-400 mt-1">Ajoutez vos produits pour que les clients puissent les acheter</p>
            </div>
          ) : (
            <div className="space-y-2">
              {produits.map((p) => {
                const qrLink = p.qr_code ? `${window.location.origin}/q/${p.qr_code}` : `${window.location.origin}/produit/${p.id}`;
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.nom} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-gray-300" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{p.nom}</p>
                      <p className="text-xs font-bold text-emerald-600">{formatMontant(p.prix, devise)}</p>
                      {p.ventes > 0 && <p className="text-[10px] text-gray-400">{p.ventes} vendu{p.ventes > 1 ? "s" : ""}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: p.nom, text: `${p.nom} — ${formatMontant(p.prix, devise)} sur Binq`, url: qrLink }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(qrLink).then(() => showToast("success", "Copié", "Lien copié")).catch(() => {});
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition" title="Partager"
                      ><Share2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteProduct(p.id)} disabled={deletingId === p.id}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                      >{deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-center text-[10px] text-gray-400 mt-4">{produits.length}/20 produits</p>
        </div>
      )}

      {/* ═══ TAB: COMMANDES ═══ */}
      {activeTab === "historique" && (
        <div className="px-4">
          <h2 className="text-lg font-black text-gray-900 mb-1">Commandes</h2>
          <p className="text-xs text-gray-400 mb-4">Vos paiements reçus</p>
          {loadingCommandes ? (
            <div className="text-center py-12"><Loader2 className="w-6 h-6 text-gray-300 animate-spin mx-auto" /></div>
          ) : commandes.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">Aucune vente encore</p>
              <p className="text-xs text-gray-400 mt-1">Les paiements apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-2">
              {commandes.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3.5">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{formatMontant(c.montant || c.prix || 0, devise)}</p>
                    <p className="text-[11px] text-gray-400">{new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    c.statut === "paye" || c.statut === "payé" ? "bg-emerald-50 text-emerald-600" : "bg-yellow-50 text-yellow-600"
                  }`}>
                    {c.statut === "paye" || c.statut === "payé" ? "✓ Payé" : c.statut}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: RÉGLAGES ═══ */}
      {activeTab === "reglages" && (
        <div className="px-4">
          <h2 className="text-lg font-black text-gray-900 mb-4">Réglages</h2>

          {/* Infos boutique */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                {boutique.logo_url ? (
                  <img src={boutique.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{boutique.nom}</p>
                <p className="text-xs text-gray-400 truncate">binq.app/boutique/{boutique.slug}</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Logo */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">Logo</label>
                <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUploadLogo} className="hidden" />
                <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-xl py-3 text-sm text-gray-600 font-semibold hover:border-emerald-400 hover:text-emerald-600 transition disabled:opacity-50"
                >
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {boutique.logo_url ? "Changer le logo" : "Ajouter un logo"}
                </button>
              </div>

              {/* Banner */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">Photo de couverture</label>
                <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUploadBanner} className="hidden" />
                {boutique.banner_url && (
                  <img src={boutique.banner_url} alt="" className="w-full h-20 object-cover rounded-lg mb-2 border border-gray-100" />
                )}
                <button onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-xl py-3 text-sm text-gray-600 font-semibold hover:border-emerald-400 hover:text-emerald-600 transition disabled:opacity-50"
                >
                  {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  {boutique.banner_url ? "Changer la couverture" : "Ajouter une couverture"}
                </button>
              </div>
            </div>
          </div>

          {/* QR de la boutique */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 text-center">
            <p className="text-xs font-bold text-gray-700 mb-3">QR de votre boutique</p>
            <div className="inline-block bg-white p-3 rounded-xl border border-gray-100">
              <QRCodeSVG value={boutiqueUrl} size={140} level="H" />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={async () => {
                await navigator.clipboard.writeText(boutiqueUrl);
                setCopied(true); setTimeout(() => setCopied(false), 2000);
                showToast("success", "Copié", "Lien copié");
              }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copié !" : "Copier le lien"}
              </button>
              <button onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2.5 rounded-xl text-xs font-bold transition"
              ><Share2 className="w-3.5 h-3.5" />Partager</button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[
                { name: "WhatsApp", color: "bg-green-50 text-green-700 hover:bg-green-100", platform: "whatsapp" },
                { name: "Facebook", color: "bg-blue-50 text-blue-700 hover:bg-blue-100", platform: "facebook" },
                { name: "X", color: "bg-sky-50 text-sky-700 hover:bg-sky-100", platform: "twitter" },
                { name: "Telegram", color: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100", platform: "telegram" },
              ].map((s) => (
                <button key={s.platform} onClick={() => {
                  const text = encodeURIComponent(`${boutique.nom} sur Binq`);
                  const url = encodeURIComponent(boutiqueUrl);
                  const urls: Record<string, string> = {
                    whatsapp: `https://wa.me/?text=${text}%20${url}`,
                    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
                    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
                  };
                  window.open(urls[s.platform], "_blank");
                }} className={`py-2 rounded-lg text-[11px] font-semibold transition ${s.color}`}>{s.name}</button>
              ))}
            </div>
          </div>

          {/* Voir ma boutique */}
          <Link href={`/boutique/${boutique.slug}`} target="_blank"
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition"
          ><ExternalLink className="w-4 h-4" />Voir ma boutique</Link>
        </div>
      )}
    </div>
  );
}
