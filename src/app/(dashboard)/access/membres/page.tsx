"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import AccessLayout from "@/components/AccessLayout";
import { hapticSuccess, hapticError, hapticMedium } from "@/lib/haptics";
import {
  Users,
  Plus,
  X,
  Pencil,
  Trash2,
  QrCode,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Download,
  Copy,
  Check,
  UserCircle2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Member {
  id: string;
  space_id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  role: string;
  qr_code: string;
  actif: boolean;
  date_debut: string | null;
  date_fin: string | null;
  created_at: string;
  access_spaces: { nom: string };
}

interface Space {
  id: string;
  nom: string;
  access_members: { count: number }[];
}

const ROLES = [
  { value: "employé", label: "Employé" },
  { value: "visiteur", label: "Visiteur" },
  { value: "VIP", label: "VIP" },
];

const DEFAULT_FORM = {
  space_id: "",
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  role: "employé",
  date_debut: "",
  date_fin: "",
};

export default function MembresPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterSpace, setFilterSpace] = useState("");
  const [search, setSearch] = useState("");
  const [showBadge, setShowBadge] = useState<Member | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchMembers = async () => {
    const url = filterSpace
      ? `/api/access/members?space_id=${filterSpace}`
      : "/api/access/members";
    const r = await fetch(url);
    const data = await r.json();
    setMembers(data.members || []);
  };

  const fetchSpaces = async () => {
    const r = await fetch("/api/access/spaces");
    const data = await r.json();
    setSpaces(data.spaces || []);
  };

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchMembers(), fetchSpaces()]).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchMembers();
  }, [filterSpace]);

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.nom.toLowerCase().includes(q) ||
      m.prenom.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.qr_code.toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    hapticMedium();
    setEditingId(null);
    setForm({ ...DEFAULT_FORM, space_id: filterSpace || (spaces[0]?.id ?? "") });
    setShowModal(true);
  };

  const openEdit = (m: Member) => {
    hapticMedium();
    setEditingId(m.id);
    setForm({
      space_id: m.space_id,
      nom: m.nom,
      prenom: m.prenom,
      email: m.email || "",
      telephone: m.telephone || "",
      role: m.role,
      date_debut: m.date_debut || "",
      date_fin: m.date_fin || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim() || !form.prenom.trim() || !form.space_id) {
      showToast("error", "Champs requis", "Nom, prénom et espace sont obligatoires");
      return;
    }
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...form } : form;
      const r = await fetch("/api/access/members", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
      hapticSuccess();
      showToast("success", editingId ? "Membre modifié" : "Membre ajouté");
      setShowModal(false);
      await fetchMembers();
    } catch {
      hapticError();
      showToast("error", "Erreur", "Impossible d'enregistrer le membre");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const r = await fetch(`/api/access/members?id=${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      hapticSuccess();
      showToast("success", "Membre supprimé");
      await fetchMembers();
    } catch {
      hapticError();
      showToast("error", "Erreur");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (m: Member) => {
    try {
      const r = await fetch("/api/access/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, actif: !m.actif }),
      });
      if (!r.ok) throw new Error();
      hapticSuccess();
      showToast("success", m.actif ? "Badge désactivé" : "Badge activé");
      await fetchMembers();
    } catch {
      hapticError();
      showToast("error", "Erreur");
    }
  };

  const copyBadgeLink = (code: string) => {
    const url = `${window.location.origin}/binq-access/badge/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    hapticSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "VIP":
        return "bg-amber-50 text-amber-600";
      case "visiteur":
        return "bg-blue-50 text-blue-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-black text-gray-900">Membres</h2>
          <p className="text-[13px] text-gray-500">{members.length} membre{members.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openCreate}
          disabled={spaces.length === 0}
          className="flex items-center gap-1.5 bg-emerald-500 text-white text-[13px] font-bold px-4 py-2.5 rounded-2xl active:scale-[0.97] transition-transform shadow-lg shadow-emerald-500/25 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Nouveau
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <select
            value={filterSpace}
            onChange={(e) => setFilterSpace(e.target.value)}
            className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 appearance-none"
          >
            <option value="">Tous les espaces</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>{s.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* No spaces warning */}
      {spaces.length === 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 mb-4 text-center">
          <p className="text-[13px] font-semibold text-amber-700">
            Créez d&apos;abord un espace avant d&apos;ajouter des membres.
          </p>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-[16px] font-bold text-gray-900 mb-1">
            {search ? "Aucun résultat" : "Aucun membre"}
          </p>
          <p className="text-[13px] text-gray-500">
            {search
              ? "Essayez un autre terme de recherche."
              : "Ajoutez des membres pour leur attribuer des badges QR."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <UserCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold text-gray-900 truncate">
                      {m.prenom} {m.nom}
                    </p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleColor(m.role)}`}>
                      {m.role}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 truncate">
                    {m.access_spaces?.nom}
                    {m.email && ` · ${m.email}`}
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(m)}
                  className="active:scale-[0.95] transition-transform flex-shrink-0"
                >
                  {m.actif ? (
                    <ToggleRight className="w-7 h-7 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-gray-300" />
                  )}
                </button>
              </div>

              {/* QR code preview */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5 mb-3">
                <QRCodeSVG value={m.qr_code} size={40} level="M" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-mono font-bold text-gray-700">{m.qr_code}</p>
                  <p className="text-[10px] text-gray-400">
                    {m.date_debut && m.date_fin
                      ? `${new Date(m.date_debut).toLocaleDateString("fr-FR")} → ${new Date(m.date_fin).toLocaleDateString("fr-FR")}`
                      : "Pas de limite de période"}
                  </p>
                </div>
                <button
                  onClick={() => { hapticMedium(); setShowBadge(m); }}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center active:scale-[0.95] transition-transform"
                >
                  <QrCode className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-gray-600 bg-gray-100 py-2 rounded-xl active:scale-[0.97] transition-transform"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-red-500 bg-red-50 px-4 py-2 rounded-xl active:scale-[0.97] transition-transform disabled:opacity-50"
                >
                  {deletingId === m.id ? (
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 animate-slide-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-black text-gray-900">
                {editingId ? "Modifier le membre" : "Nouveau membre"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Espace */}
              <div>
                <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Espace *</label>
                <select
                  value={form.space_id}
                  onChange={(e) => setForm({ ...form, space_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  <option value="">Sélectionner un espace</option>
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>{s.nom}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Prénom *</label>
                  <input
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    placeholder="Prénom"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Nom *</label>
                  <input
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Nom"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemple.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Téléphone</label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  placeholder="+225 07 00 00 00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Rôle</label>
                <div className="flex gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.value })}
                      className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                        form.role === r.value
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Date début</label>
                  <input
                    type="date"
                    value={form.date_debut}
                    onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Date fin</label>
                  <input
                    type="date"
                    value={form.date_fin}
                    onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
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
                "Ajouter le membre"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Badge Modal */}
      {showBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-slide-in text-center">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-black text-gray-900">Badge QR</h3>
              <button
                onClick={() => setShowBadge(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 mb-4">
              <QRCodeSVG
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/binq-access/badge/${showBadge.qr_code}`}
                size={200}
                level="H"
                className="mx-auto"
                includeMargin
              />
            </div>

            <p className="text-[18px] font-bold text-gray-900 mb-0.5">
              {showBadge.prenom} {showBadge.nom}
            </p>
            <p className="text-[13px] text-gray-500 mb-1">{showBadge.access_spaces?.nom}</p>
            <p className="text-[14px] font-mono font-bold text-emerald-600 mb-4">
              {showBadge.qr_code}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => copyBadgeLink(showBadge.qr_code)}
                className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold text-gray-700 bg-gray-100 py-2.5 rounded-xl active:scale-[0.97] transition-transform"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copié !" : "Copier le lien"}
              </button>
              <a
                href={`/binq-access/badge/${showBadge.qr_code}`}
                target="_blank"
                className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold text-white bg-emerald-500 py-2.5 rounded-xl active:scale-[0.97] transition-transform shadow-lg shadow-emerald-500/25"
              >
                <Download className="w-4 h-4" />
                Voir le badge
              </a>
            </div>
          </div>
        </div>
      )}
    </AccessLayout>
  );
}
