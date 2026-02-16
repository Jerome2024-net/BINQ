"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  Settings,
  Bell,
  Globe,
  Palette,
  Shield,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CircleDollarSign,
} from "lucide-react";

export default function ParametresPage() {
  const { logout } = useAuth();
  const { showToast } = useToast();

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPaiement, setNotifPaiement] = useState(true);
  const [notifTour, setNotifTour] = useState(true);
  const [notifInvite, setNotifInvite] = useState(false);
  const [langue, setLangue] = useState("fr");
  const [devise, setDevise] = useState("EUR");

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)} className="flex-shrink-0">
      {value ? (
        <ToggleRight className="w-10 h-10 text-primary-600" />
      ) : (
        <ToggleLeft className="w-10 h-10 text-gray-300" />
      )}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 mt-1">Configurez votre expérience Binq</p>
      </div>

      {/* Notifications */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-600" />
          Notifications
        </h2>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Notifications par email</p>
              <p className="text-sm text-gray-500">Recevoir les alertes par email</p>
            </div>
            <Toggle value={notifEmail} onChange={setNotifEmail} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Rappels de paiement</p>
              <p className="text-sm text-gray-500">Rappel avant chaque échéance</p>
            </div>
            <Toggle value={notifPaiement} onChange={setNotifPaiement} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Début de tour</p>
              <p className="text-sm text-gray-500">Notification quand un nouveau tour commence</p>
            </div>
            <Toggle value={notifTour} onChange={setNotifTour} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Invitations</p>
              <p className="text-sm text-gray-500">Alertes pour les invitations reçues</p>
            </div>
            <Toggle value={notifInvite} onChange={setNotifInvite} />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary-600" />
          Préférences
        </h2>
        <div className="space-y-4">
          <div>
            <label className="flex text-sm font-medium text-gray-700 mb-1.5 items-center gap-2">
              <Globe className="w-4 h-4" /> Langue
            </label>
            <select
              value={langue}
              onChange={(e) => {
                setLangue(e.target.value);
                showToast("success", "Langue mise à jour");
              }}
              className="input-field w-auto min-w-[200px]"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="flex text-sm font-medium text-gray-700 mb-1.5 items-center gap-2">
              <CircleDollarSign className="w-4 h-4" /> Devise par défaut
            </label>
            <select
              value={devise}
              onChange={(e) => {
                setDevise(e.target.value);
                showToast("success", "Devise mise à jour");
              }}
              className="input-field w-auto min-w-[200px]"
            >
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dollar US)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-600" />
          Confidentialité & Sécurité
        </h2>
        <div className="space-y-4">
          <button
            onClick={() => showToast("info", "Sessions", "Toutes les sessions actives ont été déconnectées")}
            className="btn-secondary text-sm"
          >
            Déconnecter toutes les sessions
          </button>
          <button
            onClick={() => showToast("info", "Données", "Vos données seront prêtes sous 24h")}
            className="btn-secondary text-sm"
          >
            Télécharger mes données
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200">
        <h2 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Zone dangereuse
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          La suppression de votre compte est irréversible. Toutes vos données, tontines et historiques seront perdus.
        </p>
        <button
          onClick={async () => {
            if (confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
              await logout();
              showToast("success", "Compte supprimé", "Votre compte a été supprimé avec succès");
            }
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}
