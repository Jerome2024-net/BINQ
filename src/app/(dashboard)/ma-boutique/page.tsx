"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/contexts/ToastContext";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";
import { ArrowRight, Camera, Copy, ExternalLink, ImagePlus, Loader2, Package, Plus, Save, Settings, Share2, ShoppingBag, Store, Trash2, Truck, X } from "lucide-react";

interface Boutique { id: string; nom: string; slug: string; description: string | null; categorie_id: string | null; logo_url: string | null; banner_url: string | null; telephone: string | null; whatsapp: string | null; adresse: string | null; ville: string | null; devise: string; is_verified: boolean; vues: number; }
interface Produit { id: string; nom: string; description: string | null; prix: number; prix_barre: number | null; devise: string; image_url: string | null; categorie: string | null; is_active: boolean; stock: number | null; ventes: number; }
interface Categorie { id: string; nom: string; icone: string; }
interface Commande { id: string; reference?: string | null; statut: string; montant?: number; montant_total?: number; devise?: string; client_nom?: string | null; adresse_livraison?: string | null; }
interface Stats { totalProduits: number; totalCommandes: number; totalVentes: number; vues: number; }
type Tab = "produits" | "commandes" | "reglages";

function statusLabel(status: string) {
  const labels: Record<string, string> = { nouvelle: "Nouvelle", payee: "Payée", acceptee: "Acceptée", preparation: "Préparation", en_livraison: "En livraison", livree: "Livrée", annulee: "Annulée" };
  return labels[status] || status;
}

export default function MaBoutiquePage() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProduits: 0, totalCommandes: 0, totalVentes: 0, vues: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("produits");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formNom, setFormNom] = useState("");
  const [formCat, setFormCat] = useState("");
  const [prodNom, setProdNom] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrix, setProdPrix] = useState("");
  const [prodPrixBarre, setProdPrixBarre] = useState("");
  const [prodCategorie, setProdCategorie] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  const [prodImagePreview, setProdImagePreview] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const prodImageRef = useRef<HTMLInputElement>(null);
  const devise = (boutique?.devise as DeviseCode) || "XOF";
  const boutiqueUrl = boutique ? `${typeof window !== "undefined" ? window.location.origin : ""}/boutique/${boutique.slug}` : "";

  const reloadBoutique = async () => {
    const meRes = await fetch("/api/boutiques/me");
    const meData = await meRes.json();
    setBoutique(meData.boutique || null);
    setProduits(Array.isArray(meData.produits) ? meData.produits : []);
    setStats(meData.stats || { totalProduits: 0, totalCommandes: 0, totalVentes: 0, vues: 0 });
    return meData.boutique as Boutique | null;
  };

  const loadCommandes = async () => {
    try {
      const res = await fetch("/api/commandes?role=vendeur&limit=20");
      const data = await res.json();
      setCommandes(Array.isArray(data.commandes) ? data.commandes : []);
    } catch { setCommandes([]); }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const catRes = await fetch("/api/categories");
        const catData = await catRes.json();
        setCategories(catData.categories || []);
        const currentBoutique = await reloadBoutique();
        if (currentBoutique) await loadCommandes();
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (searchParams.get("action") === "create" && boutique && !loading) {
      setShowAddProduct(true);
      setActiveTab("produits");
      window.history.replaceState({}, "", "/ma-boutique");
    }
  }, [searchParams, boutique, loading]);

  const handleCreateBoutique = async () => {
    if (!formNom.trim()) { showToast("error", "Nom requis", "Ajoutez le nom de votre commerce"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/boutiques", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: formNom.trim(), categorie_id: formCat || undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Création impossible");
      await reloadBoutique();
      hapticSuccess();
      showToast("success", "Commerce créé", "Ajoutez vos premiers produits");
    } catch (error: any) { hapticError(); showToast("error", "Erreur", error.message || "Erreur de création"); }
    finally { setCreating(false); }
  };

  const resetProductForm = () => {
    setProdNom(""); setProdDesc(""); setProdPrix(""); setProdPrixBarre(""); setProdCategorie(""); setProdStock(""); setProdImageFile(null); setProdImagePreview(null);
  };

  const handleAddProduct = async () => {
    if (!prodNom.trim() || !prodPrix) { showToast("error", "Champs requis", "Nom et prix sont obligatoires"); return; }
    setSaving(true);
    try {
      let imageUrl: string | undefined;
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
        body: JSON.stringify({ nom: prodNom.trim(), description: prodDesc.trim() || undefined, prix: parseFloat(prodPrix), prix_barre: prodPrixBarre ? parseFloat(prodPrixBarre) : undefined, image_url: imageUrl, categorie: prodCategorie.trim() || undefined, stock: prodStock ? parseInt(prodStock, 10) : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Produit impossible");
      setProduits((prev) => [data.produit, ...prev]);
      setStats((s) => ({ ...s, totalProduits: s.totalProduits + 1 }));
      resetProductForm();
      setShowAddProduct(false);
      hapticSuccess();
      showToast("success", "Produit ajouté", "Il est visible dans votre boutique");
    } catch (error: any) { hapticError(); showToast("error", "Erreur", error.message || "Impossible d'ajouter le produit"); }
    finally { setSaving(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/produits/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Suppression impossible");
      setProduits((prev) => prev.filter((p) => p.id !== id));
      setStats((s) => ({ ...s, totalProduits: Math.max(0, s.totalProduits - 1) }));
      hapticSuccess();
      showToast("success", "Produit retiré", "Votre catalogue est à jour");
    } catch { hapticError(); showToast("error", "Erreur", "Impossible de supprimer ce produit"); }
    finally { setDeletingId(null); }
  };

  const uploadBoutiqueImage = async (file: File, type: "logo" | "banner") => {
    if (!boutique) return;
    type === "logo" ? setUploadingLogo(true) : setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("type", type); fd.append("boutiqueId", boutique.id);
      const oldUrl = type === "logo" ? boutique.logo_url : boutique.banner_url;
      if (oldUrl) fd.append("oldUrl", oldUrl);
      const res = await fetch("/api/boutiques/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBoutique((b) => b ? { ...b, [type === "logo" ? "logo_url" : "banner_url"]: data.url } : b);
      showToast("success", type === "logo" ? "Logo mis à jour" : "Couverture mise à jour", "");
    } catch { showToast("error", "Upload impossible", "Réessayez avec une autre image"); }
    finally { type === "logo" ? setUploadingLogo(false) : setUploadingBanner(false); }
  };

  const handleShare = async () => {
    if (!boutiqueUrl || !boutique) return;
    if (navigator.share) {
      try { await navigator.share({ title: boutique.nom, text: "Découvre ma boutique locale sur Binq", url: boutiqueUrl }); return; } catch {}
    }
    await navigator.clipboard.writeText(boutiqueUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    showToast("success", "Lien copié", "Partagez votre boutique aux clients");
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /></div>;

  if (!boutique) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="w-full max-w-xl rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-yellow-50 p-6 sm:p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-5"><Store className="w-7 h-7" /></div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 mb-2">Marchand</p>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950">Créez votre commerce local</h1>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">Ajoutez une boutique, publiez vos produits et recevez les commandes des clients autour de vous.</p>
          <div className="mt-7 space-y-4">
            <input value={formNom} onChange={(e) => setFormNom(e.target.value)} placeholder="Ex: Chez Awa, Market Cocody" className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" autoFocus />
            <select value={formCat} onChange={(e) => setFormCat(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
              <option value="">Choisir une catégorie</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>)}
            </select>
            <button onClick={handleCreateBoutique} disabled={creating || !formNom.trim()} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50">
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Ouvrir ma boutique <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-8 space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-white bg-gradient-to-br from-emerald-50 via-white to-yellow-50 p-5 sm:p-7 shadow-sm">
        <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBoutiqueImage(f, "logo"); }} className="hidden" />
        <input ref={bannerInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBoutiqueImage(f, "banner"); }} className="hidden" />
        <div className="absolute inset-x-0 top-0 h-32 bg-emerald-100/60">{boutique.banner_url && <img src={boutique.banner_url} alt="" className="w-full h-full object-cover" />}</div>
        <div className="relative z-10 pt-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="flex items-end gap-4">
            <button onClick={() => logoInputRef.current?.click()} className="relative w-24 h-24 rounded-[1.75rem] bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center group">
              {boutique.logo_url ? <img src={boutique.logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-10 h-10 text-emerald-600" />}
              <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">{uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}</span>
            </button>
            <div className="pb-1"><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Commerce local</p><h1 className="text-2xl sm:text-4xl font-black tracking-[-0.05em] text-slate-950">{boutique.nom}</h1><p className="text-sm text-slate-500 mt-1">{boutique.ville || boutique.adresse || "Boutique prête à vendre"}</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => bannerInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50">{uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />} Couverture</button>
            <button onClick={handleShare} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50">{copied ? <Copy className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />} Partager</button>
            <a href={`/boutique/${boutique.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white hover:bg-emerald-700">Voir la boutique <ExternalLink className="w-4 h-4" /></a>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{ label: "Ventes", value: formatMontant(stats.totalVentes || 0, devise), icon: ShoppingBag }, { label: "Commandes", value: String(stats.totalCommandes || commandes.length), icon: Truck }, { label: "Produits", value: String(stats.totalProduits || produits.length), icon: Package }, { label: "Vues", value: String(stats.vues || boutique.vues || 0), icon: Store }].map((item) => (
          <div key={item.label} className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm"><item.icon className="w-5 h-5 text-emerald-600 mb-3" /><p className="text-xs font-black uppercase tracking-wide text-slate-400">{item.label}</p><p className="text-xl font-black text-slate-950 mt-1">{item.value}</p></div>
        ))}
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ id: "produits" as const, label: "Produits", icon: Package }, { id: "commandes" as const, label: "Commandes", icon: Truck }, { id: "reglages" as const, label: "Réglages", icon: Settings }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${activeTab === tab.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}><tab.icon className="w-4 h-4" /> {tab.label}</button>
        ))}
      </div>

      {activeTab === "produits" && <section className="space-y-4">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black text-slate-950">Catalogue</h2><p className="text-sm text-slate-500">Produits vendus aux clients Binq.</p></div><button onClick={() => setShowAddProduct(true)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700"><Plus className="w-4 h-4" /> Ajouter</button></div>
        {showAddProduct && <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5"><h3 className="font-black text-slate-950">Nouveau produit</h3><button onClick={() => { setShowAddProduct(false); resetProductForm(); }} className="p-2 rounded-xl bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button></div>
          <div className="grid md:grid-cols-[180px_1fr] gap-5">
            <button onClick={() => prodImageRef.current?.click()} className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden">{prodImagePreview ? <img src={prodImagePreview} alt="" className="w-full h-full object-cover" /> : <><ImagePlus className="w-8 h-8 text-slate-300 mb-2" /><span className="text-xs font-bold text-slate-400">Photo produit</span></>}</button>
            <input ref={prodImageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; setProdImageFile(file); setProdImagePreview(URL.createObjectURL(file)); }} />
            <div className="grid sm:grid-cols-2 gap-3"><input value={prodNom} onChange={(e) => setProdNom(e.target.value)} placeholder="Nom du produit" className="sm:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" /><input type="number" inputMode="decimal" value={prodPrix} onChange={(e) => setProdPrix(e.target.value)} placeholder={`Prix (${devise})`} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" /><input type="number" inputMode="decimal" value={prodPrixBarre} onChange={(e) => setProdPrixBarre(e.target.value)} placeholder="Prix barré" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" /><input value={prodCategorie} onChange={(e) => setProdCategorie(e.target.value)} placeholder="Catégorie produit" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" /><input type="number" inputMode="numeric" value={prodStock} onChange={(e) => setProdStock(e.target.value)} placeholder="Stock" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" /><textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} placeholder="Description" rows={3} className="sm:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" /><button onClick={handleAddProduct} disabled={saving || !prodNom.trim() || !prodPrix} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Publier le produit</>}</button></div>
          </div>
        </div>}
        {produits.length === 0 ? <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-10 text-center"><Package className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="font-black text-slate-700">Aucun produit</p><p className="text-sm text-slate-400 mt-1">Ajoutez vos produits pour démarrer les ventes.</p></div> : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{produits.map((produit) => <div key={produit.id} className="rounded-[1.5rem] border border-slate-100 bg-white p-3 shadow-sm"><div className="aspect-[4/3] rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center">{produit.image_url ? <img src={produit.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-slate-300" />}</div><div className="pt-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-black text-slate-950 truncate">{produit.nom}</p><p className="text-xs text-slate-400">{produit.stock === null || produit.stock === undefined ? "Stock libre" : `${produit.stock} en stock`} · {produit.ventes || 0} vente{(produit.ventes || 0) > 1 ? "s" : ""}</p></div><button onClick={() => handleDeleteProduct(produit.id)} disabled={deletingId === produit.id} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100">{deletingId === produit.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button></div><div className="flex items-center justify-between mt-3"><p className="font-black text-emerald-700">{formatMontant(Number(produit.prix || 0), (produit.devise as DeviseCode) || devise)}</p><Link href={`/produit/${produit.id}`} target="_blank" className="text-xs font-black text-slate-500 hover:text-emerald-700">Voir</Link></div></div></div>)}</div>}
      </section>}

      {activeTab === "commandes" && <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4 mb-5"><div><h2 className="text-xl font-black text-slate-950">Commandes clients</h2><p className="text-sm text-slate-500">Préparation, livraison et suivi.</p></div><Link href="/commandes" className="text-sm font-black text-emerald-700">Ouvrir</Link></div>{commandes.length === 0 ? <div className="py-10 text-center rounded-2xl bg-slate-50"><ShoppingBag className="w-9 h-9 text-slate-300 mx-auto mb-3" /><p className="font-bold text-slate-700">Aucune commande</p><p className="text-sm text-slate-400">Partagez votre boutique aux clients.</p></div> : <div className="space-y-2">{commandes.map((commande) => <Link key={commande.id} href="/commandes" className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 hover:bg-emerald-50/50 transition"><div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center"><Truck className="w-5 h-5 text-emerald-600" /></div><div className="flex-1 min-w-0"><p className="text-sm font-black text-slate-950 truncate">{commande.client_nom || "Client"}</p><p className="text-xs text-slate-500 truncate">{commande.adresse_livraison || commande.reference || "Commande locale"}</p></div><div className="text-right"><p className="text-sm font-black text-slate-950">{formatMontant(Number(commande.montant_total || commande.montant || 0), (commande.devise as DeviseCode) || devise)}</p><p className="text-[11px] font-bold text-emerald-700">{statusLabel(commande.statut)}</p></div></Link>)}</div>}</section>}

      {activeTab === "reglages" && <section className="grid lg:grid-cols-[1fr_280px] gap-5"><div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-slate-950">Réglages commerce</h2><p className="text-sm text-slate-500 mt-1">Les informations détaillées seront bientôt éditables ici.</p><div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-slate-50 p-4"><span className="text-slate-400">Téléphone</span><p className="font-bold text-slate-800 mt-1">{boutique.telephone || "Non renseigné"}</p></div><div className="rounded-2xl bg-slate-50 p-4"><span className="text-slate-400">WhatsApp</span><p className="font-bold text-slate-800 mt-1">{boutique.whatsapp || "Non renseigné"}</p></div><div className="rounded-2xl bg-slate-50 p-4"><span className="text-slate-400">Adresse</span><p className="font-bold text-slate-800 mt-1">{boutique.adresse || "Non renseignée"}</p></div><div className="rounded-2xl bg-slate-50 p-4"><span className="text-slate-400">Devise</span><p className="font-bold text-slate-800 mt-1">{devise}</p></div></div></div><div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 text-center shadow-sm"><QRCodeSVG value={boutiqueUrl} size={210} level="H" className="mx-auto" /><p className="font-black text-slate-950 mt-4">QR boutique</p><p className="text-xs text-slate-400 mt-1">À afficher au comptoir pour ouvrir le catalogue.</p></div></section>}
    </div>
  );
}
