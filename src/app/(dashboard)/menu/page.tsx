"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Loader2,
  Save,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Eye,
  EyeOff,
  Leaf,
  AlertTriangle,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  X,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Sparkles,
  ClipboardList,
  Store,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";

/* ─── Types ─── */
interface MenuItem {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  devise: string;
  image_url: string | null;
  allergenes: string | null;
  is_vegetarien: boolean;
  is_disponible: boolean;
  ordre: number;
}

interface MenuSection {
  id: string;
  nom: string;
  description: string | null;
  ordre: number;
  is_active: boolean;
  menu_items: MenuItem[];
}

interface Menu {
  id: string;
  nom: string;
  description: string | null;
  is_active: boolean;
  menu_sections: MenuSection[];
}

interface Reservation {
  id: string;
  client_nom: string;
  client_telephone: string;
  client_email: string | null;
  nombre_personnes: number;
  date_reservation: string;
  heure_reservation: string;
  notes: string | null;
  statut: string;
  created_at: string;
}

interface Boutique {
  id: string;
  nom: string;
  slug: string;
  devise: string;
}

/* ─── Composant principal ─── */
export default function MenuPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"menu" | "reservations">("menu");

  // Menu creation
  const [creatingMenu, setCreatingMenu] = useState(false);

  // Section form
  const [addingSectionTo, setAddingSectionTo] = useState<string | null>(null);
  const [sectionNom, setSectionNom] = useState("");

  // Item form
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [itemNom, setItemNom] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrix, setItemPrix] = useState("");
  const [itemAllergenes, setItemAllergenes] = useState("");
  const [itemVege, setItemVege] = useState(false);

  // QR
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Saving states
  const [savingSection, setSavingSection] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reservation filter
  const [reservationDate, setReservationDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
  }), []);

  /* ─── Load data ─── */
  const loadData = useCallback(async () => {
    try {
      const meRes = await fetch("/api/boutiques/me", { headers: headers() });
      const meData = await meRes.json();
      if (!meData.boutique) { setLoading(false); return; }
      setBoutique(meData.boutique);

      const menuRes = await fetch(`/api/menus?boutique_id=${meData.boutique.id}`, { headers: headers() });
      const menuData = await menuRes.json();
      setMenus(menuData.menus || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [headers]);

  const loadReservations = useCallback(async () => {
    if (!boutique) return;
    try {
      const res = await fetch(`/api/reservations?boutique_id=${boutique.id}&date=${reservationDate}`, { headers: headers() });
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch { /* ignore */ }
  }, [boutique, reservationDate, headers]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (boutique && activeTab === "reservations") loadReservations(); }, [boutique, activeTab, reservationDate, loadReservations]);

  /* ─── Actions ─── */
  const createMenu = async () => {
    if (!boutique) return;
    setCreatingMenu(true);
    try {
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ boutique_id: boutique.id, nom: "Menu principal" }),
      });
      if (!res.ok) throw new Error();
      showToast("success", "Menu créé !");
      await loadData();
    } catch { showToast("error", "Erreur"); }
    finally { setCreatingMenu(false); }
  };

  const addSection = async (menuId: string) => {
    if (!sectionNom.trim()) return;
    setSavingSection(true);
    try {
      const res = await fetch("/api/menus/sections", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ menu_id: menuId, nom: sectionNom.trim() }),
      });
      if (!res.ok) throw new Error();
      showToast("success", "Section ajoutée");
      setSectionNom("");
      setAddingSectionTo(null);
      await loadData();
    } catch { showToast("error", "Erreur"); }
    finally { setSavingSection(false); }
  };

  const deleteSection = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/menus/sections?id=${id}`, { method: "DELETE", headers: headers() });
      if (!res.ok) throw new Error();
      showToast("success", "Section supprimée");
      await loadData();
    } catch { showToast("error", "Erreur"); }
    finally { setDeletingId(null); }
  };

  const addItem = async (sectionId: string) => {
    if (!itemNom.trim() || !itemPrix) return;
    setSavingItem(true);
    try {
      const res = await fetch("/api/menus/items", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          section_id: sectionId,
          nom: itemNom.trim(),
          description: itemDesc.trim() || null,
          prix: itemPrix,
          allergenes: itemAllergenes.trim() || null,
          is_vegetarien: itemVege,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("success", "Plat ajouté");
      setItemNom(""); setItemDesc(""); setItemPrix(""); setItemAllergenes(""); setItemVege(false);
      setAddingItemTo(null);
      await loadData();
    } catch { showToast("error", "Erreur"); }
    finally { setSavingItem(false); }
  };

  const toggleItemDisponible = async (item: MenuItem) => {
    try {
      await fetch("/api/menus/items", {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ id: item.id, is_disponible: !item.is_disponible }),
      });
      await loadData();
    } catch { showToast("error", "Erreur"); }
  };

  const deleteItem = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/menus/items?id=${id}`, { method: "DELETE", headers: headers() });
      if (!res.ok) throw new Error();
      showToast("success", "Plat supprimé");
      await loadData();
    } catch { showToast("error", "Erreur"); }
    finally { setDeletingId(null); }
  };

  const updateReservationStatus = async (id: string, statut: string) => {
    try {
      const res = await fetch("/api/reservations", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ id, statut }),
      });
      if (!res.ok) throw new Error();
      showToast("success", statut === "confirmee" ? "Réservation confirmée" : "Réservation annulée");
      await loadReservations();
    } catch { showToast("error", "Erreur"); }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const menuUrl = boutique
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/boutique/${boutique.slug}/menu`
    : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  /* ─── Render ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!boutique) {
    return (
      <div className="text-center py-20">
        <Store className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">Aucune boutique</h2>
        <p className="text-neutral-500 text-sm mb-6">Créez d&apos;abord votre boutique dans Ma Boutique.</p>
        <a href="/ma-boutique" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition">
          <Store className="w-4 h-4" /> Ma Boutique
        </a>
      </div>
    );
  }

  const devise = (boutique.devise || "XOF") as DeviseCode;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-500" />
            Menu & Réservations
          </h1>
          <p className="text-sm text-neutral-500 mt-1">{boutique.nom}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition"
          >
            <QrCode className="w-4 h-4" />
            QR Menu
          </button>
          <a
            href={`/boutique/${boutique.slug}/menu`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition"
          >
            <ExternalLink className="w-4 h-4" />
            Voir
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("menu")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === "menu" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Menu
        </button>
        <button
          onClick={() => setActiveTab("reservations")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === "reservations" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Réservations
          {reservations.filter(r => r.statut === "en_attente").length > 0 && (
            <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">
              {reservations.filter(r => r.statut === "en_attente").length}
            </span>
          )}
        </button>
      </div>

      {/* ══════ MENU TAB ══════ */}
      {activeTab === "menu" && (
        <div className="space-y-4">
          {menus.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-2xl">
              <UtensilsCrossed className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Créez votre menu</h3>
              <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
                Ajoutez vos plats, boissons et desserts. Vos clients pourront consulter votre menu via un QR code et réserver une table.
              </p>
              <button
                onClick={createMenu}
                disabled={creatingMenu}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {creatingMenu ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Créer mon menu
              </button>
            </div>
          ) : (
            menus.map((menu) => (
              <div key={menu.id} className="space-y-3">
                {/* Sections */}
                {menu.menu_sections.map((section) => (
                  <div key={section.id} className="border border-neutral-200 rounded-xl overflow-hidden">
                    {/* Section header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="w-4 h-4 text-neutral-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        )}
                        <span className="font-semibold text-neutral-900">{section.nom}</span>
                        <span className="text-xs text-neutral-400">{section.menu_items?.length || 0} plats</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-neutral-400 hover:text-red-500 transition"
                      >
                        {deletingId === section.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </button>

                    {/* Items */}
                    {expandedSections.has(section.id) && (
                      <div className="divide-y divide-neutral-100">
                        {section.menu_items?.map((item) => (
                          <div key={item.id} className={`flex items-start gap-3 px-4 py-3 ${!item.is_disponible ? "opacity-50" : ""}`}>
                            {item.image_url && (
                              <img src={item.image_url} alt={item.nom} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-neutral-900 text-sm">{item.nom}</span>
                                {item.is_vegetarien && <Leaf className="w-3.5 h-3.5 text-green-500" />}
                                {!item.is_disponible && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium">Indisponible</span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{item.description}</p>
                              )}
                              {item.allergenes && (
                                <p className="text-[10px] text-orange-600 mt-0.5 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> {item.allergenes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-semibold text-neutral-900">
                                {formatMontant(item.prix, devise)}
                              </span>
                              <button
                                onClick={() => toggleItemDisponible(item)}
                                className="p-1.5 rounded-lg hover:bg-neutral-100 transition"
                                title={item.is_disponible ? "Marquer indisponible" : "Marquer disponible"}
                              >
                                {item.is_disponible ? (
                                  <Eye className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                                )}
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-neutral-400 hover:text-red-500 transition"
                              >
                                {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add item */}
                        {addingItemTo === section.id ? (
                          <div className="px-4 py-3 space-y-3 bg-blue-50/50">
                            <input
                              type="text"
                              placeholder="Nom du plat *"
                              value={itemNom}
                              onChange={(e) => setItemNom(e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Description (optionnel)"
                              value={itemDesc}
                              onChange={(e) => setItemDesc(e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder="Prix *"
                                value={itemPrix}
                                onChange={(e) => setItemPrix(e.target.value)}
                                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                type="text"
                                placeholder="Allergènes"
                                value={itemAllergenes}
                                onChange={(e) => setItemAllergenes(e.target.value)}
                                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={itemVege}
                                  onChange={(e) => setItemVege(e.target.checked)}
                                  className="rounded border-neutral-300 text-green-500 focus:ring-green-500"
                                />
                                <Leaf className="w-3.5 h-3.5 text-green-500" /> Végétarien
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => addItem(section.id)}
                                disabled={savingItem || !itemNom.trim() || !itemPrix}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50"
                              >
                                {savingItem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                Ajouter
                              </button>
                              <button
                                onClick={() => { setAddingItemTo(null); setItemNom(""); setItemDesc(""); setItemPrix(""); setItemAllergenes(""); setItemVege(false); }}
                                className="px-4 py-2 text-neutral-500 hover:text-neutral-700 text-sm transition"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddingItemTo(section.id); setItemNom(""); setItemDesc(""); setItemPrix(""); setItemAllergenes(""); setItemVege(false); }}
                            className="w-full px-4 py-3 text-sm text-blue-500 hover:bg-blue-50 transition flex items-center gap-2 font-medium"
                          >
                            <Plus className="w-4 h-4" /> Ajouter un plat
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add section */}
                {addingSectionTo === menu.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nom de la section (ex: Entrées, Plats, Desserts…)"
                      value={sectionNom}
                      onChange={(e) => setSectionNom(e.target.value)}
                      autoFocus
                      className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => { if (e.key === "Enter") addSection(menu.id); }}
                    />
                    <button
                      onClick={() => addSection(menu.id)}
                      disabled={savingSection || !sectionNom.trim()}
                      className="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50"
                    >
                      {savingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ajouter"}
                    </button>
                    <button
                      onClick={() => { setAddingSectionTo(null); setSectionNom(""); }}
                      className="p-2.5 text-neutral-400 hover:text-neutral-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingSectionTo(menu.id)}
                    className="w-full py-3 border-2 border-dashed border-neutral-200 rounded-xl text-sm text-neutral-500 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus className="w-4 h-4" /> Ajouter une section
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════ RESERVATIONS TAB ══════ */}
      {activeTab === "reservations" && (
        <div className="space-y-4">
          {/* Date filter */}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <input
              type="date"
              value={reservationDate}
              onChange={(e) => setReservationDate(e.target.value)}
              className="px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-neutral-500">
              {reservations.length} réservation{reservations.length !== 1 ? "s" : ""}
            </span>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Aucune réservation</h3>
              <p className="text-sm text-neutral-500">
                Pas de réservation pour le {new Date(reservationDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((r) => (
                <div key={r.id} className="border border-neutral-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-neutral-900">{r.client_nom}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          r.statut === "confirmee" ? "bg-green-100 text-green-700" :
                          r.statut === "en_attente" ? "bg-orange-100 text-orange-700" :
                          r.statut === "annulee" ? "bg-red-100 text-red-700" :
                          "bg-neutral-100 text-neutral-600"
                        }`}>
                          {r.statut === "confirmee" ? "Confirmée" :
                           r.statut === "en_attente" ? "En attente" :
                           r.statut === "annulee" ? "Annulée" : "Terminée"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {r.heure_reservation}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {r.nombre_personnes} pers.
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {r.client_telephone}
                        </span>
                        {r.client_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {r.client_email}
                          </span>
                        )}
                      </div>
                      {r.notes && <p className="text-xs text-neutral-500 mt-1 italic">&quot;{r.notes}&quot;</p>}
                    </div>

                    {r.statut === "en_attente" && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateReservationStatus(r.id, "confirmee")}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => updateReservationStatus(r.id, "annulee")}
                          className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-medium hover:bg-red-100 hover:text-red-600 transition"
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                    {r.statut === "confirmee" && (
                      <button
                        onClick={() => updateReservationStatus(r.id, "terminee")}
                        className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-medium hover:bg-neutral-200 transition shrink-0"
                      >
                        Terminée
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════ QR MODAL ══════ */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">QR Code Menu</h3>
              <button onClick={() => setShowQR(false)} className="p-1 hover:bg-neutral-100 rounded-lg transition">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <p className="text-sm text-neutral-500">
              Imprimez ce QR code et placez-le sur vos tables. Vos clients pourront scanner pour voir votre menu et réserver.
            </p>

            <div className="flex justify-center p-6 bg-neutral-50 rounded-xl">
              <QRCodeSVG
                value={menuUrl}
                size={200}
                level="H"
                includeMargin
                imageSettings={{
                  src: "/icons/icon-192x192.png",
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={menuUrl}
                className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-600 truncate"
              />
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copié" : "Copier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
