"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { type DeviseCode, DEVISES, DEVISE_LIST, DEFAULT_DEVISE, formatMontant } from "@/lib/currencies";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  Wallet,
  Send,
  User,
  QrCode,
  MessageSquare,
} from "lucide-react";

interface UserPublic {
  id: string;
  prenom: string;
  nom: string;
  avatar_url: string | null;
}

export default function PayUserPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = params.id as string;

  const [targetUser, setTargetUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [montant, setMontant] = useState("");
  const [message, setMessage] = useState("");
  const [devise, setDevise] = useState<DeviseCode>(DEFAULT_DEVISE);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentRef, setSentRef] = useState("");
  const [sentMontant, setSentMontant] = useState(0);

  const deviseConfig = DEVISES[devise];

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Utilisateur introuvable");
          return;
        }
        setTargetUser(data.user);
      } catch {
        setError("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleSend = async () => {
    if (!user || !targetUser) return;

    if (user.id === targetUser.id) {
      showToast("error", "Erreur", "Vous ne pouvez pas vous envoyer de l\u2019argent");
      return;
    }

    const parsedMontant = parseFloat(montant);
    if (!parsedMontant || parsedMontant <= 0) {
      showToast("error", "Erreur", "Veuillez saisir un montant valide");
      return;
    }
    if (parsedMontant < deviseConfig.minTransfer) {
      showToast("error", "Erreur", `Montant minimum : ${formatMontant(deviseConfig.minTransfer, devise)}`);
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/transferts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinataire_id: targetUser.id,
          montant: parsedMontant,
          devise,
          message: message.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Envoi échoué");
        return;
      }

      setSent(true);
      setSentRef(data.reference || data.transfert?.reference || "");
      setSentMontant(parsedMontant);
      showToast("success", "Envoyé", `${formatMontant(parsedMontant, devise)} envoyés avec succès`);
    } catch {
      showToast("error", "Erreur", "Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-white/40">Chargement...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="bg-white/[0.04] rounded-3xl p-8 max-w-md w-full text-center border border-white/[0.06] backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Utilisateur introuvable</h1>
          <p className="text-white/40 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-400 transition"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  // Success
  if (sent && targetUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="bg-white/[0.04] rounded-3xl p-8 max-w-md w-full text-center border border-white/[0.06] backdrop-blur-xl">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Envoi effectué !</h1>
          <p className="text-white/40 mb-2">
            Vous avez envoyé <span className="text-white font-semibold">{formatMontant(sentMontant, devise)}</span> à{" "}
            <span className="text-white font-semibold">{targetUser.prenom} {targetUser.nom}</span>.
          </p>
          {sentRef && <p className="text-xs text-white/20 mb-6">Réf: {sentRef}</p>}
          <Link
            href="/portefeuille"
            className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-400 transition"
          >
            <Wallet className="w-4 h-4" />
            Mon portefeuille
          </Link>
        </div>
      </div>
    );
  }

  if (!targetUser) return null;

  const initials = `${(targetUser.prenom || "?")[0]}${(targetUser.nom || "?")[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight">
            <span className="text-emerald-400">Binq</span> Pay
          </h2>
          <p className="text-white/30 text-sm mt-1 flex items-center justify-center gap-1.5">
            <QrCode className="w-3.5 h-3.5" />
            Paiement par QR Code
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] rounded-3xl p-8 border border-white/[0.06] backdrop-blur-xl">
          {/* User info */}
          <div className="flex flex-col items-center mb-6">
            {targetUser.avatar_url ? (
              <img
                src={targetUser.avatar_url}
                alt={targetUser.prenom}
                className="w-16 h-16 rounded-full object-cover mb-3 ring-2 ring-emerald-500/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-600/30 flex items-center justify-center mb-3 ring-2 ring-emerald-500/30">
                <span className="text-lg font-bold text-emerald-300">{initials}</span>
              </div>
            )}
            <p className="text-lg font-semibold text-white">
              {targetUser.prenom} {targetUser.nom}
            </p>
            <p className="text-white/40 text-sm">Envoyer de l&apos;argent</p>
          </div>

          {!user ? (
            <div className="text-center">
              <p className="text-white/40 text-sm mb-4">
                Connectez-vous pour envoyer de l&apos;argent
              </p>
              <Link
                href={`/connexion?redirect=/pay/user/${userId}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-emerald-400 transition"
              >
                <LogIn className="w-5 h-5" />
                Se connecter
              </Link>
              <p className="text-xs text-white/20 mt-3">
                Pas encore de compte ?{" "}
                <Link href={`/inscription?redirect=/pay/user/${userId}`} className="text-emerald-400 hover:underline">
                  Créer un compte
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Devise */}
              <div className="flex gap-2">
                {DEVISE_LIST.map((d) => {
                  const dc = DEVISES[d];
                  return (
                    <button
                      key={d}
                      onClick={() => setDevise(d)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        devise === d
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06]"
                      }`}
                    >
                      <span>{dc.flag}</span>
                      <span>{dc.code}</span>
                    </button>
                  );
                })}
              </div>

              {/* Montant */}
              <div className="bg-white/[0.03] rounded-2xl p-5 text-center border border-white/[0.06]">
                <p className="text-sm text-white/40 mb-3">Montant à envoyer</p>
                <div className="relative">
                  <input
                    type="number"
                    min={deviseConfig.minTransfer}
                    step={deviseConfig.decimals === 0 ? "1" : "0.01"}
                    placeholder={deviseConfig.decimals === 0 ? "5 000" : "10.00"}
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    className="w-full bg-transparent text-3xl font-black text-white text-center outline-none placeholder-white/15 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-white/20 text-lg absolute right-4 top-1/2 -translate-y-1/2">
                    {deviseConfig.symbol}
                  </span>
                </div>
              </div>

              {/* Message */}
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-white/15" />
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Message (optionnel)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/15 outline-none focus:border-emerald-500/40 transition text-sm"
                />
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={sending || !montant || parseFloat(montant) <= 0}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {sending ? "Envoi en cours..." : "Envoyer"}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/15 mt-6">
          Paiement sécurisé via Binq. Vos fonds sont débités de votre portefeuille.
        </p>
      </div>
    </div>
  );
}
