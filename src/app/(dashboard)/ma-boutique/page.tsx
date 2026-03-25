"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess, hapticError, hapticMedium, hapticLight } from "@/lib/haptics";
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
  Settings,
  TrendingUp,
  Sparkles,
  Star,
  Type,
  FileText,
  Shield,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";
import ScanResultOverlay from "@/components/ScanResultOverlay";

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

  // Tabs — Événements first
  const [activeTab, setActiveTab] = useState<"evenements" | "terminal" | "produits" | "historique" | "reglages">("evenements");
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
  const [evtTicketTypes, setEvtTicketTypes] = useState<Array<{nom: string; prix: string; qty: string}>>([{nom: "Standard", prix: "", qty: "100"}]);
  const [evtLogoFile, setEvtLogoFile] = useState<File | null>(null);
  const [evtLogoPreview, setEvtLogoPreview] = useState<string | null>(null);
  const [evtCoverFile, setEvtCoverFile] = useState<File | null>(null);
  const [evtCoverPreview, setEvtCoverPreview] = useState<string | null>(null);
  const evtFormLogoRef = useRef<HTMLInputElement>(null);
  const evtFormCoverRef = useRef<HTMLInputElement>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventTickets, setEventTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scanCode, setScanCode] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [uploadingEvtLogo, setUploadingEvtLogo] = useState(false);
  const [uploadingEvtCover, setUploadingEvtCover] = useState(false);
  const evtLogoInputRef = useRef<HTMLInputElement>(null);
  const evtCoverInputRef = useRef<HTMLInputElement>(null);

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
          // Charger les événements au démarrage (event-first)
          try {
            const evtRes = await fetch(`/api/events?boutique_id=${meData.boutique.id}`);
            const evtData = await evtRes.json();
            setEvents(Array.isArray(evtData) ? evtData : []);
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Auto-ouvrir le formulaire si ?action=create
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("action") === "create" && boutique && !loading) {
      setShowAddEvent(true);
      setActiveTab("evenements");
      // Nettoyer l'URL
      window.history.replaceState({}, "", "/ma-boutique");
    }
  }, [searchParams, boutique, loading]);

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
      showToast("success", "C'est parti !", "Créez votre premier événement");
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
      try { await navigator.share({ title: boutique.nom, text: `Découvre mes événements sur Binq`, url }); } catch {}
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
    if (!evtNom.trim() || !evtDateDebut || !evtLieu.trim() || !boutique || !evtLogoFile || !evtCoverFile) return;
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
          ticket_types: evtTicketTypes.map(t => ({
            nom: t.nom.trim() || "Standard",
            prix: t.prix || "0",
            quantite_total: t.qty || "100",
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Upload logo + cover en parallèle
      const eventId = data.id;
      const uploads: Promise<any>[] = [];
      for (const { file, type } of [{ file: evtLogoFile, type: "logo" }, { file: evtCoverFile, type: "cover" }]) {
        if (file) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("event_id", eventId);
          fd.append("type", type);
          uploads.push(
            fetch("/api/events/upload", { method: "POST", body: fd })
              .then(async (r) => {
                const d = await r.json();
                if (!r.ok) { console.error(`Upload ${type} failed:`, d.error); return { type, url: null }; }
                return { type, url: d.url };
              })
              .catch((err) => { console.error(`Upload ${type} error:`, err); return { type, url: null }; })
          );
        }
      }
      const results = await Promise.all(uploads);
      let updatedEvent = data;
      for (const r of results) {
        if (r.url) updatedEvent = { ...updatedEvent, [`${r.type}_url`]: r.url };
      }

      setEvents((prev) => [...prev, updatedEvent]);
      setShowAddEvent(false);
      setEvtNom(""); setEvtDesc(""); setEvtDateDebut(""); setEvtHeureDebut(""); setEvtLieu(""); setEvtVille("");
      setEvtTicketTypes([{nom: "Standard", prix: "", qty: "100"}]);
      setEvtLogoFile(null); setEvtLogoPreview(null); setEvtCoverFile(null); setEvtCoverPreview(null);
      hapticSuccess();
      const uploadFailed = results.some((r: any) => !r.url);
      showToast("success", "Événement créé !", uploadFailed ? "Les images seront à re-uploader" : "");
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

  const handleUploadEventImage = async (file: File, eventId: string, type: "logo" | "cover") => {
    const setUploading = type === "logo" ? setUploadingEvtLogo : setUploadingEvtCover;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("event_id", eventId);
      fd.append("type", type);
      const res = await fetch("/api/events/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Update selectedEvent and events list
      const field = type === "logo" ? "logo_url" : "cover_url";
      setSelectedEvent((prev: any) => prev ? { ...prev, [field]: data.url } : prev);
      setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, [field]: data.url } : e));
      hapticSuccess();
      showToast("success", type === "logo" ? "Logo ajouté" : "Cover ajoutée");
    } catch (err: any) {
      hapticError();
      showToast("error", "Erreur", err.message || "Impossible d\u0027uploader");
    } finally { setUploading(false); }
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
      // Extraire le code QR brut — supporte URL complète ou code brut
      let code = scanCode.trim();
      if (code.includes("/billet/")) {
        code = code.split("/billet/").pop()?.split("?")[0]?.split("#")[0] || code;
      }
      const res = await fetch("/api/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_code: code }),
      });
      const data = await res.json();
      setScanResult(data);
      if (data.valid) { hapticSuccess(); }
      else { hapticError(); }
    } catch { hapticError(); setScanResult({ valid: false, error: "Erreur réseau" }); }
    finally { setScanning(false); setScanCode(""); }
  };

  const validateScannedCode = useCallback(async (rawCode: string) => {
    setScanning(true);
    setScanResult(null);
    try {
      let code = rawCode.trim();
      if (code.includes("/billet/")) {
        code = code.split("/billet/").pop()?.split("?")[0]?.split("#")[0] || code;
      }
      const res = await fetch("/api/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_code: code }),
      });
      const data = await res.json();
      setScanResult(data);
      if (data.valid) { hapticSuccess(); } else { hapticError(); }
    } catch { hapticError(); setScanResult({ valid: false, error: "Erreur réseau" }); }
    finally { setScanning(false); }
  }, []);

  const stopCamera = useCallback(() => {
    if (scannerRef.current) {
      try { scannerRef.current.stop().catch(() => {}); } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    // Nettoyer tout scanner existant
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanResult(null);
    setCameraActive(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      // Attendre que le div soit dans le DOM (polling)
      let attempts = 0;
      while (!document.getElementById("qr-scanner-region") && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      const el = document.getElementById("qr-scanner-region");
      if (!el) { setCameraActive(false); return; }
      // Vider le contenu résiduel
      el.innerHTML = "";
      const scanner = new Html5Qrcode("qr-scanner-region");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 280 }, aspectRatio: 1 },
        (decodedText) => {
          scanner.stop().catch(() => {});
          try { scanner.clear(); } catch {}
          scannerRef.current = null;
          setCameraActive(false);
          hapticSuccess();
          validateScannedCode(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error("Camera error:", err);
      setCameraActive(false);
      hapticError();
      showToast("error", "Caméra", "Impossible d'accéder à la caméra");
    }
  }, [validateScannedCode]);

  const closeScanMode = useCallback(() => {
    stopCamera();
    setScanMode(false);
    setScanResult(null);
    setScanCode("");
    setManualMode(false);
  }, [stopCamera]);

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
          <h1 className="text-[26px] font-black text-gray-900 tracking-tight mb-10">Commencer</h1>

          <div className="space-y-6">
            <div>
              <label className="text-[13px] font-semibold text-gray-500 block mb-2">Nom de votre espace</label>
              <input
                value={formNom}
                onChange={(e) => setFormNom(e.target.value)}
                placeholder="Ex: Événements Abidjan"
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
    <div className="pb-28 lg:pb-10">
      {/* Header — épuré */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-gray-900">Mes événements</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span className="text-[11px] text-gray-400">{events.length} événement{events.length > 1 ? "s" : ""}</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab(activeTab === "reglages" ? "evenements" : "reglages")}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
              activeTab === "reglages" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats business — toujours visible */}
      {activeTab === "evenements" && (
        <div className="px-4 mb-4 mt-1">
          <div className="flex gap-2 lg:gap-4">
            <div className="flex-1 bg-emerald-500 rounded-2xl p-3.5 lg:p-5">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3 h-3 text-white/70" />
                <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wide">Revenus</span>
              </div>
              <p className="text-lg font-black text-white">
                {formatMontant(events.reduce((sum: number, e: any) => sum + (parseFloat(e.revenus) || 0), 0), devise)}
              </p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-2xl p-3.5 lg:p-5 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Ticket className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Vendus</span>
              </div>
              <p className="text-lg font-black text-gray-900">
                {events.reduce((sum: number, e: any) => sum + (e.total_vendu || 0), 0)}
                <span className="text-xs text-gray-400 font-semibold ml-1">billets</span>
              </p>
            </div>
          </div>
        </div>
      )}

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
            Partager mon lien
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
          {/* Scanner mode — Caméra */}
          {scanMode ? (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
              {/* Header */}
              <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
                <h2 className="text-lg font-black text-white">Scanner un billet</h2>
                <button onClick={closeScanMode} className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Résultat du scan */}
              {scanResult ? (
                <ScanResultOverlay
                  result={scanResult}
                  onScanNext={() => { setScanResult(null); setTimeout(() => startCamera(), 300); }}
                  onClose={() => { setScanResult(null); closeScanMode(); }}
                />
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* Zone caméra */}
                  {cameraActive && (
                    <div className="flex-1 flex flex-col">
                      <div className="relative flex-1 overflow-hidden">
                        <div id="qr-scanner-region" ref={scannerDivRef} className="w-full h-full" />
                        {/* Overlay cadre */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-72 h-72 border-2 border-white/30 rounded-2xl relative">
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                          </div>
                        </div>
                        {scanning && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="px-6 py-4 text-center">
                        <p className="text-sm text-white/60">Placez le QR code du billet devant la caméra</p>
                      </div>
                    </div>
                  )}

                  {/* Bouton lancer la caméra */}
                  {!cameraActive && (
                    <div className="flex-1 flex flex-col items-center justify-center px-6">
                      <button
                        onClick={startCamera}
                        className="w-full max-w-sm py-16 bg-emerald-500 text-white rounded-2xl font-bold transition hover:bg-emerald-600 active:scale-[0.97] flex flex-col items-center justify-center gap-3 mb-4"
                      >
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-base font-black">Ouvrir la caméra</span>
                        <span className="text-xs text-white/50 font-normal">Scannez le QR code du billet</span>
                      </button>
                    </div>
                  )}

                  {/* Saisie manuelle — collapsible */}
                  {!cameraActive && (
                    <div className="mt-4">
                      <button
                        onClick={() => setManualMode(!manualMode)}
                        className="w-full text-center text-xs text-white/40 font-semibold py-2 hover:text-white/60 transition"
                      >
                        {manualMode ? "Masquer la saisie manuelle" : "Saisir le code manuellement"}
                      </button>
                      {manualMode && (
                        <div className="flex gap-2 mt-2 animate-in slide-in-from-top-1 duration-150 max-w-sm mx-auto">
                          <input
                            value={scanCode}
                            onChange={(e) => setScanCode(e.target.value)}
                            placeholder="Code ou URL du billet"
                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-400 transition font-mono"
                            onKeyDown={(e) => e.key === "Enter" && handleScanTicket()}
                            autoFocus
                          />
                          <button
                            onClick={handleScanTicket}
                            disabled={scanning || !scanCode.trim()}
                            className="px-5 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm transition hover:bg-emerald-600 active:scale-[0.97] disabled:opacity-50"
                          >
                            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : selectedEvent ? (
            /* ═══ DÉTAIL D'UN ÉVÉNEMENT ═══ */
            <div className="animate-in slide-in-from-right-2 duration-200">
              <button onClick={() => { setSelectedEvent(null); setEventTickets([]); }} className="flex items-center gap-1 text-sm text-gray-500 font-semibold mb-4 hover:text-gray-700 transition">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  <button
                    onClick={() => evtLogoInputRef.current?.click()}
                    className="w-14 h-14 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0 overflow-hidden hover:border-gray-400 transition relative group"
                  >
                    {uploadingEvtLogo ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : selectedEvent.logo_url ? (
                      <>
                        <img src={selectedEvent.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <ImagePlus className="w-5 h-5 text-gray-300" />
                    )}
                  </button>
                  <input ref={evtLogoInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadEventImage(f, selectedEvent.id, "logo"); e.target.value = ""; }} />
                  <div>
                    <h2 className="text-lg font-black text-gray-900">{selectedEvent.nom}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(selectedEvent.date_debut + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })}
                      {selectedEvent.heure_debut ? ` \u00b7 ${selectedEvent.heure_debut.slice(0, 5)}` : ""}
                    </p>
                    <p className="text-xs text-gray-400">{selectedEvent.lieu}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  disabled={deletingEventId === selectedEvent.id}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                >
                  {deletingEventId === selectedEvent.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Cover */}
              <button
                onClick={() => evtCoverInputRef.current?.click()}
                className="w-full h-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center mb-4 overflow-hidden hover:border-gray-400 transition relative group"
              >
                {uploadingEvtCover ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : selectedEvent.cover_url ? (
                  <>
                    <img src={selectedEvent.cover_url} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                      <span className="text-white text-xs font-bold ml-2">Changer la cover</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <ImagePlus className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-400 font-semibold">Ajouter une cover</p>
                  </div>
                )}
              </button>
              <input ref={evtCoverInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadEventImage(f, selectedEvent.id, "cover"); e.target.value = ""; }} />

              {/* Stats rapides */}
              <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-4">
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
              <div className="grid grid-cols-2 gap-2 lg:gap-4 mb-4">
                <button
                  onClick={() => { setScanMode(true); setScanResult(null); setScanCode(""); setTimeout(() => startCamera(), 300); }}
                  className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-sm transition hover:bg-emerald-600 active:scale-[0.97]"
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
              {/* CTA Créer */}
              <button
                onClick={() => { hapticMedium(); setShowAddEvent(true); }}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm transition active:scale-[0.97] mb-2.5"
              >
                <Plus className="w-4 h-4" /> Créer un événement
              </button>

              {/* CTA Scanner — séparé */}
              <button
                onClick={() => { setScanMode(true); setScanResult(null); setScanCode(""); hapticMedium(); setTimeout(() => startCamera(), 300); }}
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm transition hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] mb-4 shadow-sm shadow-emerald-500/20"
              >
                <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
                  <ScanLine className="w-4 h-4" />
                </div>
                Scanner un billet
              </button>

              {/* Création rapide événement — Premium Design */}
              {showAddEvent && (
                <div className="mb-4 animate-in slide-in-from-top-2 duration-300 lg:max-w-2xl lg:mx-auto">
                  {/* ── Hero Header ── */}
                  <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-5 pb-6 mb-4 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-400/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/4" />
                    <div className="absolute top-4 right-16 w-2 h-2 bg-yellow-300/60 rounded-full animate-pulse" />
                    <div className="absolute bottom-6 right-8 w-1.5 h-1.5 bg-emerald-300/60 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    
                    <div className="relative flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                          </div>
                          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Nouveau</span>
                        </div>
                        <h3 className="text-xl font-black text-white leading-tight">Créer un<br />événement</h3>
                        <p className="text-[11px] text-white/50 mt-1.5">En quelques étapes, vos billets seront en vente</p>
                      </div>
                      <button onClick={() => setShowAddEvent(false)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition">
                        <X className="w-4 h-4 text-white/70" />
                      </button>
                    </div>

                    <div className="relative flex items-center gap-1.5 mt-4">
                      <div className={`h-1 rounded-full transition-all duration-500 ${evtCoverPreview && evtLogoPreview ? 'bg-emerald-400 w-8' : 'bg-white/20 w-5'}`} />
                      <div className={`h-1 rounded-full transition-all duration-500 ${evtNom.trim() && evtLieu.trim() ? 'bg-emerald-400 w-8' : 'bg-white/20 w-5'}`} />
                      <div className={`h-1 rounded-full transition-all duration-500 ${evtDateDebut ? 'bg-emerald-400 w-8' : 'bg-white/20 w-5'}`} />
                      <div className={`h-1 rounded-full transition-all duration-500 ${evtTicketTypes[0]?.nom ? 'bg-emerald-400 w-8' : 'bg-white/20 w-5'}`} />
                      <span className="text-[9px] text-white/30 ml-auto font-semibold">
                        {[evtCoverPreview && evtLogoPreview, evtNom.trim() && evtLieu.trim(), evtDateDebut, evtTicketTypes[0]?.nom].filter(Boolean).length}/4
                      </span>
                    </div>
                  </div>

                  {/* ── Section 1: Visuels ── */}
                  <div className="relative mb-3">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-sm shadow-pink-500/30">
                        <Camera className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900">Visuels</p>
                        <p className="text-[10px] text-gray-400">Les images attirent les participants</p>
                      </div>
                    </div>

                    <button type="button" onClick={() => evtFormCoverRef.current?.click()}
                      className={`w-full h-36 rounded-2xl flex items-center justify-center overflow-hidden transition-all relative group mb-3 ${
                        evtCoverPreview ? "ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10" : "bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 hover:border-purple-300 hover:from-purple-50/50 hover:to-pink-50/50"
                      }`}>
                      {evtCoverPreview ? (
                        <>
                          <img src={evtCoverPreview} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
                            <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><Camera className="w-3 h-3" /> Changer</span>
                          </div>
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"><Check className="w-3 h-3 text-white" /></div>
                        </>
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform"><ImagePlus className="w-5 h-5 text-purple-400" /></div>
                          <p className="text-xs font-bold text-gray-500">Ajouter la cover</p>
                          <p className="text-[10px] text-gray-300 mt-0.5">Image de fond de votre événement</p>
                        </div>
                      )}
                    </button>
                    <input ref={evtFormCoverRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEvtCoverFile(f); setEvtCoverPreview(URL.createObjectURL(f)); } e.target.value = ""; }} />

                    <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
                      <button type="button" onClick={() => evtFormLogoRef.current?.click()}
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden transition-all relative group shrink-0 ${
                          evtLogoPreview ? "ring-2 ring-emerald-500/30 shadow-md" : "bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-dashed border-purple-200 hover:border-purple-400"
                        }`}>
                        {evtLogoPreview ? (
                          <>
                            <img src={evtLogoPreview} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><Camera className="w-4 h-4 text-white" /></div>
                          </>
                        ) : (<Star className="w-5 h-5 text-purple-300" />)}
                      </button>
                      <input ref={evtFormLogoRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEvtLogoFile(f); setEvtLogoPreview(URL.createObjectURL(f)); } e.target.value = ""; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900">Logo / Photo de profil</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Visible sur la page et les billets</p>
                      </div>
                      {evtLogoPreview && (<div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white" /></div>)}
                    </div>
                  </div>

                  {/* ── Section 2: Infos événement ── */}
                  <div className="relative mb-3">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/30">
                        <Type className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900">Informations</p>
                        <p className="text-[10px] text-gray-400">Les détails de votre événement</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-4 pb-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Nom de l&apos;événement *</label>
                        <input value={evtNom} onChange={(e) => setEvtNom(e.target.value)} placeholder="Ex: Binq Party, Festival Afro..."
                          className="w-full bg-transparent text-[15px] font-bold text-gray-900 placeholder:text-gray-300 outline-none" autoFocus />
                      </div>
                      <div className="mx-4 border-t border-gray-50" />
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0"><MapPin className="w-3.5 h-3.5 text-orange-500" /></div>
                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Lieu *</label>
                            <input value={evtLieu} onChange={(e) => setEvtLieu(e.target.value)} placeholder="Palais de la Culture, Stade..."
                              className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-300 outline-none font-medium" />
                          </div>
                        </div>
                      </div>
                      <div className="mx-4 border-t border-gray-50" />
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0"><MapPin className="w-3.5 h-3.5 text-cyan-500" /></div>
                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Ville</label>
                            <input value={evtVille} onChange={(e) => setEvtVille(e.target.value)} placeholder="Abidjan, Dakar, Lomé..."
                              className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-300 outline-none font-medium" />
                          </div>
                        </div>
                      </div>
                      <div className="mx-4 border-t border-gray-50" />
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0"><Calendar className="w-3.5 h-3.5 text-violet-500" /></div>
                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Date & heure *</label>
                            <div className="flex items-center gap-2">
                              <input type="date" value={evtDateDebut} onChange={(e) => setEvtDateDebut(e.target.value)} className="flex-1 bg-transparent text-sm text-gray-900 outline-none font-medium" />
                              <div className="w-px h-4 bg-gray-200" />
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <input type="time" value={evtHeureDebut} onChange={(e) => setEvtHeureDebut(e.target.value)} className="w-20 bg-transparent text-sm text-gray-900 outline-none font-medium" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Section 3: Billets ── */}
                  <div className="relative mb-3">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shadow-emerald-500/30">
                        <Ticket className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-gray-900">Billetterie</p>
                        <p className="text-[10px] text-gray-400">Définissez vos types de billets</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{evtTicketTypes.length} type{evtTicketTypes.length > 1 ? "s" : ""}</span>
                    </div>
                    <div className="space-y-2.5">
                      {evtTicketTypes.map((ticket, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 relative overflow-hidden group">
                          <div className={`absolute top-0 left-0 w-1 h-full rounded-r-full ${
                            idx === 0 ? 'bg-gradient-to-b from-emerald-400 to-teal-500' :
                            idx === 1 ? 'bg-gradient-to-b from-violet-400 to-purple-500' :
                            idx === 2 ? 'bg-gradient-to-b from-amber-400 to-orange-500' :
                            'bg-gradient-to-b from-blue-400 to-indigo-500'
                          }`} />
                          <div className="flex items-center gap-2.5 pl-2">
                            <div className="flex-1 min-w-0">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Nom du billet</label>
                              <input value={ticket.nom} onChange={(e) => { const arr = [...evtTicketTypes]; arr[idx] = {...arr[idx], nom: e.target.value}; setEvtTicketTypes(arr); }}
                                placeholder="Ex: VIP, Standard..." className="w-full bg-transparent text-sm font-bold text-gray-900 placeholder:text-gray-300 outline-none mt-0.5" />
                            </div>
                            {evtTicketTypes.length > 1 && (
                              <button onClick={() => { const arr = evtTicketTypes.filter((_, i) => i !== idx); setEvtTicketTypes(arr); }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-200 hover:text-red-500 hover:bg-red-50 transition shrink-0 opacity-0 group-hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2.5 pl-2">
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Prix</label>
                              <div className="flex items-center gap-1 mt-0.5">
                                <input type="number" inputMode="numeric" value={ticket.prix} onChange={(e) => { const arr = [...evtTicketTypes]; arr[idx] = {...arr[idx], prix: e.target.value}; setEvtTicketTypes(arr); }}
                                  placeholder="0 = gratuit" className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2 text-sm font-bold text-gray-900 placeholder:text-gray-300 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition" />
                                <span className="text-[10px] text-gray-400 font-bold shrink-0">{devise}</span>
                              </div>
                            </div>
                            <div className="w-20">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Places</label>
                              <input type="number" inputMode="numeric" value={ticket.qty} onChange={(e) => { const arr = [...evtTicketTypes]; arr[idx] = {...arr[idx], qty: e.target.value}; setEvtTicketTypes(arr); }}
                                placeholder="100" className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2 text-sm text-center font-bold text-gray-900 placeholder:text-gray-300 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition mt-0.5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { setEvtTicketTypes([...evtTicketTypes, {nom: "", prix: "", qty: "100"}]); hapticLight(); }}
                      className="w-full mt-2.5 flex items-center justify-center gap-1.5 text-xs font-bold text-violet-600 py-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 transition active:scale-[0.98]">
                      <Plus className="w-3.5 h-3.5" /> Ajouter un type de billet
                    </button>
                  </div>

                  {/* ── Section 4: Description ── */}
                  <div className="relative mb-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/30">
                        <FileText className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900">Description <span className="text-gray-300 font-normal text-[11px]">(optionnel)</span></p>
                      </div>
                    </div>
                    <textarea value={evtDesc} onChange={(e) => setEvtDesc(e.target.value)} rows={3} placeholder="Décrivez votre événement pour donner envie aux participants..."
                      className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition resize-none shadow-sm" />
                  </div>

                  {/* ── Section 5: Prévisualisation du billet ── */}
                  {(evtNom.trim() || evtLieu.trim() || evtDateDebut) && (
                    <div className="relative mb-4">
                      <button
                        type="button"
                        onClick={() => { setShowTicketPreview(!showTicketPreview); hapticLight(); }}
                        className="flex items-center gap-2.5 mb-3 w-full text-left group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-sm">
                          <Eye className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-bold text-gray-900">Aperçu du billet</p>
                          <p className="text-[10px] text-gray-400">Voyez comment vos participants recevront leur ticket</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          showTicketPreview ? 'bg-violet-100 rotate-90' : 'bg-gray-100'
                        }`}>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                            showTicketPreview ? 'text-violet-600' : 'text-gray-400'
                          }`} />
                        </div>
                      </button>

                      {showTicketPreview && (
                        <div className="animate-in slide-in-from-top-1 duration-200">
                          <div className="bg-black rounded-[2rem] p-1 shadow-2xl shadow-black/30 mx-2">
                            <div className="bg-black rounded-[1.75rem] overflow-hidden">
                              <div className="flex justify-center pt-2 pb-3">
                                <div className="w-20 h-5 bg-gray-900 rounded-full" />
                              </div>
                              <div className="px-4 pb-5">
                                <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                                  <div className="bg-black p-4 pb-5">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Billet</p>
                                    <h4 className="text-base font-black text-white mb-2.5 leading-tight">
                                      {evtNom.trim() || "Nom de l'événement"}
                                    </h4>
                                    <div className="space-y-1.5">
                                      {evtDateDebut && (
                                        <div className="flex items-center gap-1.5">
                                          <Calendar className="w-3 h-3 text-gray-500" />
                                          <p className="text-[11px] text-gray-400 capitalize">
                                            {new Date(evtDateDebut + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                                          </p>
                                        </div>
                                      )}
                                      {evtHeureDebut && (
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="w-3 h-3 text-gray-500" />
                                          <p className="text-[11px] text-gray-400">{evtHeureDebut.slice(0, 5)}</p>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3 h-3 text-gray-500" />
                                        <p className="text-[11px] text-gray-400">
                                          {evtLieu.trim() || "Lieu"}{evtVille.trim() ? `, ${evtVille.trim()}` : ""}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="relative h-5">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-black rounded-full" />
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 bg-black rounded-full" />
                                    <div className="border-t-2 border-dashed border-gray-200 absolute top-1/2 left-5 right-5" />
                                  </div>
                                  <div className="p-4 pt-2">
                                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
                                      <Check className="w-2.5 h-2.5 text-emerald-500" />
                                      <span className="text-[9px] font-bold text-emerald-500">Valide</span>
                                    </div>
                                    <div className="flex justify-center mb-4">
                                      <div className="bg-white p-2.5 rounded-xl border-2 border-gray-100">
                                        <QRCodeSVG value="https://binq.app/billet/DEMO-PREVIEW" size={140} level="H" includeMargin />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400">Référence</span>
                                        <span className="text-[10px] font-bold text-gray-900 font-mono">BQ-XXXXXXXX</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400">Type</span>
                                        <span className="text-[10px] font-bold text-gray-900">{evtTicketTypes[0]?.nom || "Standard"}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400">Nom</span>
                                        <span className="text-[10px] font-bold text-gray-900">Nom du participant</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400">Prix</span>
                                        <span className="text-[10px] font-bold text-gray-900">
                                          {evtTicketTypes[0]?.prix ? formatMontant(parseFloat(evtTicketTypes[0].prix), devise) : "Gratuit"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 justify-center mt-3">
                                  <Shield className="w-3 h-3 text-gray-600" />
                                  <p className="text-[9px] text-gray-600">Présentez ce QR code à l&apos;entrée</p>
                                </div>
                                <p className="text-center text-[9px] text-gray-600 mt-2">
                                  Propulsé par <span className="text-white font-bold">Binq</span>
                                </p>
                              </div>
                            </div>
                          </div>
                          <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">
                            ✨ Aperçu du billet tel que reçu par vos participants
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── CTA Créer ── */}
                  <button onClick={handleCreateEvent} disabled={savingEvent || !evtNom.trim() || !evtDateDebut || !evtLieu.trim() || !evtLogoFile || !evtCoverFile}
                    className="w-full relative flex items-center justify-center gap-2.5 py-4.5 rounded-2xl font-black text-[15px] transition-all disabled:opacity-40 active:scale-[0.97] overflow-hidden group"
                    style={{ background: savingEvent ? '#1f2937' : 'linear-gradient(135deg, #7c3aed, #6d28d9, #4f46e5)' }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <span className="relative flex items-center gap-2.5 text-white">
                      {savingEvent ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                      {savingEvent ? "Création en cours..." : "Créer mon événement"}
                    </span>
                  </button>
                  <div className="flex items-center justify-center gap-2 mt-3 mb-1">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-gray-400">En ligne immédiatement</span>
                    </div>
                    <span className="text-gray-200">·</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      <span className="text-[10px] text-gray-400">Billets sécurisés</span>
                    </div>
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
                <div className="space-y-2.5">
                  {events.map((evt: any) => {
                    const evtDate = new Date(evt.date_debut + "T00:00:00");
                    const now = new Date();
                    const isPast = evtDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const isToday = evtDate.toDateString() === now.toDateString();
                    return (
                      <button
                        key={evt.id}
                        onClick={() => { setSelectedEvent(evt); loadEventTickets(evt.id); }}
                        className="w-full bg-white rounded-2xl border border-gray-100 p-3.5 flex items-center gap-3 text-left hover:border-gray-200 hover:shadow-sm transition active:scale-[0.99]"
                      >
                        {/* Date badge ou logo */}
                        {evt.logo_url ? (
                          <div className="relative shrink-0">
                            <img src={evt.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                            {isToday && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />}
                          </div>
                        ) : (
                          <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                            isPast ? "bg-gray-200" : isToday ? "bg-emerald-500" : "bg-gray-900"
                          }`}>
                            <span className={`text-[10px] font-bold uppercase leading-none ${
                              isPast ? "text-gray-500" : isToday ? "text-emerald-100" : "text-gray-400"
                            }`}>
                              {evtDate.toLocaleDateString("fr-FR", { month: "short" })}
                            </span>
                            <span className={`text-lg font-black leading-none ${
                              isPast ? "text-gray-600" : "text-white"
                            }`}>
                              {evtDate.getDate()}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900 truncate">{evt.nom}</p>
                            {/* Status badge */}
                            {isPast ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-400 shrink-0">Terminé</span>
                            ) : isToday ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 shrink-0">Aujourd&apos;hui</span>
                            ) : null}
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{evt.lieu}{evt.ville ? ` · ${evt.ville}` : ""}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[11px] text-emerald-600 font-bold">{evt.total_vendu || 0} billet{(evt.total_vendu || 0) > 1 ? "s" : ""}</span>
                            {parseFloat(evt.revenus) > 0 && (
                              <span className="text-[11px] text-gray-900 font-black">{formatMontant(parseFloat(evt.revenus), devise)}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
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

          {/* Infos */}
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
                <p className="text-xs text-gray-400 truncate">binq.app/{boutique.slug}</p>
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
            <p className="text-xs font-bold text-gray-700 mb-3">QR de votre espace</p>
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
                  const text = encodeURIComponent(`Découvre mes événements sur Binq`);
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
          ><ExternalLink className="w-4 h-4" />Voir ma page</Link>
        </div>
      )}
    </div>
  );
}
