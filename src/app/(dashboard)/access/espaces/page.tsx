"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import AccessLayout from "@/components/AccessLayout";
import { hapticSuccess, hapticError, hapticMedium } from "@/lib/haptics";
import {
  MapPin,
  Plus,
  X,
  Pencil,
  Trash2,
  Clock,
  CalendarDays,
  Users,
  ToggleLeft,
  ToggleRight,
  QrCode,
  ScanLine,
  Shield,
  Copy,
  Check,
  Printer,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Space {
  id: string;
  nom: string;
  adresse: string | null;
  horaire_debut: string;
  horaire_fin: string;
  jours_actifs: string[];
  actif: boolean;
  mode: string;
  space_code: string | null;
  created_at: string;
  access_members: { count: number }[];
}

const JOURS = [
  { key: "lundi", label: "Lun" },
  { key: "mardi", label: "Mar" },
  { key: "mercredi", label: "Mer" },
  { key: "jeudi", label: "Jeu" },
  { key: "vendredi", label: "Ven" },
  { key: "samedi", label: "Sam" },
  { key: "dimanche", label: "Dim" },
];

const DEFAULT_FORM = {
  nom: "",
  adresse: "",
  horaire_debut: "08:00",
  horaire_fin: "18:00",
  jours_actifs: ["lundi", "mardi", "mercredi", "jeudi", "vendredi"],
  mode: "controle" as string,
};

export default function EspacesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<Space | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchSpaces = async () => {
    const r = await fetch("/api/access/spaces");
    const data = await r.json();
    setSpaces(data.spaces || []);
  };

  useEffect(() => {
    if (!user) return;
    fetchSpaces().finally(() => setLoading(false));
  }, [user]);

  const openCreate = () => {
    hapticMedium();
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowModal(true);
  };

  const openEdit = (space: Space) => {
    hapticMedium();
    setEditingId(space.id);
    setForm({
      nom: space.nom,
      adresse: space.adresse || "",
      horaire_debut: space.horaire_debut,
      horaire_fin: space.horaire_fin,
      jours_actifs: space.jours_actifs,
      mode: space.mode || "controle",
    });
    setShowModal(true);
  };

  const copyPointeuseLink = (code: string) => {
    const url = `${window.location.origin}/binq-access/pointeuse/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    hapticSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!form.nom.trim()) {
      showToast("error", "Nom requis");
      return;
    }
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...form } : form;
      const r = await fetch("/api/access/spaces", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
      hapticSuccess();
      showToast("success", editingId ? "Espace modifié" : "Espace créé");
      setShowModal(false);
      await fetchSpaces();
    } catch {
      hapticError();
      showToast("error", "Erreur", "Impossible d'enregistrer l'espace");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const r = await fetch(`/api/access/spaces?id=${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      hapticSuccess();
      showToast("success", "Espace supprimé");
      await fetchSpaces();
    } catch {
      hapticError();
      showToast("error", "Erreur", "Impossible de supprimer l'espace");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (space: Space) => {
    try {
      const r = await fetch("/api/access/spaces", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: space.id, actif: !space.actif }),
      });
      if (!r.ok) throw new Error();
      hapticSuccess();
      showToast("success", space.actif ? "Espace désactivé" : "Espace activé");
      await fetchSpaces();
    } catch {
      hapticError();
      showToast("error", "Erreur");
    }
  };

  const toggleJour = (jour: string) => {
    setForm((prev) => ({
      ...prev,
      jours_actifs: prev.jours_actifs.includes(jour)
        ? prev.jours_actifs.filter((j) => j !== jour)
        : [...prev.jours_actifs, jour],
    }));
  };

  if (loading) {
    return (
      <AccessLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-7 h-7 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AccessLayout>
    );
  }

  return (
    <AccessLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-black text-gray-900">Espaces</h2>
          <p className="text-[13px] text-gray-500">{spaces.length} espace{spaces.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-emerald-500 text-white text-[13px] font-bold px-4 py-2.5 rounded-2xl active:scale-[0.97] transition-transform shadow-lg shadow-emerald-500/25"
        >
          <Plus className="w-4 h-4" />
          Nouveau
        </button>
      </div>

      {/* List */}
      {spaces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-[16px] font-bold text-gray-900 mb-1">Aucun espace</p>
          <p className="text-[13px] text-gray-500 mb-4">
            Créez votre premier espace pour commencer le contrôle d&apos;accès.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-emerald-500 text-white text-[14px] font-bold px-5 py-2.5 rounded-2xl active:scale-[0.97] transition-transform shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4" />
            Créer un espace
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-gray-900">{space.nom}</p>
                    {space.adresse && (
                      <p className="text-[12px] text-gray-500">{space.adresse}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(space)}
                  className="active:scale-[0.95] transition-transform"
                >
                  {space.actif ? (
                    <ToggleRight className="w-7 h-7 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-gray-300" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg ${
                  (space.mode || "controle") === "pointeuse"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}>
                  {(space.mode || "controle") === "pointeuse" ? (
                    <><QrCode className="w-3 h-3" /> Pointeuse</>
                  ) : (
                    <><Shield className="w-3 h-3" /> Contrôlé</>
                  )}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                  <Users className="w-3 h-3" />
                  {space.access_members?.[0]?.count || 0} membres
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                  <Clock className="w-3 h-3" />
                  {space.horaire_debut} - {space.horaire_fin}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                  <CalendarDays className="w-3 h-3" />
                  {space.jours_actifs
                    .map((j) => JOURS.find((d) => d.key === j)?.label)
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>

              {/* Pointeuse QR button */}
              {(space.mode || "controle") === "pointeuse" && space.space_code && (
                <button
                  onClick={() => { hapticMedium(); setShowQR(space); }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 text-[13px] font-semibold py-2.5 rounded-xl mb-3 active:scale-[0.97] transition-transform"
                >
                  <QrCode className="w-4 h-4" />
                  Voir le QR pointeuse
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(space)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-gray-600 bg-gray-100 py-2 rounded-xl active:scale-[0.97] transition-transform"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(space.id)}
                  disabled={deletingId === space.id}
                  className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-red-500 bg-red-50 px-4 py-2 rounded-xl active:scale-[0.97] transition-transform disabled:opacity-50"
                >
                  {deletingId === space.id ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 animate-slide-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-black text-gray-900">
                {editingId ? "Modifier l'espace" : "Nouvel espace"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Mode */}
              <div>
                <label className="text-[13px] font-semibold text-gray-700 mb-2 block">
                  Mode de fonctionnement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, mode: "controle" })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.mode === "controle"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Shield className={`w-5 h-5 mb-1.5 ${form.mode === "controle" ? "text-emerald-600" : "text-gray-400"}`} />
                    <p className={`text-[13px] font-bold ${form.mode === "controle" ? "text-emerald-700" : "text-gray-700"}`}>Contrôlé</p>
                    <p className="text-[11px] text-gray-500">Un gardien scanne les badges</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, mode: "pointeuse" })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.mode === "pointeuse"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <QrCode className={`w-5 h-5 mb-1.5 ${form.mode === "pointeuse" ? "text-blue-600" : "text-gray-400"}`} />
                    <p className={`text-[13px] font-bold ${form.mode === "pointeuse" ? "text-blue-700" : "text-gray-700"}`}>Pointeuse</p>
                    <p className="text-[11px] text-gray-500">Self-service avec PIN</p>
                  </button>
                </div>
              </div>

              {/* Nom */}
              <div>
                <label className="text-[13px] font-semibold text-gray-700 mb-1 block">
                  Nom de l&apos;espace *
                </label>
                <input
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: Bureau principal"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Adresse */}
              <div>
                <label className="text-[13px] font-semibold text-gray-700 mb-1 block">
                  Adresse
                </label>
                <input
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  placeholder="Ex: 10 rue de la Paix, Paris"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Horaires */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 mb-1 block">
                    Ouverture
                  </label>
                  <input
                    type="time"
                    value={form.horaire_debut}
                    onChange={(e) => setForm({ ...form, horaire_debut: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 mb-1 block">
                    Fermeture
                  </label>
                  <input
                    type="time"
                    value={form.horaire_fin}
                    onChange={(e) => setForm({ ...form, horaire_fin: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Jours */}
              <div>
                <label className="text-[13px] font-semibold text-gray-700 mb-2 block">
                  Jours actifs
                </label>
                <div className="flex flex-wrap gap-2">
                  {JOURS.map((jour) => {
                    const active = form.jours_actifs.includes(jour.key);
                    return (
                      <button
                        key={jour.key}
                        type="button"
                        onClick={() => toggleJour(jour.key)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                          active
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {jour.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-6 bg-emerald-500 text-white text-[15px] font-bold py-3.5 rounded-2xl active:scale-[0.97] transition-transform shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : editingId ? (
                "Enregistrer"
              ) : (
                "Créer l'espace"
              )}
            </button>
          </div>
        </div>
      )}
      {/* QR Pointeuse Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-slide-in text-center">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-black text-gray-900">QR Pointeuse</h3>
              <button
                onClick={() => setShowQR(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className="text-[14px] font-bold text-gray-900 mb-1">{showQR.nom}</p>
            <p className="text-[12px] text-gray-500 mb-4">
              Imprimez ce QR et collez-le à l&apos;entrée. Les membres le scanneront avec leur téléphone.
            </p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-4">
              <QRCodeSVG
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/binq-access/pointeuse/${showQR.space_code}`}
                size={200}
                level="H"
                className="mx-auto"
                includeMargin
              />
            </div>

            <p className="text-[13px] font-mono font-bold text-blue-600 mb-4">
              {showQR.space_code}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => copyPointeuseLink(showQR.space_code!)}
                className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold text-gray-700 bg-gray-100 py-2.5 rounded-xl active:scale-[0.97] transition-transform"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copié !" : "Copier le lien"}
              </button>
              <a
                href={`/binq-access/pointeuse/${showQR.space_code}`}
                target="_blank"
                className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold text-white bg-blue-500 py-2.5 rounded-xl active:scale-[0.97] transition-transform shadow-lg shadow-blue-500/25"
              >
                <Printer className="w-4 h-4" />
                Ouvrir
              </a>
            </div>
          </div>
        </div>
      )}

    </AccessLayout>
  );
}
