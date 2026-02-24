"use client";

import { useState } from "react";
import { X, Mail, Phone, Loader2, CheckCircle2, Clock, XCircle, Copy, Send, MessageCircle, Share2, Link2, Shield, Users, Euro, Calendar } from "lucide-react";
import { Invitation } from "@/types";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, telephone: string) => { success: boolean; error?: string; code?: string } | Promise<{ success: boolean; error?: string; code?: string }>;
  tontineNom: string;
  placesRestantes: number;
  montantCotisation?: number;
  devise?: string;
  frequence?: string;
  invitationsEnvoyees?: Invitation[];
}

function getStatutInvitation(statut: string) {
  switch (statut) {
    case "en_attente":
      return { label: "En attente", color: "text-amber-600 bg-amber-50 ring-1 ring-amber-200/60", icon: <Clock className="w-3 h-3" /> };
    case "acceptee":
      return { label: "Acceptée", color: "text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200/60", icon: <CheckCircle2 className="w-3 h-3" /> };
    case "refusee":
      return { label: "Refusée", color: "text-red-600 bg-red-50 ring-1 ring-red-200/60", icon: <XCircle className="w-3 h-3" /> };
    case "expiree":
      return { label: "Expirée", color: "text-gray-500 bg-gray-50 ring-1 ring-gray-200/60", icon: <Clock className="w-3 h-3" /> };
    default:
      return { label: statut, color: "text-gray-500 bg-gray-50", icon: <Clock className="w-3 h-3" /> };
  }
}

function getFrequenceLabel(f?: string) {
  switch (f) {
    case "hebdomadaire": return "/ semaine";
    case "bimensuel": return "/ 2 sem.";
    case "mensuel": return "/ mois";
    default: return "";
  }
}

export default function InviteModal({ isOpen, onClose, onInvite, tontineNom, placesRestantes, montantCotisation, devise, frequence, invitationsEnvoyees = [] }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [step, setStep] = useState<"form" | "share">("form");

  if (!isOpen) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  const montantInfo = montantCotisation && devise
    ? `${montantCotisation} ${devise} ${getFrequenceLabel(frequence)}`
    : "";

  const inviteLink = inviteCode ? `${appUrl}/rejoindre/${inviteCode}` : "";

  const messageWhatsApp = inviteCode
    ? `🌟 *Rejoins ma tontine "${tontineNom}" sur Binq !*\n\n💰 Cotisation : ${montantInfo}\n👥 ${placesRestantes} place(s) restante(s)\n🔒 Paiements sécurisés\n\n👉 Rejoins en un clic :\n${inviteLink}\n\n_Binq — La tontine digitale, simple et sécurisée_`
    : "";

  const messageClean = messageWhatsApp.replace(/[*_]/g, "");

  const handleSubmit = async () => {
    if (!email) {
      setError("Saisissez l'email du membre");
      return;
    }
    setLoading(true);
    setError("");
    const result = await onInvite(email, telephone);
    setLoading(false);
    if (result.success) {
      if (result.code) setInviteCode(result.code);
      setStep("share");
    } else {
      setError(result.error || "Erreur lors de l'invitation");
    }
  };

  const handleShareWhatsApp = () => {
    const tel = telephone.trim().replace(/[\s\-().]/g, "");
    const url = tel
      ? `https://wa.me/${tel}?text=${encodeURIComponent(messageWhatsApp)}`
      : `https://wa.me/?text=${encodeURIComponent(messageWhatsApp)}`;
    window.open(url, "_blank");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Rejoins ma tontine "${tontineNom}" sur Binq`);
    const body = encodeURIComponent(messageClean);
    const mailto = email.trim()
      ? `mailto:${email.trim()}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;
    window.open(mailto);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = inviteLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageClean);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = messageClean;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rejoins "${tontineNom}" sur Binq`,
          text: `💰 Cotisation : ${montantInfo} · ${placesRestantes} places restantes`,
          url: inviteLink,
        });
      } catch { /* cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  const handleNewInvitation = () => {
    setStep("form");
    setEmail("");
    setTelephone("");
    setInviteCode("");
    setError("");
  };

  const handleClose = () => {
    setStep("form");
    setEmail("");
    setTelephone("");
    setInviteCode("");
    setError("");
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-fade-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {step === "form" ? "Inviter un membre" : "Partager l'invitation"}
              </h2>
              <p className="text-primary-200 text-sm mt-0.5">{tontineNom}</p>
            </div>
            <button onClick={handleClose} className="text-white/60 hover:text-white p-1 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tontine info chips */}
          <div className="flex gap-3 mt-4">
            {montantCotisation && (
              <div className="flex items-center gap-1.5 text-[13px] text-primary-200">
                <Euro className="w-3.5 h-3.5" />
                <span>{montantCotisation} {devise}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[13px] text-primary-200">
              <Users className="w-3.5 h-3.5" />
              <span>{placesRestantes} place{placesRestantes > 1 ? "s" : ""}</span>
            </div>
            {frequence && (
              <div className="flex items-center gap-1.5 text-[13px] text-primary-200">
                <Calendar className="w-3.5 h-3.5" />
                <span className="capitalize">{frequence}</span>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-y-auto p-5">
          {step === "form" ? (
            /* ========== ÉTAPE 1 : FORMULAIRE ========== */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email de l&apos;invité <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white outline-none transition-all text-sm"
                    placeholder="ami@exemple.com"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Pour le suivi dans l&apos;app</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Numéro WhatsApp <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white outline-none transition-all text-sm"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Pour un envoi direct via WhatsApp</p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 border border-red-100">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !email.trim() || placesRestantes <= 0}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-500/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Créer l&apos;invitation
                  </>
                )}
              </button>

              {placesRestantes <= 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center text-sm text-amber-700">
                  Aucune place restante dans cette tontine.
                </div>
              )}
            </div>
          ) : (
            /* ========== ÉTAPE 2 : PARTAGE ========== */
            <div className="space-y-4">
              {/* Lien copiable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lien d&apos;invitation</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-1.5 transition-all ${
                      copied
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copié" : "Copier"}
                  </button>
                </div>
              </div>

              {/* Boutons de partage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Envoyer via</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl font-medium text-sm hover:bg-[#20bd5a] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={handleShareEmail}
                    className="flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    onClick={handleCopyMessage}
                    className="flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
                  >
                    <Link2 className="w-4 h-4" />
                    Copier le texte
                  </button>
                  <button
                    onClick={handleShareNative}
                    className="flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Autres
                  </button>
                </div>
              </div>

              {/* Aperçu du message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Aperçu du message</label>
                <div className="bg-gray-50 rounded-xl p-3.5 text-sm text-gray-600 whitespace-pre-line max-h-36 overflow-y-auto border border-gray-100 leading-relaxed">
                  {messageClean}
                </div>
              </div>

              {/* Sécurité */}
              <div className="flex items-start gap-2 bg-primary-50 rounded-xl p-3 border border-primary-100/60">
                <Shield className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                <p className="text-xs text-primary-700">
                  Ce lien est unique et sécurisé. Seule la personne qui le reçoit peut rejoindre votre tontine.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleNewInvitation}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Nouvelle invitation
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
                >
                  Terminé
                </button>
              </div>
            </div>
          )}

          {/* Liste invitations envoyées */}
          {invitationsEnvoyees.length > 0 && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Invitations envoyées ({invitationsEnvoyees.length})
              </h4>
              <div className="space-y-2">
                {invitationsEnvoyees.map((inv) => {
                  const s = getStatutInvitation(inv.statut);
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <Mail className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-900 font-medium truncate">{inv.email}</p>
                          <p className="text-xs text-gray-400">{inv.dateCreation}</p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${s.color}`}>
                        {s.icon}
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
