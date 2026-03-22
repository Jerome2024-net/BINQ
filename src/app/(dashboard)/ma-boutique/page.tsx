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
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Users,
  ScanLine,
  ChevronRight,
  Eye,
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
  const [activeTab, setActiveTab] = useState<"terminal" | "produits" | "evenements" | "historique" | "reglages">("terminal");
  const [encaisserMode, setEncaisserMode] = useState(false);
  const [encaisserMontant, setEncaisserMontant] = useState("");
  const [encaisserQR, setEncaisserQR] = useState(false);
  const [modeCaisse, setModeCaisse] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loadingCommandes, setLoadingCommandes] = useState(false);

  // Billetterie
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [evtNom, setEvtNom] = useState("");
  const [evtDesc, setEvtDesc] = useState("");
  const [evtDateDebut, setEvtDateDebut] = useState("");
  const [evtHeureDebut, setEvtHeureDebut] = useState("");
  const [evtLieu, setEvtLieu] = useState("");
  const [evtVille, setEvtVille] = useState("");
  const [evtTypeName, setEvtTypeName] = useState("Standard");
  const [evtTypePrix, setEvtTypePrix] = useState("");
  const [evtTypeQty, setEvtTypeQty] = useState("100");
  const [savingEvent, setSavingEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventTickets, setEventTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scanCode, setScanCode] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

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

  // ═══ BILLETTERIE HANDLERS ═══

  const loadEvents = async () => {
    if (!boutique) return;
    setLoadingEvents(true);
    try {
      const res = await fetch(`/api/events?boutique_id=${boutique.id}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setLoadingEvents(false); }
  };

  const handleCreateEvent = async () => {
    if (!evtNom.trim() || !evtDateDebut || !evtLieu.trim() || !boutique) return;
    setSavingEvent(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boutique_id: boutique.id,
          nom: evtNom.trim(),
          description: evtDesc.trim() || undefined,
          date_debut: evtDateDebut,
          heure_debut: evtHeureDebut || undefined,
          lieu: evtLieu.trim(),
          ville: evtVille.trim() || undefined,
          devise: boutique.devise || "XOF",
          ticket_types: [{
            nom: evtTypeName.trim() || "Standard",
            prix: evtTypePrix || "0",
            quantite_total: evtTypeQty || "100",
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEvents((prev) => [...prev, data]);
      setShowAddEvent(false);
      setEvtNom(""); setEvtDesc(""); setEvtDateDebut(""); setEvtHeureDebut(""); setEvtLieu(""); setEvtVille("");
      setEvtTypeName("Standard"); setEvtTypePrix(""); setEvtTypeQty("100");
      hapticSuccess();
      showToast("success", "Événement créé !");
    } catch (err: any) {
      hapticError();
      showToast("error", "Erreur", err.message || "Impossible de créer");
    } finally { setSavingEvent(false); }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setDeletingEventId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        if (selectedEvent?.id === eventId) setSelectedEvent(null);
        hapticSuccess();
        showToast("success", "Événement supprimé");
      }
    } catch { hapticError(); }
    finally { setDeletingEventId(null); }
  };

  const loadEventTickets = async (eventId: string) => {
    setLoadingTickets(true);
    try {
      const res = await fetch(`/api/events/${eventId}/tickets`);
      const data = await res.json();
      setEventTickets(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setLoadingTickets(false); }
  };

  const handleScanTicket = async () => {
    if (!scanCode.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_code: scanCode.trim() }),
      });
      const data = await res.json();
      setScanResult(data);
      if (data.valid) { hapticSuccess(); }
      else { hapticError(); }
    } catch { hapticError(); setScanResult({ valid: false, error: "Erreur réseau" }); }
    finally { setScanning(false); setScanCode(""); }
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
        <h1 className="text-lg font-black text-gray-900 mb-6">{boutique.nom}</h1>
        <div className="bg-white p-4 rounded-3xl border-[3px] border-gray-900 shadow-xl mb-5">
          <QRCodeSVG value={boutiqueUrl} size={300} level="H" />
        </div>
        <p className="text-[15px] font-bold text-gray-900 mb-1">Scannez pour payer</p>
        <div className="flex items-center gap-2 mt-3 mb-10 animate-pulse">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-[13px] font-semibold text-emerald-600">En attente de paiement</span>
        </div>
        <button
          onClick={() => setModeCaisse(false)}
          className="px-8 py-3 text-gray-400 text-[13px] font-medium hover:text-gray-600 transition"
        >
          Quitter le mode caisse
        </button>
      </div>
    );
  }

  // ═══ PAS DE BOUTIQUE → CRÉATION MINIMALE ═══
  if (!boutique) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center px-6">
        <div className="w-full max-w-sm mx-auto">
          <h1 className="text-[26px] font-black text-gray-900 tracking-tight mb-10">Créer ma boutique</h1>

          <div className="space-y-6">
            <div>
              <label className="text-[13px] font-semibold text-gray-500 block mb-2">Nom de la boutique</label>
              <input
                value={formNom}
                onChange={(e) => setFormNom(e.target.value)}
                placeholder="Ex: Café Chez Mama"
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-[15px] text-gray-900 outline-none focus:border-emerald-500 transition placeholder:text-gray-300"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[13px] font-semibold text-gray-500 block mb-2">Catégorie <span className="text-gray-300">(optionnel)</span></label>
              <select
                value={formCat}
                onChange={(e) => setFormCat(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-[15px] text-gray-900 outline-none focus:border-emerald-500 transition bg-white"
              >
                <option value="">Choisir une catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreateBoutique}
              disabled={creating || !formNom.trim()}
              className="w-full flex items-center justify-center py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[15px] rounded-2xl transition disabled:opacity-40 active:scale-[0.97] mt-2"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continuer"}
            </button>
          </div>
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
        <div className="bg-white p-4 rounded-3xl border-[3px] border-gray-900 shadow-xl mb-5 animate-in zoom-in-95 duration-300">
          <QRCodeSVG value={qrValue} size={260} level="H" />
        </div>
        <p className="text-[36px] font-black text-gray-900 mb-1">{formatMontant(amount, devise)}</p>
        <p className="text-[15px] font-bold text-gray-900 mb-1">Scannez pour payer</p>
        <div className="flex items-center gap-2 mt-3 mb-10 animate-pulse">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-[13px] font-semibold text-emerald-600">En attente de paiement</span>
        </div>
        <button
          onClick={() => { hapticSuccess(); resetEncaisser(); }}
          className="w-full max-w-xs py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-[15px] transition active:scale-[0.97]"
        >
          Nouvelle vente
        </button>
        <button onClick={() => setEncaisserQR(false)} className="mt-4 text-[13px] text-gray-400 font-medium hover:text-gray-600 transition">
          Modifier le montant
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
          { id: "evenements" as const, label: "Événements" },
          { id: "historique" as const, label: "Commandes" },
          { id: "reglages" as const, label: "Réglages" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === "historique" && commandes.length === 0) loadCommandes();
              if (tab.id === "evenements" && events.length === 0) loadEvents();
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
          {/* Shop name */}
          <p className="text-[13px] font-semibold text-gray-500 mb-5">{boutique.nom}</p>

          {/* QR DOMINANT */}
          <div className="bg-white p-3 rounded-3xl border-[3px] border-gray-900 shadow-xl mb-5">
            <QRCodeSVG value={boutiqueUrl} size={280} level="H" />
          </div>
          <p className="text-[15px] font-bold text-gray-900 mb-1">Scannez pour payer</p>

          {/* État dynamique */}
          <div className="flex items-center gap-2 mt-3 mb-8 animate-pulse">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-[13px] font-semibold text-emerald-600">En attente de paiement</span>
          </div>

          {/* Actions */}
          <button
            onClick={() => { setEncaisserMode(true); hapticMedium(); }}
            className="w-full max-w-xs py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-[15px] transition active:scale-[0.97] mb-3"
          >
            Encaisser un montant
          </button>
          <button
            onClick={handleShare}
            className="w-full max-w-xs py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold text-[14px] transition active:scale-[0.97]"
          >
            Partager ma boutique
          </button>

          {/* Mode caisse — discret */}
          <button
            onClick={() => { setModeCaisse(true); hapticMedium(); }}
            className="mt-6 text-[12px] text-gray-400 font-medium hover:text-gray-600 transition"
          >
            Mode caisse plein écran
          </button>

          {/* Mini stats */}
          <div className="w-full flex items-center justify-center gap-6 mt-8 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-black text-gray-900">{stats.totalCommandes}</p>
              <p className="text-[11px] text-gray-400">Ventes</p>
            </div>
            <div className="w-px h-5 bg-gray-200" />
            <div className="text-center">
              <p className="text-sm font-black text-gray-900">{formatMontant(stats.totalVentes, devise)}</p>
              <p className="text-[11px] text-gray-400">Revenus</p>
            </div>
            <div className="w-px h-5 bg-gray-200" />
            <div className="text-center">
              <p className="text-lg font-black text-gray-900">{stats.totalProduits}</p>
              <p className="text-[11px] text-gray-400">Produits</p>
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

      {/* ═══ TAB: ÉVÉNEMENTS (Billetterie) ═══ */}
      {activeTab === "evenements" && (
        <div className="px-4">
          {/* Scanner mode */}
          {scanMode ? (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900">Scanner un billet</h2>
                <button onClick={() => { setScanMode(false); setScanResult(null); setScanCode(""); }}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Code du billet</label>
                <div className="flex gap-2">
                  <input
                    value={scanCode}
                    onChange={(e) => setScanCode(e.target.value)}
                    placeholder="Entrez ou scannez le code QR"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-900 transition font-mono"
                    onKeyDown={(e) => e.key === "Enter" && handleScanTicket()}
                    autoFocus
                  />
                  <button
                    onClick={handleScanTicket}
                    disabled={scanning || !scanCode.trim()}
                    className="px-5 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm transition hover:bg-gray-800 active:scale-[0.97] disabled:opacity-50"
                  >
                    {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Résultat du scan */}
              {scanResult && (
                <div className={`rounded-2xl p-5 mb-4 animate-in zoom-in-95 duration-200 ${
                  scanResult.valid
                    ? "bg-emerald-50 border-2 border-emerald-200"
                    : "bg-red-50 border-2 border-red-200"
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      scanResult.valid ? "bg-emerald-500" : "bg-red-500"
                    }`}>
                      {scanResult.valid ? <Check className="w-6 h-6 text-white" /> : <X className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                      <p className={`font-black text-lg ${scanResult.valid ? "text-emerald-700" : "text-red-700"}`}>
                        {scanResult.valid ? "Billet valide ✓" : scanResult.error || "Billet invalide"}
                      </p>
                      {scanResult.ticket && (
                        <p className="text-sm text-gray-600">{scanResult.ticket.buyer_name}</p>
                      )}
                    </div>
                  </div>
                  {scanResult.ticket && (
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-gray-200/50">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Réf</span>
                        <span className="text-xs font-bold text-gray-900 font-mono">{scanResult.ticket.reference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Type</span>
                        <span className="text-xs font-bold text-gray-900">{scanResult.ticket.type}</span>
                      </div>
                      {scanResult.ticket.event && (
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Événement</span>
                          <span className="text-xs font-bold text-gray-900">{scanResult.ticket.event}</span>
                        </div>
                      )}
                      {scanResult.ticket.scanned_at && (
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Scanné le</span>
                          <span className="text-xs font-bold text-gray-900">
                            {new Date(scanResult.ticket.scanned_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => { setScanResult(null); setScanCode(""); }}
                className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition"
              >
                Scanner un autre billet
              </button>
            </div>
          ) : selectedEvent ? (
            /* ═══ DÉTAIL D'UN ÉVÉNEMENT ═══ */
            <div className="animate-in slide-in-from-right-2 duration-200">
              <button onClick={() => { setSelectedEvent(null); setEventTickets([]); }} className="flex items-center gap-1 text-sm text-gray-500 font-semibold mb-4 hover:text-gray-700 transition">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black text-gray-900">{selectedEvent.nom}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(selectedEvent.date_debut + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })}
                    {selectedEvent.heure_debut ? ` · ${selectedEvent.heure_debut.slice(0, 5)}` : ""}
                  </p>
                  <p className="text-xs text-gray-400">{selectedEvent.lieu}</p>
                </div>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  disabled={deletingEventId === selectedEvent.id}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                >
                  {deletingEventId === selectedEvent.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Stats rapides */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-black text-gray-900">{selectedEvent.total_vendu || 0}</p>
                  <p className="text-[10px] text-gray-400">Billets vendus</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-black text-gray-900">{formatMontant(parseFloat(selectedEvent.revenus) || 0, devise)}</p>
                  <p className="text-[10px] text-gray-400">Revenus</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-black text-gray-900">
                    {selectedEvent.ticket_types?.reduce((a: number, t: any) => a + (t.quantite_total - t.quantite_vendue), 0) || 0}
                  </p>
                  <p className="text-[10px] text-gray-400">Restants</p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => { setScanMode(true); setScanResult(null); setScanCode(""); }}
                  className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm transition hover:bg-gray-800 active:scale-[0.97]"
                >
                  <ScanLine className="w-4 h-4" /> Scanner
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/evenement/${selectedEvent.id}`;
                    if (navigator.share) { navigator.share({ title: selectedEvent.nom, url }).catch(() => {}); }
                    else { navigator.clipboard.writeText(url).then(() => showToast("success", "Lien copié")); }
                  }}
                  className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold text-sm transition hover:bg-gray-200 active:scale-[0.97]"
                >
                  <Share2 className="w-4 h-4" /> Partager
                </button>
              </div>

              {/* Lien public */}
              <a
                href={`/evenement/${selectedEvent.id}`}
                target="_blank"
                className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-3 rounded-xl font-bold text-sm mb-5 transition hover:bg-emerald-100 border border-emerald-200/50"
              >
                <Eye className="w-4 h-4" /> Voir la page publique
              </a>

              {/* Types de billets */}
              {selectedEvent.ticket_types && selectedEvent.ticket_types.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-2">Types de billets</h3>
                  <div className="space-y-2">
                    {selectedEvent.ticket_types.map((tt: any) => (
                      <div key={tt.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{tt.nom}</p>
                          <p className="text-xs text-gray-400">{tt.quantite_vendue}/{tt.quantite_total} vendus</p>
                        </div>
                        <p className="text-sm font-black text-gray-900">
                          {tt.prix > 0 ? formatMontant(tt.prix, devise) : "Gratuit"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Liste des billets vendus */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-700">Billets vendus</h3>
                  {!loadingTickets && (
                    <button onClick={() => loadEventTickets(selectedEvent.id)} className="text-xs text-emerald-600 font-semibold">
                      Rafraîchir
                    </button>
                  )}
                </div>
                {loadingTickets ? (
                  <div className="text-center py-8"><Loader2 className="w-5 h-5 text-gray-300 animate-spin mx-auto" /></div>
                ) : eventTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <Ticket className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Aucun billet vendu</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eventTickets.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{t.buyer_name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{t.reference}</p>
                          {t.ticket_types?.nom && <p className="text-[10px] text-gray-400">{t.ticket_types.nom}</p>}
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          t.statut === "valid" ? "bg-emerald-50 text-emerald-600" :
                          t.statut === "used" ? "bg-gray-100 text-gray-500" :
                          "bg-red-50 text-red-500"
                        }`}>
                          {t.statut === "valid" ? "✓ Valide" : t.statut === "used" ? "Utilisé" : t.statut}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ═══ LISTE DES ÉVÉNEMENTS ═══ */
            <div>
              <button
                onClick={() => { hapticMedium(); setShowAddEvent(true); }}
                className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-3.5 rounded-xl font-bold text-sm transition border border-emerald-200/50 mb-4"
              >
                <Plus className="w-4 h-4" /> Créer un événement
              </button>

              {/* Scanner rapide */}
              <button
                onClick={() => { setScanMode(true); setScanResult(null); setScanCode(""); hapticMedium(); }}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm transition hover:bg-gray-800 active:scale-[0.97] mb-4"
              >
                <ScanLine className="w-4 h-4" /> Scanner un billet
              </button>

              {/* Formulaire création événement */}
              {showAddEvent && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Nouvel événement</h3>
                    <button onClick={() => setShowAddEvent(false)}><X className="w-4 h-4 text-gray-400" /></button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Nom de l&apos;événement *</label>
                      <input value={evtNom} onChange={(e) => setEvtNom(e.target.value)} placeholder="Ex: Concert Live 2026"
                        className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700">Date *</label>
                        <input type="date" value={evtDateDebut} onChange={(e) => setEvtDateDebut(e.target.value)}
                          className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700">Heure</label>
                        <input type="time" value={evtHeureDebut} onChange={(e) => setEvtHeureDebut(e.target.value)}
                          className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Lieu *</label>
                      <input value={evtLieu} onChange={(e) => setEvtLieu(e.target.value)} placeholder="Ex: Palais de la Culture"
                        className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Ville</label>
                      <input value={evtVille} onChange={(e) => setEvtVille(e.target.value)} placeholder="Abidjan"
                        className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Description <span className="text-gray-400">(optionnel)</span></label>
                      <textarea value={evtDesc} onChange={(e) => setEvtDesc(e.target.value)} rows={2} placeholder="Décrivez votre événement..."
                        className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition resize-none" />
                    </div>

                    {/* Type de billet */}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-700 mb-2">Type de billet</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-700">Nom</label>
                          <input value={evtTypeName} onChange={(e) => setEvtTypeName(e.target.value)} placeholder="Standard"
                            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700">Prix</label>
                          <input type="number" inputMode="numeric" value={evtTypePrix} onChange={(e) => setEvtTypePrix(e.target.value)} placeholder="0 = Gratuit"
                            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="text-xs font-semibold text-gray-700">Places disponibles</label>
                        <input type="number" value={evtTypeQty} onChange={(e) => setEvtTypeQty(e.target.value)} placeholder="100"
                          className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition" />
                      </div>
                    </div>

                    <button onClick={handleCreateEvent} disabled={savingEvent || !evtNom.trim() || !evtDateDebut || !evtLieu.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50 active:scale-[0.98]"
                    >
                      {savingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                      {savingEvent ? "Création..." : "Créer l\u0027événement"}
                    </button>
                  </div>
                </div>
              )}

              {/* Liste événements */}
              {loadingEvents ? (
                <div className="text-center py-12"><Loader2 className="w-6 h-6 text-gray-300 animate-spin mx-auto" /></div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-500">Aucun événement</p>
                  <p className="text-xs text-gray-400 mt-1">Créez votre premier événement et vendez des billets</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map((evt: any) => {
                    const dateStr = new Date(evt.date_debut + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
                    return (
                      <button
                        key={evt.id}
                        onClick={() => { setSelectedEvent(evt); loadEventTickets(evt.id); }}
                        className="w-full bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3 text-left hover:border-gray-200 transition active:scale-[0.99]"
                      >
                        <div className="w-12 h-12 bg-gray-900 rounded-xl flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                            {new Date(evt.date_debut + "T00:00:00").toLocaleDateString("fr-FR", { month: "short" })}
                          </span>
                          <span className="text-lg font-black text-white leading-none">
                            {new Date(evt.date_debut + "T00:00:00").getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{evt.nom}</p>
                          <p className="text-xs text-gray-400 truncate">{evt.lieu}{evt.ville ? ` · ${evt.ville}` : ""}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-emerald-600 font-bold">{evt.total_vendu || 0} vendu{(evt.total_vendu || 0) > 1 ? "s" : ""}</span>
                            {parseFloat(evt.revenus) > 0 && (
                              <span className="text-[10px] text-gray-400 font-semibold">{formatMontant(parseFloat(evt.revenus), devise)}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
