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
  Loader2,
  Camera,
  ImagePlus,
  X,
  ExternalLink,
  Share2,
  Copy,
  QrCode,
  Check,
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  ScanLine,
  ChevronRight,
  Eye,
  Settings,
  TrendingUp,
  Sparkles,
  Star,
  Zap,
  Type,
  Hash,
  FileText,
  Shield,
  Printer,
  Users,
  UserPlus,
  UserMinus,
  Search,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";
import { generateEventPoster } from "@/lib/generatePoster";
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

interface Categorie {
  id: string;
  nom: string;
  slug: string;
  icone: string;
}

export default function EvenementsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Création boutique
  const [formNom, setFormNom] = useState("");
  const [formCat, setFormCat] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<"evenements" | "reglages">("evenements");
  const [copied, setCopied] = useState(false);

  // Billetterie
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [evtNom, setEvtNom] = useState("");
  const [evtDesc, setEvtDesc] = useState("");
  const [evtDateDebut, setEvtDateDebut] = useState("");
  const [evtHeureDebut, setEvtHeureDebut] = useState("");
  const [evtLieu, setEvtLieu] = useState("");
  const [evtVille, setEvtVille] = useState("");
  const [evtCategorie, setEvtCategorie] = useState("");
  const [evtTicketTypes, setEvtTicketTypes] = useState<Array<{nom: string; prix: string; qty: string}>>([{nom: "Standard", prix: "", qty: "100"}]);
  const [evtLogoFile, setEvtLogoFile] = useState<File | null>(null);
  const [evtLogoPreview, setEvtLogoPreview] = useState<string | null>(null);
  const [evtCoverFile, setEvtCoverFile] = useState<File | null>(null);
  const [evtCoverPreview, setEvtCoverPreview] = useState<string | null>(null);
  const evtFormLogoRef = useRef<HTMLInputElement>(null);
  const evtFormCoverRef = useRef<HTMLInputElement>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);
  const [generatingPoster, setGeneratingPoster] = useState(false);
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
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editTicketTypes, setEditTicketTypes] = useState<any[]>([]);
  const [deleteTicketTypeIds, setDeleteTicketTypeIds] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Équipe de scan
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamEmail, setTeamEmail] = useState("");
  const [addingTeamMember, setAddingTeamMember] = useState(false);
  const [showTeamSection, setShowTeamSection] = useState(false);

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

  // Auto-ouvrir le formulaire si ?action=create, ou sélection d'événement si ?event=id
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!boutique || loading) return;
    const action = searchParams.get("action");
    const eventId = searchParams.get("event");
    if (action === "create") {
      setCreateStep(1);
      setShowAddEvent(true);
      setActiveTab("evenements");
      window.history.replaceState({}, "", "/evenements");
    } else if (action === "scan") {
      setScanMode(true);
      setScanResult(null);
      setScanCode("");
      setActiveTab("evenements");
      window.history.replaceState({}, "", "/evenements");
      setTimeout(() => startCamera(), 300);
    } else if (eventId && events.length > 0) {
      const found = events.find((e: any) => e.id === eventId);
      if (found) {
        setSelectedEvent(found);
        loadEventTickets(found.id);
        setActiveTab("evenements");
        window.history.replaceState({}, "", "/evenements");
      }
    }
  }, [searchParams, boutique, loading, events]);

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
      } else { setBoutique(data.boutique); }
      hapticSuccess();
      showToast("success", "C'est parti !", "Créez votre première billetterie");
    } catch { hapticError(); showToast("error", "Erreur", "Erreur de création"); }
    finally { setCreating(false); }
  };

  const handleShare = async () => {
    if (!boutique) return;
    const url = `${window.location.origin}/boutique/${boutique.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: boutique.nom, text: "Découvre mes événements sur Binq", url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); showToast("success", "Copié", "Lien copié"); } catch {}
    }
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
    const invalidTicket = evtTicketTypes.some((t) => {
      const price = t.prix === "" ? 0 : Number(t.prix);
      const qty = Number(t.qty);
      return !t.nom.trim() || Number.isNaN(price) || price < 0 || Number.isNaN(qty) || qty < 1;
    });

    if (!boutique) return;
    if (!evtNom.trim() || !evtDateDebut || !evtLieu.trim()) {
      showToast("error", "Infos manquantes", "Nom, date et lieu sont obligatoires");
      setCreateStep(1);
      return;
    }
    if (invalidTicket) {
      showToast("error", "Billets invalides", "Vérifiez le nom, le prix et la quantité");
      setCreateStep(2);
      return;
    }
    if (!evtLogoFile || !evtCoverFile) {
      showToast("error", "Visuels requis", "Ajoutez une couverture et un logo");
      setCreateStep(3);
      return;
    }
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
          categorie_id: evtCategorie || undefined,
          is_published: false,
          ticket_types: evtTicketTypes.map(t => ({
            nom: t.nom.trim() || "Standard",
            prix: t.prix || "0",
            quantite_total: t.qty || "100",
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

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
      const uploadFailed = results.some((r: any) => !r.url);
      if (!uploadFailed) {
        const publishRes = await fetch(`/api/events/${eventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_published: true }),
        });
        if (publishRes.ok) updatedEvent = { ...updatedEvent, is_published: true };
      }

      setEvents((prev) => [...prev, updatedEvent]);
      setShowAddEvent(false);
      setCreateStep(1);
      setEvtNom(""); setEvtDesc(""); setEvtDateDebut(""); setEvtHeureDebut(""); setEvtLieu(""); setEvtVille(""); setEvtCategorie("");
      setEvtTicketTypes([{nom: "Standard", prix: "", qty: "100"}]);
      setEvtLogoFile(null); setEvtLogoPreview(null); setEvtCoverFile(null); setEvtCoverPreview(null);
      hapticSuccess();
      showToast(uploadFailed ? "error" : "success", uploadFailed ? "Billetterie en brouillon" : "Billetterie publiée !", uploadFailed ? "Ajoutez les images puis publiez" : "Elle est prête à être partagée");
    } catch (err: any) {
      hapticError();
      showToast("error", "Erreur", err.message || "Impossible de créer");
    } finally { setSavingEvent(false); }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Supprimer cette billetterie ? Tous les billets vendus seront également supprimés.")) return;
    setDeletingEventId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de suppression");
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      if (selectedEvent?.id === eventId) setSelectedEvent(null);
      hapticSuccess();
      showToast("success", "Billetterie supprimée");
    } catch (err: any) {
      hapticError();
      showToast("error", "Erreur", err.message || "Impossible de supprimer");
    }
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

  const startEditMode = () => {
    if (!selectedEvent) return;
    setEditForm({
      nom: selectedEvent.nom || "",
      description: selectedEvent.description || "",
      date_debut: selectedEvent.date_debut || "",
      heure_debut: selectedEvent.heure_debut?.slice(0, 5) || "",
      lieu: selectedEvent.lieu || "",
      ville: selectedEvent.ville || "",
    });
    setEditTicketTypes(
      (selectedEvent.ticket_types || []).map((tt: any) => ({
        id: tt.id,
        nom: tt.nom,
        prix: String(tt.prix || 0),
        quantite_total: String(tt.quantite_total || 100),
        quantite_vendue: tt.quantite_vendue || 0,
      }))
    );
    setDeleteTicketTypeIds([]);
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEvent || !editForm.nom?.trim() || !editForm.date_debut || !editForm.lieu?.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: editForm.nom.trim(),
          description: editForm.description?.trim() || null,
          date_debut: editForm.date_debut,
          heure_debut: editForm.heure_debut || null,
          lieu: editForm.lieu.trim(),
          ville: editForm.ville?.trim() || null,
          ticket_types: editTicketTypes.map((tt: any) => ({
            id: tt.id || undefined,
            nom: tt.nom,
            prix: tt.prix,
            quantite_total: tt.quantite_total,
          })),
          delete_ticket_type_ids: deleteTicketTypeIds,
          devise: boutique?.devise || "XOF",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedEvent(data);
      setEvents((prev) => prev.map((e) => e.id === data.id ? data : e));
      setEditMode(false);
      hapticSuccess();
      showToast("success", "Événement modifié !");
    } catch (err: any) {
      hapticError();
      showToast("error", "Erreur", err.message || "Impossible de modifier");
    } finally { setSavingEdit(false); }
  };

  // ── Équipe de scan ──
  const loadTeamMembers = async (eventId: string) => {
    setLoadingTeam(true);
    try {
      const res = await fetch(`/api/events/${eventId}/team`);
      const data = await res.json();
      setTeamMembers(data.team || []);
    } catch { setTeamMembers([]); }
    finally { setLoadingTeam(false); }
  };

  const handleAddTeamMember = async () => {
    if (!teamEmail.trim() || !selectedEvent) return;
    setAddingTeamMember(true);
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: teamEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      hapticSuccess();
      showToast("success", data.message || "Membre ajouté !");
      setTeamEmail("");
      loadTeamMembers(selectedEvent.id);
    } catch (err: any) {
      hapticError();
      showToast("error", "Erreur", err.message);
    } finally { setAddingTeamMember(false); }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!selectedEvent) return;
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/team?member_id=${memberId}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      hapticSuccess();
      showToast("success", "Membre retiré");
      setTeamMembers((prev) => prev.filter((m) => m.user_id !== memberId));
    } catch (err: any) {
      hapticError();
      showToast("error", "Erreur", err.message);
    }
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

  const openEventDetails = (evt: any) => {
    setSelectedEvent(evt);
    loadEventTickets(evt.id);
  };

  const handleShareEvent = async (evt: any) => {
    const url = `${window.location.origin}/evenement/${evt.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: evt.nom, text: `Découvre cette billetterie sur Binq`, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("success", "Lien copié", "Lien de la billetterie copié");
      hapticSuccess();
    } catch {
      showToast("error", "Erreur", "Impossible de copier le lien");
      hapticError();
    }
  };

  const getEventStatus = (evt: any) => {
    const evtDate = new Date(evt.date_debut + "T00:00:00");
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (!evt.is_published) return { label: "Brouillon", tone: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
    if (evtDate < today) return { label: "Terminée", tone: "bg-neutral-100 text-neutral-500", dot: "bg-neutral-400" };
    if (evtDate.toDateString() === now.toDateString()) return { label: "Aujourd'hui", tone: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
    return { label: "Publiée", tone: "bg-green-100 text-green-700", dot: "bg-green-500" };
  };

  const handleScanTicket = async () => {
    if (!scanCode.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
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
  }, [validateScannedCode, showToast]);

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
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
      </div>
    );
  }

  const devise = (boutique?.devise as DeviseCode) || "XOF";
  const boutiqueUrl = boutique ? `${typeof window !== "undefined" ? window.location.origin : ""}/boutique/${boutique.slug}` : "";
  const eventInfoValid = Boolean(evtNom.trim() && evtDateDebut && evtLieu.trim());
  const ticketsValid = evtTicketTypes.length > 0 && evtTicketTypes.every((ticket) => {
    const price = ticket.prix === "" ? 0 : Number(ticket.prix);
    const qty = Number(ticket.qty);
    return ticket.nom.trim() && !Number.isNaN(price) && price >= 0 && !Number.isNaN(qty) && qty >= 1;
  });
  const visualsValid = Boolean(evtCoverFile && evtLogoFile);
  const createSteps = [
    { id: 1 as const, label: "Infos", valid: eventInfoValid },
    { id: 2 as const, label: "Billets", valid: ticketsValid },
    { id: 3 as const, label: "Visuels", valid: visualsValid },
    { id: 4 as const, label: "Publier", valid: eventInfoValid && ticketsValid && visualsValid },
  ];
  const canGoNext =
    createStep === 1 ? eventInfoValid :
    createStep === 2 ? ticketsValid :
    createStep === 3 ? visualsValid :
    eventInfoValid && ticketsValid && visualsValid;

  // ═══ PAS DE BOUTIQUE → CRÉATION ═══
  if (!boutique) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center max-w-sm mx-auto">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Create your space</h1>
        <p className="text-sm text-neutral-500 mb-8">Set up your event space to get started.</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 block mb-1.5">Space name</label>
            <input
              value={formNom}
              onChange={(e) => setFormNom(e.target.value)}
              placeholder="My Events"
              className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition placeholder:text-neutral-300"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-700 block mb-1.5">Category <span className="text-neutral-300">(optional)</span></label>
            <select
              value={formCat}
              onChange={(e) => setFormCat(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition bg-white"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreateBoutique}
            disabled={creating || !formNom.trim()}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm rounded-lg transition disabled:opacity-40 active:scale-[0.98]"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // PAGE ÉVÉNEMENTS
  // ═══════════════════════════════════════════════
  return (
    <div className="pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Organisateur</p>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Billetteries</h1>
          {events.length > 0 && (
            <p className="text-sm text-neutral-400 mt-0.5">{events.length} billetterie{events.length > 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <button
              onClick={() => { setScanMode(true); setScanResult(null); setScanCode(""); hapticMedium(); setTimeout(() => startCamera(), 300); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <ScanLine className="w-4 h-4" />
              <span className="hidden sm:inline">Scanner</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab(activeTab === "reglages" ? "evenements" : "reglages")}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === "reglages" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats row — Clean */}
      {activeTab === "evenements" && events.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="border border-blue-100 bg-blue-50/60 rounded-2xl px-4 py-3">
            <p className="text-xs text-blue-600 font-bold mb-0.5 uppercase tracking-wide">Revenus</p>
            <p className="text-lg font-black text-neutral-900">
              {formatMontant(events.reduce((sum: number, e: any) => sum + (parseFloat(e.revenus) || 0), 0), devise)}
            </p>
          </div>
          <div className="border border-indigo-100 bg-indigo-50/60 rounded-2xl px-4 py-3">
            <p className="text-xs text-indigo-600 font-bold mb-0.5 uppercase tracking-wide">Billets</p>
            <p className="text-lg font-black text-neutral-900">
              {events.reduce((sum: number, e: any) => sum + (e.total_vendu || 0), 0)}
            </p>
          </div>
          <div className="border border-green-100 bg-green-50/60 rounded-2xl px-4 py-3">
            <p className="text-xs text-green-600 font-bold mb-0.5 uppercase tracking-wide">Publiées</p>
            <p className="text-lg font-black text-neutral-900">{events.filter((e: any) => e.is_published).length}</p>
          </div>
          <div className="border border-amber-100 bg-amber-50/60 rounded-2xl px-4 py-3">
            <p className="text-xs text-amber-600 font-bold mb-0.5 uppercase tracking-wide">Brouillons</p>
            <p className="text-lg font-black text-neutral-900">{events.filter((e: any) => !e.is_published).length}</p>
          </div>
        </div>
      )}
      {activeTab === "evenements" && (
        <div>
          {/* Scanner mode */}
          {scanMode ? (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h2 className="text-base font-semibold text-white">Scan Ticket</h2>
                <button onClick={closeScanMode} className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {scanResult ? (
                <ScanResultOverlay
                  result={scanResult}
                  onScanNext={() => { setScanResult(null); setTimeout(() => startCamera(), 300); }}
                  onClose={() => { setScanResult(null); closeScanMode(); }}
                />
              ) : (
                <div className="flex-1 flex flex-col">
                  {cameraActive && (
                    <div className="flex-1 flex flex-col">
                      <div className="relative flex-1 overflow-hidden">
                        <div id="qr-scanner-region" ref={scannerDivRef} className="w-full h-full" />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-64 h-64 border-2 border-white/20 rounded-2xl relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-xl" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-xl" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-xl" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-xl" />
                          </div>
                        </div>
                        {scanning && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="px-6 py-4 text-center">
                        <p className="text-sm text-white/50">Point the camera at the ticket QR code</p>
                      </div>
                    </div>
                  )}

                  {!cameraActive && (
                    <div className="flex-1 flex flex-col items-center justify-center px-6">
                      <button
                        onClick={startCamera}
                        className="w-full max-w-sm py-14 bg-white text-neutral-900 rounded-xl font-medium transition hover:bg-neutral-100 active:scale-[0.98] flex flex-col items-center justify-center gap-3 mb-4"
                      >
                        <Camera className="w-8 h-8 text-neutral-400" />
                        <span className="text-sm font-semibold">Open Camera</span>
                      </button>
                    </div>
                  )}

                  {!cameraActive && (
                    <div className="mt-4 px-6 pb-8">
                      <button
                        onClick={() => setManualMode(!manualMode)}
                        className="w-full text-center text-xs text-white/30 font-medium py-2 hover:text-white/50 transition"
                      >
                        {manualMode ? "Hide manual entry" : "Enter code manually"}
                      </button>
                      {manualMode && (
                        <div className="flex gap-2 mt-2 max-w-sm mx-auto">
                          <input
                            value={scanCode}
                            onChange={(e) => setScanCode(e.target.value)}
                            placeholder="Ticket code or URL"
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/40 transition font-mono"
                            onKeyDown={(e) => e.key === "Enter" && handleScanTicket()}
                            autoFocus
                          />
                          <button
                            onClick={handleScanTicket}
                            disabled={scanning || !scanCode.trim()}
                            className="px-4 py-2.5 bg-white text-neutral-900 rounded-lg font-medium text-sm transition hover:bg-neutral-100 disabled:opacity-50"
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
            /* ═══ EVENT DETAIL — LUMA STYLE ═══ */
            <div className="animate-fade-in">
              {/* ═══ EDIT MODE ═══ */}
              {editMode ? (
                <div>
                  <button onClick={() => setEditMode(false)} className="flex items-center gap-1.5 text-sm text-neutral-500 font-medium mb-5 hover:text-neutral-900 transition">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-5">Edit Event</h3>
                  <div className="space-y-4 mb-5">
                    <div>
                      <label className="text-sm font-medium text-neutral-700 block mb-1.5">Name *</label>
                      <input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                        className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-neutral-700 block mb-1.5">Venue *</label>
                        <input value={editForm.lieu} onChange={(e) => setEditForm({ ...editForm, lieu: e.target.value })}
                          className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-700 block mb-1.5">City</label>
                        <input value={editForm.ville} onChange={(e) => setEditForm({ ...editForm, ville: e.target.value })}
                          className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-neutral-700 block mb-1.5">Date *</label>
                        <input type="date" value={editForm.date_debut} onChange={(e) => setEditForm({ ...editForm, date_debut: e.target.value })}
                          className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-700 block mb-1.5">Time</label>
                        <input type="time" value={editForm.heure_debut} onChange={(e) => setEditForm({ ...editForm, heure_debut: e.target.value })}
                          className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700 block mb-1.5">Description</label>
                      <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3} className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition resize-none" />
                    </div>
                  </div>

                  {/* Ticket types editing */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-neutral-700">Ticket Types</h4>
                      <button onClick={() => setEditTicketTypes([...editTicketTypes, { id: null, nom: "", prix: "0", quantite_total: "100", quantite_vendue: 0 }])}
                        className="text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editTicketTypes.map((tt: any, idx: number) => (
                        <div key={tt.id || `new-${idx}`} className="border border-neutral-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <input value={tt.nom} onChange={(e) => { const arr = [...editTicketTypes]; arr[idx] = { ...arr[idx], nom: e.target.value }; setEditTicketTypes(arr); }}
                              placeholder="Ticket name" className="flex-1 text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-300" />
                            {editTicketTypes.length > 1 && (
                              <button onClick={() => {
                                if (tt.id) {
                                  if (tt.quantite_vendue > 0) { showToast("error", "Impossible", "Des billets ont été vendus"); return; }
                                  setDeleteTicketTypeIds([...deleteTicketTypeIds, tt.id]);
                                }
                                setEditTicketTypes(editTicketTypes.filter((_: any, i: number) => i !== idx));
                              }} className="w-6 h-6 rounded flex items-center justify-center text-neutral-300 hover:text-red-500 transition">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="text-xs text-neutral-400 block mb-0.5">Price</label>
                              <input type="number" value={tt.prix} onChange={(e) => { const arr = [...editTicketTypes]; arr[idx] = { ...arr[idx], prix: e.target.value }; setEditTicketTypes(arr); }}
                                className="w-full border border-neutral-200 rounded-lg px-2.5 py-1.5 text-sm font-medium text-neutral-900 outline-none focus:border-neutral-400 transition" />
                            </div>
                            <div className="w-20">
                              <label className="text-xs text-neutral-400 block mb-0.5">Capacity</label>
                              <input type="number" value={tt.quantite_total} onChange={(e) => { const arr = [...editTicketTypes]; arr[idx] = { ...arr[idx], quantite_total: e.target.value }; setEditTicketTypes(arr); }}
                                className="w-full border border-neutral-200 rounded-lg px-2.5 py-1.5 text-sm text-center font-medium text-neutral-900 outline-none focus:border-neutral-400 transition" />
                            </div>
                          </div>
                          {tt.quantite_vendue > 0 && (
                            <p className="text-xs text-neutral-400 mt-1.5">{tt.quantite_vendue} sold</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setEditMode(false)}
                      className="flex-1 py-2.5 bg-neutral-100 text-neutral-600 font-medium text-sm rounded-lg transition hover:bg-neutral-200 active:scale-[0.98]">
                      Cancel
                    </button>
                    <button onClick={handleSaveEdit} disabled={savingEdit || !editForm.nom?.trim() || !editForm.date_debut || !editForm.lieu?.trim()}
                      className="flex-1 py-2.5 bg-neutral-900 text-white font-medium text-sm rounded-lg transition hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2">
                      {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {savingEdit ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
              <>
              {/* ── Cover Image ── */}
              <div className="relative -mx-4 sm:mx-0">
                <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden sm:rounded-xl">
                  {selectedEvent.cover_url ? (
                    <img src={selectedEvent.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-100" />
                  )}
                  {/* Back */}
                  <button
                    onClick={() => { setSelectedEvent(null); setEventTickets([]); setEditMode(false); }}
                    className="absolute top-3 left-3 w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-white transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  {/* Actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button onClick={() => startEditMode()}
                      className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-white transition">
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteEvent(selectedEvent.id)} disabled={deletingEventId === selectedEvent.id}
                      className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-white hover:text-red-500 transition">
                      {deletingEventId === selectedEvent.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {/* Upload */}
                  <input ref={evtCoverInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadEventImage(f, selectedEvent.id, "cover"); e.target.value = ""; }} />
                  {!selectedEvent.cover_url && (
                    <button onClick={() => evtCoverInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition">
                      <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg text-xs font-medium">
                        <Camera className="w-3.5 h-3.5" /> Add cover image
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Event Info */}
              <div className="mt-5">
                <div className="flex items-start gap-3 mb-5">
                  {/* Logo */}
                  <button
                    onClick={() => evtLogoInputRef.current?.click()}
                    className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 overflow-hidden hover:bg-neutral-200 transition group relative"
                  >
                    {uploadingEvtLogo ? (
                      <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                    ) : selectedEvent.logo_url ? (
                      <>
                        <img src={selectedEvent.logo_url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </div>
                      </>
                    ) : (
                      <ImagePlus className="w-4 h-4 text-neutral-300" />
                    )}
                  </button>
                  <input ref={evtLogoInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadEventImage(f, selectedEvent.id, "logo"); e.target.value = ""; }} />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-neutral-900 leading-tight">{selectedEvent.nom}</h2>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(selectedEvent.date_debut + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {selectedEvent.heure_debut && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {selectedEvent.heure_debut.slice(0, 5)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-neutral-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedEvent.lieu}{selectedEvent.ville ? ` · ${selectedEvent.ville}` : ""}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="border border-neutral-200 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-400 mb-0.5">Revenue</p>
                    <p className="text-sm font-semibold text-neutral-900">{formatMontant(parseFloat(selectedEvent.revenus) || 0, devise)}</p>
                  </div>
                  <div className="border border-neutral-200 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-400 mb-0.5">Sold</p>
                    <p className="text-sm font-semibold text-neutral-900">{selectedEvent.total_vendu || 0}</p>
                  </div>
                  <div className="border border-neutral-200 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-400 mb-0.5">Remaining</p>
                    <p className="text-sm font-semibold text-neutral-900">
                      {selectedEvent.ticket_types?.reduce((a: number, t: any) => a + (t.quantite_total - t.quantite_vendue), 0) || 0}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mb-5">
                  <button
                    onClick={() => { setScanMode(true); setScanResult(null); setScanCode(""); setTimeout(() => startCamera(), 300); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 text-white py-2.5 rounded-lg font-medium text-sm transition hover:bg-neutral-800 active:scale-[0.98]"
                  >
                    <ScanLine className="w-4 h-4" /> Scan
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/evenement/${selectedEvent.id}`;
                      if (navigator.share) { navigator.share({ title: selectedEvent.nom, url }).catch(() => {}); }
                      else { navigator.clipboard.writeText(url).then(() => showToast("success", "Lien copié")); }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 border border-neutral-200 text-neutral-700 py-2.5 rounded-lg font-medium text-sm transition hover:bg-neutral-50 active:scale-[0.98]"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>

                <div className="flex gap-2 mb-5">
                  <a
                    href={`/evenement/${selectedEvent.id}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 border border-neutral-200 text-neutral-600 py-2.5 rounded-lg font-medium text-xs transition hover:bg-neutral-50"
                  >
                    <Eye className="w-3.5 h-3.5" /> Public Page
                  </a>
                  <button
                    onClick={async () => {
                      setGeneratingPoster(true);
                      try { await generateEventPoster(selectedEvent, devise); }
                      catch (err) { console.error(err); }
                      finally { setGeneratingPoster(false); }
                    }}
                    disabled={generatingPoster}
                    className="flex-1 flex items-center justify-center gap-2 border border-neutral-200 text-neutral-600 py-2.5 rounded-lg font-medium text-xs transition hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {generatingPoster ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                    ) : (
                      <><Printer className="w-3.5 h-3.5" /> Download QR</>
                    )}
                  </button>
                </div>
              </div>

              {/* Ticket Types */}
              {selectedEvent.ticket_types && selectedEvent.ticket_types.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-neutral-900 mb-3">Tickets</h3>
                  <div className="space-y-2">
                    {selectedEvent.ticket_types.map((tt: any) => {
                      const ttSoldPct = tt.quantite_total > 0 ? Math.round((tt.quantite_vendue / tt.quantite_total) * 100) : 0;
                      return (
                        <div key={tt.id} className="border border-neutral-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{tt.nom}</p>
                              <p className="text-xs text-neutral-400 mt-0.5">{tt.quantite_vendue} / {tt.quantite_total} sold</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-neutral-900">
                                {tt.prix > 0 ? formatMontant(tt.prix, devise) : "Free"}
                              </p>
                              {tt.prix > 0 && tt.quantite_vendue > 0 && (
                                <p className="text-xs text-neutral-400 mt-0.5">
                                  {formatMontant(tt.prix * tt.quantite_vendue, devise)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(ttSoldPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Scan Team */}
              <div className="mb-6">
                <button
                  onClick={() => {
                    const next = !showTeamSection;
                    setShowTeamSection(next);
                    if (next && teamMembers.length === 0) loadTeamMembers(selectedEvent.id);
                  }}
                  className="flex items-center justify-between w-full mb-3"
                >
                  <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-neutral-400" /> Scan Team
                  </h3>
                  <ChevronRight className={`w-4 h-4 text-neutral-300 transition-transform ${showTeamSection ? "rotate-90" : ""}`} />
                </button>

                {showTeamSection && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={teamEmail}
                        onChange={(e) => setTeamEmail(e.target.value)}
                        placeholder="Controller email..."
                        className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                        onKeyDown={(e) => e.key === "Enter" && handleAddTeamMember()}
                      />
                      <button
                        onClick={handleAddTeamMember}
                        disabled={addingTeamMember || !teamEmail.trim()}
                        className="bg-neutral-900 text-white px-3 py-2 rounded-lg disabled:opacity-50 transition hover:bg-neutral-800"
                      >
                        {addingTeamMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-neutral-400">The controller must have a Binq account to scan tickets for this event.</p>

                    {loadingTeam ? (
                      <div className="text-center py-4"><Loader2 className="w-4 h-4 text-neutral-300 animate-spin mx-auto" /></div>
                    ) : teamMembers.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-xs text-neutral-400">No controllers added</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {teamMembers.filter((m) => m.is_active).map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between border border-neutral-200 rounded-lg p-3">
                            <div>
                              <p className="text-sm font-medium text-neutral-900">
                                {m.profile?.prenom || ""} {m.profile?.nom || "User"}
                              </p>
                              <p className="text-xs text-neutral-400">{m.profile?.email || m.profile?.telephone || "–"}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveTeamMember(m.user_id)}
                              className="text-neutral-300 hover:text-red-500 transition p-1"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Participants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-1.5">
                    Guests
                    {!loadingTickets && eventTickets.length > 0 && (
                      <span className="text-xs text-neutral-400 font-normal">({eventTickets.length})</span>
                    )}
                  </h3>
                  {!loadingTickets && (
                    <button onClick={() => loadEventTickets(selectedEvent.id)} className="text-xs text-neutral-400 hover:text-neutral-600 transition font-medium">
                      Refresh
                    </button>
                  )}
                </div>
                {loadingTickets ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-4 h-4 text-neutral-300 animate-spin mx-auto" />
                  </div>
                ) : eventTickets.length === 0 ? (
                  <div className="border border-neutral-200 rounded-xl py-8 text-center">
                    <p className="text-sm text-neutral-400">No guests yet</p>
                    <p className="text-xs text-neutral-300 mt-1">Share your event to start selling</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {eventTickets.map((t: any) => {
                      const initials = (t.buyer_name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                      return (
                        <div key={t.id} className="flex items-center gap-3 py-3">
                          <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-semibold text-neutral-600">{initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900">{t.buyer_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-neutral-400 font-mono">{t.reference}</p>
                              {t.ticket_types?.nom && (
                                <>
                                  <span className="text-neutral-200">·</span>
                                  <p className="text-xs text-neutral-400">{t.ticket_types.nom}</p>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                            t.statut === "valid" ? "bg-blue-50 text-blue-600" :
                            t.statut === "used" ? "bg-neutral-100 text-neutral-500" :
                            "bg-red-50 text-red-500"
                          }`}>
                            {t.statut === "valid" ? "Valid" : t.statut === "used" ? "Used" : t.statut}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              </>
              )}
            </div>
          ) : (
            /* ═══ EVENT LIST — LUMA STYLE ═══ */
            <div>
              {/* Create Event CTA */}
              {events.length > 0 && !showAddEvent && (
                <div className="mb-5">
                  <button
                    onClick={() => { hapticMedium(); setCreateStep(1); setShowAddEvent(true); }}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white py-2.5 rounded-lg font-medium text-sm transition hover:bg-neutral-800 active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" /> Créer une billetterie
                  </button>
                </div>
              )}

              {/* Creation Form — Luma Clean + Live Ticket Preview */}
              {showAddEvent && (
                <div className="mb-8 animate-fade-in">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 lg:max-w-none">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">Nouvelle billetterie</h3>
                      <p className="text-sm text-neutral-400 mt-0.5">Créez, configurez puis publiez votre accès QR.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowTicketPreview(!showTicketPreview)} className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition">
                        <Eye className="w-3.5 h-3.5" /> {showTicketPreview ? "Formulaire" : "Aperçu"}
                      </button>
                      <button onClick={() => { setShowAddEvent(false); setCreateStep(1); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition text-neutral-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {createSteps.map((step) => (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setCreateStep(step.id)}
                        className={`rounded-xl border px-2 py-2 text-center transition ${
                          createStep === step.id
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : step.valid
                              ? "border-green-100 bg-green-50 text-green-700"
                              : "border-neutral-200 bg-white text-neutral-400"
                        }`}
                      >
                        <span className="block text-[10px] font-black">0{step.id}</span>
                        <span className="block text-[11px] font-semibold truncate">{step.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-8 lg:gap-10">
                    {/* ── LEFT: Form Fields ── */}
                    <div className={`flex-1 min-w-0 lg:max-w-lg ${showTicketPreview ? "hidden lg:block" : ""}`}>

                  {/* Cover + Logo */}
                  {createStep === 3 && (
                  <div className="mb-5">
                    <label className="text-sm font-medium text-neutral-700 block mb-2">Visuels de la billetterie *</label>
                    <p className="text-xs text-neutral-400 mb-3">Ajoutez une couverture et un logo. La billetterie ne sera publiée qu&apos;après upload réussi.</p>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => evtFormCoverRef.current?.click()}
                        className={`flex-1 h-36 rounded-xl flex items-center justify-center overflow-hidden relative group transition-all border ${
                          evtCoverPreview ? "border-neutral-200" : "border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50"
                        }`}>
                        {evtCoverPreview ? (
                          <>
                            <img src={evtCoverPreview} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <span className="bg-white text-neutral-900 text-xs font-medium px-2.5 py-1 rounded-md">Change</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <ImagePlus className="w-5 h-5 text-neutral-300 mx-auto mb-1" />
                            <p className="text-xs font-medium text-neutral-400">Couverture</p>
                          </div>
                        )}
                      </button>
                      <input ref={evtFormCoverRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEvtCoverFile(f); setEvtCoverPreview(URL.createObjectURL(f)); } e.target.value = ""; }} />

                      <button type="button" onClick={() => evtFormLogoRef.current?.click()}
                        className={`w-24 h-36 rounded-xl flex items-center justify-center overflow-hidden relative group transition-all shrink-0 border ${
                          evtLogoPreview ? "border-neutral-200" : "border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50"
                        }`}>
                        {evtLogoPreview ? (
                          <>
                            <img src={evtLogoPreview} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <Camera className="w-4 h-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <Star className="w-4 h-4 text-neutral-300 mx-auto mb-1" />
                            <p className="text-xs font-medium text-neutral-400">Logo</p>
                          </div>
                        )}
                      </button>
                      <input ref={evtFormLogoRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEvtLogoFile(f); setEvtLogoPreview(URL.createObjectURL(f)); } e.target.value = ""; }} />
                    </div>
                  </div>
                  )}

                  {/* Event Details */}
                  {createStep === 1 && (
                  <div className="space-y-4 mb-5">
                    <div>
                      <label className="text-sm font-medium text-neutral-700 block mb-1.5">Nom de l&apos;événement *</label>
                      <input value={evtNom} onChange={(e) => setEvtNom(e.target.value)} placeholder="Ex: Concert privé, Masterclass, Soirée..."
                        className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition" autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-neutral-700 block mb-1.5">Lieu *</label>
                        <input value={evtLieu} onChange={(e) => setEvtLieu(e.target.value)} placeholder="Nom du lieu"
                          className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-700 block mb-1.5">Ville</label>
                        <input value={evtVille} onChange={(e) => setEvtVille(e.target.value)} placeholder="Ville"
                          className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-neutral-700 block mb-1.5">Date *</label>
                        <input type="date" value={evtDateDebut} onChange={(e) => setEvtDateDebut(e.target.value)}
                          className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-700 block mb-1.5">Heure</label>
                        <input type="time" value={evtHeureDebut} onChange={(e) => setEvtHeureDebut(e.target.value)}
                          className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition" />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-sm font-medium text-neutral-700 block mb-1.5">Catégorie</label>
                      <select value={evtCategorie} onChange={(e) => setEvtCategorie(e.target.value)}
                        className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition bg-white">
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  )}

                  {/* Ticket Types */}
                  {createStep === 2 && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-neutral-700">Billets *</label>
                      <span className="text-xs text-neutral-400">{evtTicketTypes.length} type{evtTicketTypes.length > 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-3">Indiquez au moins un nom, un prix et une quantité. Prix à 0 = billet gratuit.</p>

                    <div className="space-y-2">
                      {evtTicketTypes.map((ticket, idx) => (
                        <div key={idx} className="border border-neutral-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <label className="text-xs text-neutral-400 block mb-1">Nom du billet</label>
                              <input value={ticket.nom} onChange={(e) => { const arr = [...evtTicketTypes]; arr[idx] = {...arr[idx], nom: e.target.value}; setEvtTicketTypes(arr); }}
                                placeholder="Ex: Standard, VIP..."
                                className="w-full text-sm font-medium text-neutral-900 placeholder:text-neutral-300 outline-none" />
                            </div>
                            {evtTicketTypes.length > 1 && (
                              <button onClick={() => { const arr = evtTicketTypes.filter((_, i) => i !== idx); setEvtTicketTypes(arr); }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-300 hover:text-red-500 hover:bg-red-50 transition shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-neutral-400 block mb-1">Prix ({devise})</label>
                              <input type="number" inputMode="numeric" value={ticket.prix} onChange={(e) => { const arr = [...evtTicketTypes]; arr[idx] = {...arr[idx], prix: e.target.value}; setEvtTicketTypes(arr); }}
                                placeholder="0 = gratuit"
                                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm font-medium text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-neutral-400 transition" />
                            </div>
                            <div>
                              <label className="text-xs text-neutral-400 block mb-1">Quantité</label>
                              <input type="number" inputMode="numeric" value={ticket.qty} onChange={(e) => { const arr = [...evtTicketTypes]; arr[idx] = {...arr[idx], qty: e.target.value}; setEvtTicketTypes(arr); }}
                                placeholder="100"
                                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm font-medium text-neutral-900 text-center placeholder:text-neutral-300 outline-none focus:border-neutral-400 transition" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => { setEvtTicketTypes([...evtTicketTypes, {nom: "", prix: "", qty: "100"}]); hapticLight(); }}
                      className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-400 py-2.5 rounded-lg border border-dashed border-neutral-200 hover:border-neutral-300 hover:text-neutral-600 transition">
                      <Plus className="w-3.5 h-3.5" /> Ajouter un type de billet
                    </button>
                  </div>
                  )}

                  {/* Description */}
                  {createStep === 1 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium text-neutral-700 block mb-1.5">Description <span className="text-neutral-300 font-normal">(optionnel)</span></label>
                    <textarea value={evtDesc} onChange={(e) => setEvtDesc(e.target.value)} rows={2} placeholder="Présentez votre événement en quelques mots..."
                      className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition resize-none" />
                  </div>
                  )}

                  {createStep === 4 && (
                    <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                      <p className="text-sm font-bold text-neutral-900 mb-3">Prêt à publier</p>
                      <div className="space-y-2 text-xs text-neutral-600">
                        <div className="flex items-center justify-between"><span>Informations</span><span className={eventInfoValid ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{eventInfoValid ? "OK" : "À compléter"}</span></div>
                        <div className="flex items-center justify-between"><span>Billets</span><span className={ticketsValid ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{ticketsValid ? "OK" : "À corriger"}</span></div>
                        <div className="flex items-center justify-between"><span>Visuels</span><span className={visualsValid ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{visualsValid ? "OK" : "À ajouter"}</span></div>
                      </div>
                      <p className="text-[11px] text-blue-700 mt-4">La billetterie sera publiée uniquement après création et upload réussi des images.</p>
                    </div>
                  )}

                  {/* Wizard Actions */}
                  <div className="flex gap-2">
                    {createStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setCreateStep((Math.max(1, createStep - 1) as 1 | 2 | 3 | 4))}
                        className="px-4 py-2.5 rounded-lg font-medium text-sm border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition"
                      >
                        Retour
                      </button>
                    )}
                    {createStep < 4 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!canGoNext) {
                            showToast("error", "Étape incomplète", "Complétez les champs requis pour continuer");
                            return;
                          }
                          setCreateStep((Math.min(4, createStep + 1) as 1 | 2 | 3 | 4));
                        }}
                        disabled={!canGoNext}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-30 active:scale-[0.98] bg-neutral-900 text-white hover:bg-neutral-800"
                      >
                        Continuer
                      </button>
                    ) : (
                      <button onClick={handleCreateEvent} disabled={savingEvent || !eventInfoValid || !ticketsValid || !visualsValid}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-30 active:scale-[0.98] bg-neutral-900 text-white hover:bg-neutral-800"
                      >
                        {savingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {savingEvent ? "Publication..." : "Publier la billetterie"}
                      </button>
                    )}
                  </div>

                    </div>{/* END form fields */}

                    {/* ── RIGHT: Live Ticket Preview ── */}
                    <div className={`lg:w-[340px] shrink-0 lg:sticky lg:top-4 lg:self-start ${showTicketPreview ? "" : "hidden lg:block"}`}>
                      <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100">
                        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Eye className="w-3 h-3" /> Aperçu en direct
                        </p>

                        {/* Ticket Card */}
                        <div className="bg-white rounded-xl overflow-hidden shadow-lg shadow-neutral-200/60 border border-neutral-100">
                          {/* Cover area */}
                          <div className="relative h-36 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
                            {evtCoverPreview ? (
                              <img src={evtCoverPreview} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                  <ImagePlus className="w-6 h-6 text-neutral-300 mx-auto mb-1" />
                                  <p className="text-[10px] text-neutral-300">Cover image</p>
                                </div>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                            {/* Logo overlay */}
                            <div className="absolute bottom-3 left-3 flex items-end gap-2.5">
                              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 overflow-hidden flex items-center justify-center shadow-sm">
                                {evtLogoPreview ? (
                                  <img src={evtLogoPreview} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Star className="w-4 h-4 text-white/60" />
                                )}
                              </div>
                              <div className="pb-0.5">
                                <p className="text-white text-xs font-bold leading-tight drop-shadow-sm line-clamp-1">
                                  {evtNom || "Nom de l'événement"}
                                </p>
                                <p className="text-white/70 text-[9px] drop-shadow-sm">
                                  {boutique?.nom || "Organisateur"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Ticket info */}
                          <div className="px-4 py-3.5">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-neutral-900 leading-snug line-clamp-2">
                                  {evtNom || "Nom de l'événement"}
                                </h4>
                                <div className="mt-2 space-y-1">
                                  {evtDateDebut && (
                                    <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                                      <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
                                      {new Date(evtDateDebut + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                                      {evtHeureDebut ? ` · ${evtHeureDebut.slice(0, 5)}` : ""}
                                    </p>
                                  )}
                                  {evtLieu && (
                                    <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                                      <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                                      <span className="truncate">{evtLieu}{evtVille ? `, ${evtVille}` : ""}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Dotted separator */}
                            <div className="border-t border-dashed border-neutral-200 my-3 relative">
                              <div className="absolute -left-6 -top-2.5 w-5 h-5 rounded-full bg-neutral-50" />
                              <div className="absolute -right-6 -top-2.5 w-5 h-5 rounded-full bg-neutral-50" />
                            </div>

                            {/* QR + Ticket info */}
                            <div className="flex items-center gap-3">
                              <div className="bg-white p-1.5 rounded-lg border border-neutral-100 shadow-sm shrink-0">
                                <QRCodeSVG
                                  value={evtNom ? `BINQ-PREVIEW-${evtNom.slice(0, 20)}` : "BINQ-TICKET-PREVIEW"}
                                  size={64}
                                  level="M"
                                  bgColor="transparent"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-0.5">Billet</p>
                                <p className="text-xs font-bold text-neutral-900 truncate">
                                  {evtTicketTypes[0]?.nom || "Standard"}
                                </p>
                                <p className="text-xs font-bold text-blue-600 mt-0.5">
                                  {evtTicketTypes[0]?.prix ? formatMontant(parseFloat(evtTicketTypes[0].prix), devise) : "Gratuit"}
                                </p>
                                <p className="text-[9px] text-neutral-300 mt-1 font-mono">
                                  BINQ-XXXX-XXXX
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Bottom branding */}
                          <div className="bg-neutral-50 px-4 py-2 flex items-center justify-between border-t border-neutral-100">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
                                <QrCode className="w-2 h-2 text-white" />
                              </div>
                              <span className="text-[10px] font-semibold text-neutral-400">Binq</span>
                            </div>
                            <span className="text-[9px] text-neutral-300">Powered by Binq</span>
                          </div>
                        </div>

                        {/* Ticket types preview */}
                        {evtTicketTypes.length > 1 && (
                          <div className="mt-3 space-y-1.5">
                            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Types de billets</p>
                            {evtTicketTypes.map((t, i) => (
                              <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-neutral-100">
                                <div className="flex items-center gap-2">
                                  <Ticket className="w-3 h-3 text-neutral-400" />
                                  <span className="text-xs font-medium text-neutral-700">{t.nom || `Type ${i + 1}`}</span>
                                </div>
                                <span className="text-xs font-bold text-blue-600">
                                  {t.prix ? formatMontant(parseFloat(t.prix), devise) : "Gratuit"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-[10px] text-neutral-300 text-center mt-4">
                          Aperçu en temps réel du billet
                        </p>
                      </div>
                    </div>{/* END preview panel */}

                  </div>{/* END flex container */}
                </div>
              )}

              {/* Event List */}
              {loadingEvents ? (
                <div className="text-center py-12"><Loader2 className="w-5 h-5 text-neutral-300 animate-spin mx-auto" /></div>
              ) : events.length === 0 && !showAddEvent ? (
                <div className="flex flex-col items-center justify-center py-20 px-6">
                  <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-5">
                    <Ticket className="w-7 h-7 text-neutral-300" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 mb-1">Aucune billetterie</h3>
                  <p className="text-sm text-neutral-400 text-center max-w-[260px] mb-6">Créez votre première billetterie et commencez à vendre en quelques secondes</p>
                  <button
                    onClick={() => { hapticMedium(); setCreateStep(1); setShowAddEvent(true); }}
                    className="flex items-center justify-center gap-2 bg-neutral-900 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition hover:bg-neutral-800 active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" /> Créer une billetterie
                  </button>
                </div>
              ) : (
                <>
                {/* Search */}
                {events.length > 1 && (
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                    <input
                      type="text"
                      placeholder="Rechercher une billetterie..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border border-neutral-200 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition"
                    />
                  </div>
                )}
                <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
                  {events.filter((evt: any) => !searchQuery.trim() || evt.nom.toLowerCase().includes(searchQuery.toLowerCase()) || (evt.lieu && evt.lieu.toLowerCase().includes(searchQuery.toLowerCase())) || (evt.ville && evt.ville.toLowerCase().includes(searchQuery.toLowerCase()))).map((evt: any) => {
                    const evtDate = new Date(evt.date_debut + "T00:00:00");
                    const now = new Date();
                    const isPast = evtDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const isToday = evtDate.toDateString() === now.toDateString();
                    const totalCap = evt.ticket_types?.reduce((a: number, t: any) => a + t.quantite_total, 0) || 1;
                    const fillPct = Math.round(((evt.total_vendu || 0) / totalCap) * 100);
                    const status = getEventStatus(evt);
                    const revenue = parseFloat(evt.revenus) || 0;
                    const remaining = Math.max(totalCap - (evt.total_vendu || 0), 0);
                    return (
                      <div
                        key={evt.id}
                        className={`w-full bg-white border border-neutral-200 rounded-2xl overflow-hidden text-left hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all group ${isPast ? "opacity-75 hover:opacity-100" : ""}`}
                      >
                        {/* Cover */}
                        <button type="button" onClick={() => openEventDetails(evt)} className="w-full text-left block">
                          <div className="relative h-32 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
                            {evt.cover_url ? (
                              <img src={evt.cover_url} alt="" className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isPast ? "grayscale-[30%]" : ""}`} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Calendar className="w-8 h-8 text-blue-200" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                            <div className="absolute top-3 left-3 flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full ${status.tone}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                {status.label}
                              </span>
                            </div>
                            <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3">
                              {evt.logo_url && (
                                <img src={evt.logo_url} alt="" className={`w-11 h-11 rounded-xl object-cover border border-white/40 shadow-sm shrink-0 ${isPast ? "grayscale-[30%]" : ""}`} />
                              )}
                              <div className="min-w-0 flex-1">
                                <h3 className="text-white text-base font-black leading-tight truncate drop-shadow-sm">{evt.nom}</h3>
                                <p className="text-white/75 text-xs truncate mt-1">{evt.lieu}{evt.ville ? ` · ${evt.ville}` : ""}</p>
                              </div>
                            </div>
                          </div>
                        </button>

                        <div className="p-4">
                          <button type="button" onClick={() => openEventDetails(evt)} className="w-full text-left">
                            <div className="flex items-center justify-between gap-3 text-xs text-neutral-500 mb-3">
                              <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500" />{evtDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}{evt.heure_debut ? ` · ${evt.heure_debut.slice(0, 5)}` : ""}</span>
                              <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0 group-hover:text-blue-500 transition" />
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="rounded-xl bg-neutral-50 px-2.5 py-2">
                                <p className="text-[10px] text-neutral-400 font-bold uppercase">Vendus</p>
                                <p className="text-sm font-black text-neutral-900">{evt.total_vendu || 0}</p>
                              </div>
                              <div className="rounded-xl bg-neutral-50 px-2.5 py-2">
                                <p className="text-[10px] text-neutral-400 font-bold uppercase">Restants</p>
                                <p className="text-sm font-black text-neutral-900">{remaining}</p>
                              </div>
                              <div className="rounded-xl bg-neutral-50 px-2.5 py-2">
                                <p className="text-[10px] text-neutral-400 font-bold uppercase">Revenus</p>
                                <p className="text-sm font-black text-neutral-900 truncate">{formatMontant(revenue, devise)}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                              <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(fillPct, 100)}%` }} />
                              </div>
                              <span className="text-xs font-black text-neutral-700">{fillPct}%</span>
                            </div>
                          </button>

                          <div className="grid grid-cols-3 gap-2 border-t border-neutral-100 pt-3">
                            <button
                              type="button"
                              onClick={() => handleShareEvent(evt)}
                              disabled={!evt.is_published}
                              className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              <Share2 className="w-3.5 h-3.5" /> Partager
                            </button>
                            <button
                              type="button"
                              onClick={() => { setScanMode(true); setScanResult(null); setScanCode(""); hapticMedium(); setTimeout(() => startCamera(), 300); }}
                              className="flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition"
                            >
                              <ScanLine className="w-3.5 h-3.5" /> Scanner
                            </button>
                            <a
                              href={`/evenement/${evt.id}`}
                              target="_blank"
                              onClick={(e) => { if (!evt.is_published) e.preventDefault(); }}
                              className={`flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-2 text-xs font-bold transition ${evt.is_published ? "text-neutral-600 hover:bg-neutral-50" : "text-neutral-300 cursor-not-allowed"}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Voir
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: SETTINGS ═══ */}
      {activeTab === "reglages" && (
        <div className="px-4 lg:max-w-xl lg:mx-auto">
          <h2 className="text-lg font-semibold text-neutral-900 mb-5">Settings</h2>

          <div className="border border-neutral-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                {boutique.logo_url ? (
                  <img src={boutique.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-5 h-5 text-neutral-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 truncate">{boutique.nom}</p>
                <p className="text-xs text-neutral-400 truncate">binq.app/{boutique.slug}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Logo</label>
                <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUploadLogo} className="hidden" />
                <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
                  className="w-full flex items-center justify-center gap-2 border border-neutral-200 rounded-lg py-2.5 text-sm text-neutral-600 font-medium hover:border-neutral-300 transition disabled:opacity-50"
                >
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {boutique.logo_url ? "Change logo" : "Add logo"}
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Cover photo</label>
                <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUploadBanner} className="hidden" />
                {boutique.banner_url && (
                  <img src={boutique.banner_url} alt="" className="w-full h-20 object-cover rounded-lg mb-2 border border-neutral-200" />
                )}
                <button onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner}
                  className="w-full flex items-center justify-center gap-2 border border-neutral-200 rounded-lg py-2.5 text-sm text-neutral-600 font-medium hover:border-neutral-300 transition disabled:opacity-50"
                >
                  {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  {boutique.banner_url ? "Change cover" : "Add cover"}
                </button>
              </div>
            </div>
          </div>

          {/* QR */}
          <div className="border border-neutral-200 rounded-xl p-5 mb-4 text-center">
            <p className="text-sm font-medium text-neutral-900 mb-3">Your QR Code</p>
            <div className="inline-block bg-white p-3 rounded-xl border border-neutral-100">
              <QRCodeSVG value={boutiqueUrl} size={140} level="H" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={async () => {
                await navigator.clipboard.writeText(boutiqueUrl);
                setCopied(true); setTimeout(() => setCopied(false), 2000);
                showToast("success", "Copied", "Link copied");
              }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2.5 rounded-lg text-xs font-medium transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy link"}
              </button>
              <button onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-900 text-white py-2.5 rounded-lg text-xs font-medium hover:bg-neutral-800 transition"
              ><Share2 className="w-3.5 h-3.5" />Share</button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              {[
                { name: "WhatsApp", color: "bg-neutral-50 text-neutral-700 hover:bg-neutral-100", platform: "whatsapp" },
                { name: "Facebook", color: "bg-neutral-50 text-neutral-700 hover:bg-neutral-100", platform: "facebook" },
                { name: "X", color: "bg-neutral-50 text-neutral-700 hover:bg-neutral-100", platform: "twitter" },
                { name: "Telegram", color: "bg-neutral-50 text-neutral-700 hover:bg-neutral-100", platform: "telegram" },
              ].map((s) => (
                <button key={s.platform} onClick={() => {
                  const text = encodeURIComponent("Découvre mes événements sur Binq");
                  const url = encodeURIComponent(boutiqueUrl);
                  const urls: Record<string, string> = {
                    whatsapp: `https://wa.me/?text=${text}%20${url}`,
                    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
                    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
                  };
                  window.open(urls[s.platform], "_blank");
                }} className={`py-2 rounded-lg text-[11px] font-medium transition ${s.color}`}>{s.name}</button>
              ))}
            </div>
          </div>

          <Link href={`/boutique/${boutique.slug}`} target="_blank"
            className="w-full py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition"
          ><ExternalLink className="w-4 h-4" />View public page</Link>
        </div>
      )}
    </div>
  );
}
