"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  UtensilsCrossed,
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Leaf,
  AlertTriangle,
  Users,
  Calendar,
  Loader2,
  Check,
  X,
  Store,
  BadgeCheck,
  Share2,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";

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
}

interface MenuSection {
  id: string;
  nom: string;
  description: string | null;
  menu_items: MenuItem[];
}

interface Menu {
  id: string;
  nom: string;
  description: string | null;
  menu_sections: MenuSection[];
}

interface Boutique {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  ville: string | null;
  telephone: string | null;
  devise: string;
  is_verified: boolean;
}

export default function PublicMenuPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const slug = params.slug as string;

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reservation form
  const [showReservation, setShowReservation] = useState(false);
  const [rNom, setRNom] = useState("");
  const [rTel, setRTel] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPersonnes, setRPersonnes] = useState("2");
  const [rDate, setRDate] = useState("");
  const [rHeure, setRHeure] = useState("");
  const [rNotes, setRNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reserved, setReserved] = useState(false);

  // Active section (scrollspy)
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Share
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        // Fetch boutique
        const boutiqueRes = await fetch(`/api/boutiques/${slug}`);
        const boutiqueData = await boutiqueRes.json();
        if (!boutiqueRes.ok) { setError("Restaurant introuvable"); return; }
        setBoutique(boutiqueData.boutique);

        // Fetch menus
        const menuRes = await fetch(`/api/menus?boutique_id=${boutiqueData.boutique.id}`);
        const menuData = await menuRes.json();
        setMenus(menuData.menus || []);

        // Set first section active
        if (menuData.menus?.[0]?.menu_sections?.[0]) {
          setActiveSection(menuData.menus[0].menu_sections[0].id);
        }

        // Pre-fill user data if logged in
        if (user) {
          setRNom(`${user.prenom || ""} ${user.nom || ""}`.trim());
          setREmail(user.email || "");
        }
      } catch { setError("Erreur de chargement"); }
      finally { setLoading(false); }
    };
    load();
  }, [slug, user]);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRDate(tomorrow.toISOString().split("T")[0]);
    setRHeure("19:00");
  }, []);

  const handleReserve = async () => {
    if (!boutique || !rNom || !rTel || !rDate || !rHeure) {
      showToast("error", "Veuillez remplir tous les champs obligatoires");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boutique_id: boutique.id,
          client_nom: rNom,
          client_telephone: rTel,
          client_email: rEmail || null,
          nombre_personnes: rPersonnes,
          date_reservation: rDate,
          heure_reservation: rHeure,
          notes: rNotes || null,
          client_user_id: user?.id || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setReserved(true);
      showToast("success", "Réservation envoyée !");
    } catch (e: any) {
      showToast("error", e.message || "Erreur lors de la réservation");
    }
    finally { setSubmitting(false); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `${boutique?.nom} — Menu`, url }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000); } catch { /* ignore */ }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !boutique) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <Store className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-neutral-900 mb-2">Restaurant introuvable</h1>
          <button onClick={() => router.push("/explorer")} className="text-blue-500 text-sm font-medium hover:underline">
            Explorer les restaurants
          </button>
        </div>
      </div>
    );
  }

  const devise = (boutique.devise || "XOF") as DeviseCode;
  const allSections = menus.flatMap(m => m.menu_sections || []);
  const hasMenu = allSections.some(s => s.menu_items?.length > 0);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <div className="relative">
        {boutique.banner_url ? (
          <div className="h-40 sm:h-52 relative">
            <img src={boutique.banner_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="h-40 sm:h-52 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500" />
        )}

        {/* Back + Share */}
        <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
          <button onClick={() => router.back()} className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white transition">
            <ArrowLeft className="w-4 h-4 text-neutral-700" />
          </button>
          <button onClick={handleShare} className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white transition">
            {shared ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4 text-neutral-700" />}
          </button>
        </div>

        {/* Restaurant info */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 text-white z-10">
          <div className="flex items-end gap-3 max-w-2xl mx-auto">
            {boutique.logo_url ? (
              <img src={boutique.logo_url} alt="" className="w-14 h-14 rounded-xl border-2 border-white shadow-lg object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl border-2 border-white shadow-lg bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate flex items-center gap-1.5">
                {boutique.nom}
                {boutique.is_verified && <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" />}
              </h1>
              {boutique.ville && (
                <p className="text-sm text-white/80 flex items-center gap-1"><MapPin className="w-3 h-3" />{boutique.ville}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section tabs ── */}
      {allSections.length > 1 && (
        <div className="sticky top-0 z-30 bg-white border-b border-neutral-100 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 py-2">
              {allSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    activeSection === section.id
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {section.nom}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Menu content ── */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {!hasMenu ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Menu en préparation</h3>
            <p className="text-sm text-neutral-500">Le menu de ce restaurant sera bientôt disponible.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {allSections.map((section) => (
              <div key={section.id} id={`section-${section.id}`} className="scroll-mt-16">
                <h2 className="text-lg font-bold text-neutral-900 mb-1">{section.nom}</h2>
                {section.description && (
                  <p className="text-sm text-neutral-500 mb-3">{section.description}</p>
                )}
                <div className="space-y-3">
                  {section.menu_items?.filter(i => i.is_disponible).map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-xl hover:bg-neutral-50 transition group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900 text-[15px]">{item.nom}</span>
                          {item.is_vegetarien && <Leaf className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                        </div>
                        {item.description && (
                          <p className="text-sm text-neutral-500 mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                        {item.allergenes && (
                          <p className="text-[11px] text-orange-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" /> {item.allergenes}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-neutral-900 mt-1">
                          {formatMontant(item.prix, devise)}
                        </p>
                      </div>
                      {item.image_url && (
                        <img src={item.image_url} alt={item.nom} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Reservation Button (sticky) ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-100 p-4 safe-area-pb">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setShowReservation(true)}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-[15px] hover:shadow-lg hover:shadow-orange-500/25 transition flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Réserver une table
          </button>
        </div>
      </div>

      {/* ── Reservation Modal ── */}
      {showReservation && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => !submitting && setShowReservation(false)}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {reserved ? (
              /* Success */
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Réservation envoyée !</h3>
                <p className="text-sm text-neutral-500 mb-6">
                  Le restaurant va confirmer votre réservation. Vous recevrez une notification.
                </p>
                <button
                  onClick={() => { setShowReservation(false); setReserved(false); }}
                  className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition"
                >
                  Fermer
                </button>
              </div>
            ) : (
              /* Form */
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    Réserver une table
                  </h3>
                  <button onClick={() => setShowReservation(false)} className="p-1 hover:bg-neutral-100 rounded-lg transition">
                    <X className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>

                <p className="text-sm text-neutral-500">
                  Réservez votre table chez <span className="font-medium text-neutral-700">{boutique.nom}</span>
                </p>

                {/* Nom */}
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Nom complet *</label>
                  <input
                    type="text"
                    placeholder="Votre nom"
                    value={rNom}
                    onChange={(e) => setRNom(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Téléphone *</label>
                  <input
                    type="tel"
                    placeholder="+225 07 00 00 00"
                    value={rTel}
                    onChange={(e) => setRTel(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Email (optionnel)</label>
                  <input
                    type="email"
                    placeholder="email@exemple.com"
                    value={rEmail}
                    onChange={(e) => setREmail(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Date + Heure */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block">Date *</label>
                    <input
                      type="date"
                      value={rDate}
                      onChange={(e) => setRDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block">Heure *</label>
                    <input
                      type="time"
                      value={rHeure}
                      onChange={(e) => setRHeure(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Nombre de personnes */}
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Nombre de personnes *</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRPersonnes(String(Math.max(1, parseInt(rPersonnes) - 1)))}
                      className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-lg font-medium hover:bg-neutral-200 transition"
                    >
                      −
                    </button>
                    <span className="text-xl font-bold text-neutral-900 w-10 text-center">{rPersonnes}</span>
                    <button
                      onClick={() => setRPersonnes(String(Math.min(20, parseInt(rPersonnes) + 1)))}
                      className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-lg font-medium hover:bg-neutral-200 transition"
                    >
                      +
                    </button>
                    <span className="text-sm text-neutral-500 flex items-center gap-1">
                      <Users className="w-4 h-4" /> personne{parseInt(rPersonnes) > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Message au restaurant</label>
                  <textarea
                    placeholder="Allergies, occasion spéciale, préférences…"
                    value={rNotes}
                    onChange={(e) => setRNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleReserve}
                  disabled={submitting || !rNom || !rTel || !rDate || !rHeure}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-[15px] hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirmer la réservation
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom padding for sticky button */}
      <div className="h-24" />
    </div>
  );
}
