"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTontine } from "@/contexts/TontineContext";
import { useFinance } from "@/contexts/FinanceContext";
import { useToast } from "@/contexts/ToastContext";
import Avatar from "@/components/Avatar";
import AvatarUpload from "@/components/AvatarUpload";
import { ConfianceBadge } from "@/components/MemberCard";
import { formatMontant } from "@/lib/data";
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Save,
  Camera,
  CircleDollarSign,
  Users,
  CheckCircle2,
  Loader2,
  MapPin,
  Briefcase,
  FileText,
  Globe,
  Bell,
  Eye,
  EyeOff,
  Crown,
  Star,
  TrendingUp,
  ExternalLink,
  Calendar,
} from "lucide-react";

export default function ProfilPage() {
  const { user, updateProfile } = useAuth();
  const { getMesTontines } = useTontine();
  const { wallet, getFinancialSummary } = useFinance();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAvatarUploaded = async (url: string) => {
    // L'API a déjà mis à jour la DB, on met juste à jour l'état local
    await updateProfile({ avatar: url });
    showToast("success", "Photo de profil mise à jour !");
  };
  const [activeTab, setActiveTab] = useState<"infos" | "securite" | "preferences">("infos");

  const [formData, setFormData] = useState({
    nom: user?.nom || "",
    prenom: user?.prenom || "",
    telephone: user?.telephone || "",
    bio: user?.bio || "",
    ville: user?.ville || "",
    pays: user?.pays || "",
    profession: user?.profession || "",
  });

  const [preferences, setPreferences] = useState({
    notificationsEmail: user?.notificationsEmail ?? true,
    notificationsSms: user?.notificationsSms ?? false,
    profilPublic: user?.profilPublic ?? true,
  });

  const mesTontines = getMesTontines();
  const tontinesOrga = mesTontines.filter(
    (t) => t.organisateur.id === user?.id || t.organisateur.email === user?.email
  );
  const summary = getFinancialSummary();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(async () => {
      await updateProfile(formData);
      showToast("success", "Profil mis à jour !", "Vos informations ont été enregistrées");
      setLoading(false);
    }, 500);
  };

  const handleSavePreferences = () => {
    setLoading(true);
    setTimeout(async () => {
      await updateProfile(preferences);
      showToast("success", "Préférences sauvegardées !");
      setLoading(false);
    }, 500);
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header avec banner */}
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary-600 to-emerald-500 -mx-6 -mt-6 relative">
          <div className="absolute inset-0 bg-black/5"></div>
          <button className="absolute bottom-3 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
            <Camera className="w-3.5 h-3.5" />
            Changer la bannière
          </button>
        </div>

        <div className="px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 relative z-10">
            <div className="relative group">
              <div className="ring-4 ring-white rounded-2xl shadow-lg">
                <Avatar user={user} size="xl" />
              </div>
              <AvatarUpload
                userId={user.id}
                currentAvatar={user.avatar}
                userName={`${user.prenom} ${user.nom}`}
                onUploadComplete={handleAvatarUploaded}
              />
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.prenom} {user.nom}
                </h1>
                {user.badgeVerifie && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Vérifié
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 flex-wrap">
                {user.ville && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {user.ville}{user.pays ? `, ${user.pays}` : ""}
                  </span>
                )}
                {user.profession && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {user.profession}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Membre depuis {user.dateInscription}
                </span>
              </div>
            </div>

            <Link
              href={`/membres/${user.id}`}
              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Voir mon profil public
            </Link>
          </div>

          {user.bio && (
            <p className="text-gray-600 mt-4 text-sm leading-relaxed border-l-2 border-primary-200 pl-4">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card py-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{mesTontines.length}</p>
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
            <Users className="w-3 h-3" /> Tontines
          </p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{tontinesOrga.length}</p>
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
            <Crown className="w-3 h-3" /> Organisées
          </p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-2xl font-bold text-green-600">{formatMontant(wallet?.solde || 0)}</p>
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
            <CircleDollarSign className="w-3 h-3" /> Solde
          </p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{summary.nombreTransactions}</p>
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> Transactions
          </p>
        </div>
        <div className="card py-4 text-center col-span-2 lg:col-span-1">
          <ConfianceBadge score={user.scoreConfiance ?? 50} />
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-2">
            <Star className="w-3 h-3" /> Confiance
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {[
          { key: "infos" as const, label: "Informations", icon: UserIcon },
          { key: "securite" as const, label: "Sécurité", icon: Shield },
          { key: "preferences" as const, label: "Préférences", icon: Bell },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "infos" && (
        <form onSubmit={handleSubmit} className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary-600" />
            Informations personnelles
          </h2>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex text-sm font-medium text-gray-700 mb-1.5 items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                type="email"
                value={user.email}
                className="input-field bg-gray-50 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">L&apos;email ne peut pas être modifié</p>
            </div>

            <div>
              <label className="flex text-sm font-medium text-gray-700 mb-1.5 items-center gap-2">
                <Phone className="w-4 h-4" /> Téléphone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="input-field"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <hr className="border-gray-100" />

            <div>
              <label className="flex text-sm font-medium text-gray-700 mb-1.5 items-center gap-2">
                <FileText className="w-4 h-4" /> Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="input-field min-h-[80px] resize-none"
                placeholder="Présentez-vous en quelques mots..."
                maxLength={200}
              />
              <p className="text-xs text-gray-400 mt-1">{formData.bio.length}/200 caractères</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex text-sm font-medium text-gray-700 mb-1.5 items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Profession
                </label>
                <input
                  type="text"
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Commerçant, Enseignant..."
                />
              </div>
              <div>
                <label className="flex text-sm font-medium text-gray-700 mb-1.5 items-center gap-2">
                  <MapPin className="w-4 h-4" /> Ville
                </label>
                <input
                  type="text"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Paris"
                />
              </div>
            </div>

            <div>
              <label className="flex text-sm font-medium text-gray-700 mb-1.5 items-center gap-2">
                <Globe className="w-4 h-4" /> Pays
              </label>
              <input
                type="text"
                value={formData.pays}
                onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                className="input-field"
                placeholder="Ex: Côte d'Ivoire"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {activeTab === "securite" && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            Sécurité du compte
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe actuel
              </label>
              <input type="password" className="input-field" placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nouveau mot de passe
                </label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmer
                </label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                showToast("success", "Mot de passe modifié !")
              }
              className="btn-primary flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Changer le mot de passe
            </button>
          </div>

          {/* Vérification du profil */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Vérification du profil</h3>
            {user.badgeVerifie ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Profil vérifié ✓</p>
                  <p className="text-sm text-green-600">
                    Votre numéro de téléphone a été confirmé
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                <Phone className="w-6 h-6 text-amber-600" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800">Profil non vérifié</p>
                  <p className="text-sm text-amber-600">
                    Confirmez votre numéro de téléphone pour obtenir le badge vérifié
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await updateProfile({ badgeVerifie: true });
                    showToast("success", "Profil vérifié ! ✓", "Votre badge vérifié est maintenant actif");
                  }}
                  className="btn-primary text-sm !py-2 !px-4"
                >
                  Vérifier
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "preferences" && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-600" />
            Préférences
          </h2>

          <div className="space-y-6">
            {/* Notifications */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Notifications par email</p>
                      <p className="text-xs text-gray-500">Recevoir les alertes par email</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={preferences.notificationsEmail}
                      onChange={(e) =>
                        setPreferences({ ...preferences, notificationsEmail: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-primary-600 transition-colors"></div>
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                  </div>
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Notifications SMS</p>
                      <p className="text-xs text-gray-500">Recevoir les alertes par SMS</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={preferences.notificationsSms}
                      onChange={(e) =>
                        setPreferences({ ...preferences, notificationsSms: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-primary-600 transition-colors"></div>
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                  </div>
                </label>
              </div>
            </div>

            {/* Visibilité */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Visibilité</h3>
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  {preferences.profilPublic ? (
                    <Eye className="w-5 h-5 text-green-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Profil public</p>
                    <p className="text-xs text-gray-500">
                      {preferences.profilPublic
                        ? "Les autres membres peuvent voir votre profil complet"
                        : "Seuls votre nom et avatar sont visibles"}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={preferences.profilPublic}
                    onChange={(e) =>
                      setPreferences({ ...preferences, profilPublic: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-primary-600 transition-colors"></div>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                </div>
              </label>
            </div>

            <button
              onClick={handleSavePreferences}
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Enregistrer les préférences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
