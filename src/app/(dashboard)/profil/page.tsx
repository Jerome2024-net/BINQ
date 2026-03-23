"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess, hapticMedium } from "@/lib/haptics";
import AvatarUpload from "@/components/AvatarUpload";

import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Save,
  MapPin,
  Briefcase,
  FileText,
  Globe,
  Bell,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ShoppingBag,
  Copy,
  ChevronRight,
  Lock,
  Settings,
} from "lucide-react";
import Link from "next/link";

type TabKey = "infos" | "securite" | "preferences";

export default function ProfilPage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("infos");

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    bio: "",
    ville: "",
    pays: "",
    profession: "",
  });

  const [preferences, setPreferences] = useState({
    notificationsEmail: true,
    notificationsSms: false,
    profilPublic: true,
  });

  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  // Sync form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || "",
        prenom: user.prenom || "",
        telephone: user.telephone || "",
        bio: user.bio || "",
        ville: user.ville || "",
        pays: user.pays || "",
        profession: user.profession || "",
      });
      setPreferences({
        notificationsEmail: user.notificationsEmail ?? true,
        notificationsSms: user.notificationsSms ?? false,
        profilPublic: user.profilPublic ?? true,
      });
    }
  }, [user]);

  const handleAvatarUploaded = async (url: string) => {
    await updateProfile({ avatar: url });
    hapticSuccess();
    showToast("success", "Photo de profil mise à jour !");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      hapticSuccess();
      showToast("success", "Profil mis à jour !", "Vos informations ont été enregistrées");
    } catch {
      showToast("error", "Erreur", "Impossible de mettre à jour le profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await updateProfile(preferences);
      hapticSuccess();
      showToast("success", "Préférences sauvegardées !");
    } catch {
      showToast("error", "Erreur", "Impossible de sauvegarder les préférences");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.newPass || !passwords.confirm) {
      showToast("error", "Erreur", "Remplissez tous les champs");
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      showToast("error", "Erreur", "Les mots de passe ne correspondent pas");
      return;
    }
    if (passwords.newPass.length < 6) {
      showToast("error", "Erreur", "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      });
      if (res.ok) {
        hapticSuccess();
        showToast("success", "Mot de passe modifié !");
        setPasswords({ current: "", newPass: "", confirm: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        showToast("error", "Erreur", data.error || "Impossible de changer le mot de passe");
      }
    } catch {
      showToast("error", "Erreur", "Impossible de changer le mot de passe");
    } finally {
      setLoading(false);
    }
  };

  const copyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      hapticMedium();
      showToast("success", "ID copié !");
    }
  };

  if (!user) return null;

  const initials = `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase();
  const memberSince = user.dateInscription
    ? new Date(user.dateInscription).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : "";

  const tabs: { key: TabKey; label: string; icon: typeof UserIcon }[] = [
    { key: "infos", label: "Infos", icon: UserIcon },
    { key: "securite", label: "Sécurité", icon: Shield },
    { key: "preferences", label: "Préférences", icon: Bell },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl hover:bg-gray-100/50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Mon Profil</h1>
          <p className="text-xs text-gray-600">Gérez vos informations personnelles</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 border border-gray-200/50">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-emerald-500/30 to-cyan-500/20" />

        {/* Avatar + Info */}
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-10 relative z-10">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center ring-4 ring-[#0a0a0a] shadow-xl overflow-hidden">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-900 text-2xl font-black">{initials}</span>
                )}
              </div>
              <AvatarUpload
                userId={user.id}
                currentAvatar={user.avatar}
                userName={`${user.prenom} ${user.nom}`}
                onUploadComplete={handleAvatarUploaded}
              />
            </div>

            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold">{user.prenom} {user.nom}</h2>
                {user.badgeVerifie && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Vérifié
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Quick Info */}
          <div className="flex items-center gap-4 mt-4 flex-wrap text-xs text-gray-600">
            {user.ville && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {user.ville}{user.pays ? `, ${user.pays}` : ""}
              </span>
            )}
            {user.profession && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> {user.profession}
              </span>
            )}
            {memberSince && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Membre depuis {memberSince}
              </span>
            )}
          </div>

          {user.bio && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed border-l-2 border-emerald-200/60 pl-3">
              {user.bio}
            </p>
          )}

          {/* ID */}
          <button onClick={copyId} className="flex items-center gap-2 mt-3 text-[10px] text-gray-600 hover:text-gray-700 transition-colors">
            <span className="font-mono">ID: {user.id.slice(0, 8)}...</span>
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 border border-gray-200/50 rounded-2xl p-4 text-center">
          <ShoppingBag className="w-4 h-4 text-emerald-600 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-emerald-600">Vendeur</p>
          <p className="text-[10px] text-gray-700 mt-0.5">Statut</p>
        </div>
        <div className="bg-gray-50 border border-gray-200/50 rounded-2xl p-4 text-center">
          <TrendingUp className="w-4 h-4 text-cyan-600 mx-auto mb-1.5" />
          <p className="text-lg font-bold">{user.scoreConfiance ?? 50}</p>
          <p className="text-[10px] text-gray-700 mt-0.5">Score confiance</p>
        </div>
        <div className="bg-gray-50 border border-gray-200/50 rounded-2xl p-4 text-center">
          <Star className="w-4 h-4 text-amber-600 mx-auto mb-1.5" />
          <p className="text-lg font-bold">{user.badgeVerifie ? "Oui" : "Non"}</p>
          <p className="text-[10px] text-gray-700 mt-0.5">Vérifié</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 border border-gray-200/50 p-1 rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-emerald-50 text-emerald-600"
                : "text-gray-700 hover:text-gray-800"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === TAB: Informations === */}
      {activeTab === "infos" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 border border-gray-200/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-emerald-600" />
              Informations personnelles
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-200 focus:ring-1 focus:ring-emerald-200 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Nom</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-200 focus:ring-1 focus:ring-emerald-200 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex text-[11px] font-medium text-gray-600 mb-1.5 items-center gap-1.5">
                <Mail className="w-3 h-3" /> Email
              </label>
              <input
                type="email"
                value={user.email}
                className="w-full bg-gray-100 border border-gray-200/50 rounded-xl px-3 py-2.5 text-sm text-gray-600 cursor-not-allowed"
                disabled
              />
              <p className="text-[10px] text-gray-600 mt-1">L&apos;email ne peut pas être modifié</p>
            </div>

            <div>
              <label className="flex text-[11px] font-medium text-gray-600 mb-1.5 items-center gap-1.5">
                <Phone className="w-3 h-3" /> Téléphone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-200 focus:ring-1 focus:ring-emerald-200 transition-all"
                placeholder="+221 77 000 00 00"
              />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              À propos
            </h3>

            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-200 focus:ring-1 focus:ring-emerald-200 transition-all min-h-[80px] resize-none"
                placeholder="Présentez-vous en quelques mots..."
                maxLength={200}
              />
              <p className="text-[10px] text-gray-600 mt-1">{formData.bio.length}/200</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex text-[11px] font-medium text-gray-600 mb-1.5 items-center gap-1.5">
                  <Briefcase className="w-3 h-3" /> Profession
                </label>
                <input
                  type="text"
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-200 focus:ring-1 focus:ring-emerald-200 transition-all"
                  placeholder="Ex: Commerçant"
                />
              </div>
              <div>
                <label className="flex text-[11px] font-medium text-gray-600 mb-1.5 items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Ville
                </label>
                <input
                  type="text"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-200 focus:ring-1 focus:ring-emerald-200 transition-all"
                  placeholder="Ex: Dakar"
                />
              </div>
            </div>

            <div>
              <label className="flex text-[11px] font-medium text-gray-600 mb-1.5 items-center gap-1.5">
                <Globe className="w-3 h-3" /> Pays
              </label>
              <input
                type="text"
                value={formData.pays}
                onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-200 focus:ring-1 focus:ring-emerald-200 transition-all"
                placeholder="Ex: Sénégal"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer les modifications
          </button>
        </form>
      )}

      {/* === TAB: Sécurité === */}
      {activeTab === "securite" && (
        <div className="space-y-4">
          {/* Change password */}
          <div className="bg-gray-50 border border-gray-200/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              Changer le mot de passe
            </h3>

            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Mot de passe actuel</label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-200 focus:ring-1 focus:ring-emerald-200 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwords.newPass}
                  onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                  className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-200 focus:ring-1 focus:ring-emerald-200 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Confirmer</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-200 focus:ring-1 focus:ring-emerald-200 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleChangePassword}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Changer le mot de passe
            </button>
          </div>

          {/* Verification */}
          <div className="bg-gray-50 border border-gray-200/50 rounded-2xl p-5">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Vérification du profil
            </h3>

            {user.badgeVerifie ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200/40 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-emerald-600">Profil vérifié</p>
                  <p className="text-xs text-gray-600">Votre identité a été confirmée</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Phone className="w-6 h-6 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-600">Profil non vérifié</p>
                  <p className="text-xs text-gray-600">Confirmez votre téléphone pour le badge vérifié</p>
                </div>
                <button
                  onClick={async () => {
                    await updateProfile({ badgeVerifie: true });
                    hapticSuccess();
                    showToast("success", "Profil vérifié !", "Votre badge est maintenant actif");
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors"
                >
                  Vérifier
                </button>
              </div>
            )}
          </div>

          {/* Active Sessions */}
          <div className="bg-gray-50 border border-gray-200/50 rounded-2xl p-5">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-emerald-600" />
              Sessions & Sécurité
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => showToast("info", "Sessions", "Toutes les autres sessions ont été déconnectées")}
                className="w-full flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200/50 rounded-xl hover:bg-gray-100/50 transition-colors group"
              >
                <span className="text-sm text-gray-700 group-hover:text-gray-800">Déconnecter les autres sessions</span>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => showToast("info", "Données", "Vos données seront prêtes sous 24h")}
                className="w-full flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200/50 rounded-xl hover:bg-gray-100/50 transition-colors group"
              >
                <span className="text-sm text-gray-700 group-hover:text-gray-800">Télécharger mes données</span>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === TAB: Préférences === */}
      {activeTab === "preferences" && (
        <div className="space-y-4">
          {/* Notifications */}
          <div className="bg-gray-50 border border-gray-200/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              Notifications
            </h3>

            <ToggleRow
              icon={Mail}
              label="Notifications par email"
              description="Recevoir les alertes par email"
              value={preferences.notificationsEmail}
              onChange={(v) => setPreferences({ ...preferences, notificationsEmail: v })}
            />
            <ToggleRow
              icon={Phone}
              label="Notifications SMS"
              description="Recevoir les alertes par SMS"
              value={preferences.notificationsSms}
              onChange={(v) => setPreferences({ ...preferences, notificationsSms: v })}
            />
          </div>

          {/* Visibilité */}
          <div className="bg-gray-50 border border-gray-200/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              {preferences.profilPublic ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-600" />}
              Visibilité
            </h3>

            <ToggleRow
              icon={preferences.profilPublic ? Eye : EyeOff}
              label="Profil public"
              description={preferences.profilPublic ? "Les autres peuvent voir votre profil" : "Seuls votre nom et avatar sont visibles"}
              value={preferences.profilPublic}
              onChange={(v) => setPreferences({ ...preferences, profilPublic: v })}
            />
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer les préférences
          </button>

          {/* Quick Links */}
          <div className="bg-gray-50 border border-gray-200/50 rounded-2xl p-5">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-emerald-600" />
              Raccourcis
            </h3>
            <div className="space-y-2">
              <Link href="/parametres" className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200/50 rounded-xl hover:bg-gray-100/50 transition-colors group">
                <span className="text-sm text-gray-700 group-hover:text-gray-800 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Paramètres avancés
                </span>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </Link>
              <Link href="/evenements" className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200/50 rounded-xl hover:bg-gray-100/50 transition-colors group">
                <span className="text-sm text-gray-700 group-hover:text-gray-800 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Mes événements
                </span>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Toggle Row Component ── */
function ToggleRow({
  icon: Icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: typeof Mail;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200/50 rounded-xl hover:bg-gray-100/50 transition-colors"
    >
      <div className="flex items-center gap-3 text-left">
        <Icon className={`w-4 h-4 ${value ? "text-emerald-600" : "text-gray-600"}`} />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[10px] text-gray-700">{description}</p>
        </div>
      </div>
      <div className={`w-10 h-5.5 rounded-full relative transition-colors ${value ? "bg-emerald-500" : "bg-gray-200"}`} style={{ width: 40, height: 22 }}>
        <div
          className={`absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${value ? "translate-x-[20px]" : "translate-x-0.5"}`}
        />
      </div>
    </button>
  );
}
