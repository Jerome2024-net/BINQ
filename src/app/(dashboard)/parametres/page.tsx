"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Globe,
  Shield,
  Trash2,
  CircleDollarSign,
  Moon,
  Smartphone,
  Mail,
  Phone,
  LogOut,
  ChevronRight,
  User,
  Lock,
  CreditCard,
  HelpCircle,
  FileText,
  Loader2,
} from "lucide-react";

export default function ParametresPage() {
  const { user, logout, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);

  // Sync from user
  useEffect(() => {
    if (user) {
      setNotifEmail(user.notificationsEmail ?? true);
      setNotifSms(user.notificationsSms ?? false);
    }
  }, [user]);

  const saveNotifications = async () => {
    setLoading(true);
    try {
      await updateProfile({ notificationsEmail: notifEmail, notificationsSms: notifSms });
      showToast("success", "Notifications mises à jour !");
    } catch {
      showToast("error", "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await logout();
      showToast("success", "Compte supprimé", "Votre compte a été supprimé");
    } catch {
      showToast("error", "Erreur", "Impossible de supprimer le compte");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profil" className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/50" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Paramètres</h1>
          <p className="text-xs text-white/40">Configurez votre expérience Binq</p>
        </div>
      </div>

      {/* ── Compte ── */}
      <div className="bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Compte</h3>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <Link href="/profil" className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Mon Profil</p>
                <p className="text-[10px] text-white/30">Modifier vos informations</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </Link>

          <Link href="/profil" className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors" onClick={() => {}}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Lock className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Sécurité</p>
                <p className="text-[10px] text-white/30">Mot de passe et vérification</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </Link>

          <Link href="/portefeuille" className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Portefeuille</p>
                <p className="text-[10px] text-white/30">Solde et historique des transactions</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </Link>
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Notifications</h3>
        </div>
        <div className="p-5 space-y-4">
          <ToggleRow
            icon={Mail}
            label="Notifications par email"
            description="Recevoir les alertes par email"
            value={notifEmail}
            onChange={setNotifEmail}
          />
          <ToggleRow
            icon={Smartphone}
            label="Notifications SMS"
            description="Recevoir les alertes par SMS"
            value={notifSms}
            onChange={setNotifSms}
          />

          <button
            onClick={saveNotifications}
            disabled={loading}
            className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            Sauvegarder
          </button>
        </div>
      </div>

      {/* ── Général ── */}
      <div className="bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Général</h3>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Globe className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Langue</p>
                <p className="text-[10px] text-white/30">Langue de l&apos;application</p>
              </div>
            </div>
            <span className="text-sm text-emerald-400 font-medium">Français</span>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <CircleDollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Devise</p>
                <p className="text-[10px] text-white/30">Devise par défaut</p>
              </div>
            </div>
            <span className="text-sm text-emerald-400 font-medium">XOF (FCFA)</span>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                <Moon className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Thème</p>
                <p className="text-[10px] text-white/30">Apparence de l&apos;application</p>
              </div>
            </div>
            <span className="text-sm text-emerald-400 font-medium">Sombre</span>
          </div>
        </div>
      </div>

      {/* ── Support ── */}
      <div className="bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Support</h3>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <button
            onClick={() => showToast("info", "Aide", "Contactez-nous à support@binq.app")}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-sm font-medium">Centre d&apos;aide</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </button>

          <button
            onClick={() => showToast("info", "CGU", "Les conditions générales sont disponibles sur notre site")}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-500/15 flex items-center justify-center">
                <FileText className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm font-medium">Conditions d&apos;utilisation</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </button>

          <button
            onClick={() => showToast("info", "Données", "Vos données seront prêtes sous 24h")}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-sm font-medium">Télécharger mes données</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </button>
        </div>
      </div>

      {/* ── Déconnexion ── */}
      <button
        onClick={async () => {
          await logout();
        }}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/[0.04] border border-white/[0.06] rounded-2xl text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-semibold">Se déconnecter</span>
      </button>

      {/* ── Zone danger ── */}
      <div className="bg-[#111] border border-red-500/20 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-3">
          <Trash2 className="w-4 h-4" />
          Zone dangereuse
        </h3>
        <p className="text-xs text-white/30 mb-4">
          La suppression de votre compte est irréversible. Toutes vos données seront perdues.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
          >
            Supprimer mon compte
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteAccount}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2.5 px-5 rounded-xl transition-colors"
            >
              Confirmer la suppression
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Version */}
      <p className="text-center text-[10px] text-white/15 pb-4">
        Binq v1.0.0 — Fait avec ❤️ pour l&apos;Afrique
      </p>
    </div>
  );
}

/* ── Toggle Row ── */
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
      className="w-full flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-colors"
    >
      <div className="flex items-center gap-3 text-left">
        <Icon className={`w-4 h-4 ${value ? "text-emerald-400" : "text-white/30"}`} />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[10px] text-white/30">{description}</p>
        </div>
      </div>
      <div className={`rounded-full relative transition-colors ${value ? "bg-emerald-500" : "bg-white/10"}`} style={{ width: 40, height: 22 }}>
        <div
          className={`absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${value ? "translate-x-[20px]" : "translate-x-0.5"}`}
        />
      </div>
    </button>
  );
}
