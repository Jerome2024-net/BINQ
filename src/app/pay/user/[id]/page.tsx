"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess, hapticError } from "@/lib/haptics";
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
  Share2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import dynamic from "next/dynamic";
const SuccessConfetti = dynamic(() => import("@/components/SuccessConfetti"), { ssr: false });

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
  const [sentDate, setSentDate] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);

  const deviseConfig = DEVISES[devise];

  // Check for guest payment success
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("guest_success") === "true") {
      const amount = parseFloat(params.get("amount") || "0");
      setSent(true);
      setSentMontant(amount);
      setSentRef("GUEST");
      setSentDate(new Date().toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }));
    }
  }, []);

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
      setSentDate(new Date().toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }));
      hapticSuccess();
      showToast("success", "Envoyé", `${formatMontant(parsedMontant, devise)} envoyés avec succès`);
    } catch {
      hapticError();
      showToast("error", "Erreur", "Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  const handleGuestPay = async () => {
    if (!targetUser) return;
    const parsedMontant = parseFloat(montant);
    if (!parsedMontant || parsedMontant <= 0) {
      showToast("error", "Erreur", "Veuillez saisir un montant valide");
      return;
    }
    if (parsedMontant < deviseConfig.minTransfer) {
      showToast("error", "Erreur", `Montant minimum : ${formatMontant(deviseConfig.minTransfer, devise)}`);
      return;
    }
    setGuestLoading(true);
    try {
      const res = await fetch("/api/payment/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "user",
          code: targetUser.id,
          montant: parsedMontant,
          devise,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Erreur de paiement");
        return;
      }
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    } catch {
      hapticError();
      showToast("error", "Erreur", "Erreur réseau");
    } finally {
      setGuestLoading(false);
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
    const receiptText = `Binq Pay — Envoi\n${formatMontant(sentMontant, devise)}\nÀ: ${targetUser.prenom} ${targetUser.nom}\nRéf: ${sentRef}\n${sentDate}`;
    const handleShareReceipt = async () => {
      if (navigator.share) {
        try { await navigator.share({ title: "Reçu Binq", text: receiptText }); } catch { /* cancelled */ }
      } else {
        try { await navigator.clipboard.writeText(receiptText); } catch { /* ignore */ }
      }
    };
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <SuccessConfetti />
        <div className="bg-white/[0.04] rounded-3xl p-8 max-w-md w-full text-center border border-white/[0.06] backdrop-blur-xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">Envoi effectué !</h1>
          <p className="text-3xl font-black text-emerald-400 mb-2">{formatMontant(sentMontant, devise)}</p>
          <p className="text-white/40 text-sm mb-1">
            À <span className="text-white font-semibold">{targetUser.prenom} {targetUser.nom}</span>
          </p>

          {/* Receipt */}
          <div className="bg-white/[0.03] rounded-xl p-3 my-4 border border-white/[0.06] text-left space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-white/30">Référence</span><span className="text-white/60 font-mono">{sentRef}</span></div>
            <div className="flex justify-between text-xs"><span className="text-white/30">Date</span><span className="text-white/60">{sentDate}</span></div>
            <div className="flex justify-between text-xs"><span className="text-white/30">Statut</span><span className="text-emerald-400 font-semibold">Confirmé</span></div>
          </div>

          {/* QR Receipt - scannable proof */}
          <div className="flex flex-col items-center my-3">
            <div className="bg-white rounded-lg p-2">
              <QRCodeSVG
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/pay/user/${userId}?ref=${sentRef}`}
                size={100}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
                includeMargin={true}
              />
            </div>
            <p className="text-[9px] text-white/20 mt-1.5 flex items-center gap-1"><QrCode className="w-2.5 h-2.5" />Preuve de paiement vérifiable</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/portefeuille"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-400 transition text-sm"
            >
              <Wallet className="w-4 h-4" />
              Portefeuille
            </Link>
            <button
              onClick={handleShareReceipt}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white/60 font-bold text-sm transition active:scale-95"
            >
              <Share2 className="w-4 h-4" />Reçu
            </button>
          </div>
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
            <div className="space-y-4">
              {/* Devise selector for guest */}
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

              {/* Guest card payment */}
              <button
                onClick={handleGuestPay}
                disabled={guestLoading || !montant || parseFloat(montant) <= 0}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guestLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                )}
                {guestLoading ? "Redirection..." : "Payer par carte bancaire"}
              </button>
              <p className="text-center text-[11px] text-white/25">Frais de 2% inclus • Pas de compte requis</p>

              <div className="relative flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[11px] text-white/20 font-semibold uppercase">ou</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Login for free payments */}
              <div className="text-center">
                <p className="text-white/30 text-xs mb-2">Payez 0% de frais avec votre portefeuille Binq</p>
                <Link
                  href={`/connexion?redirect=/pay/user/${userId}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white/[0.06] text-white/70 px-6 py-3 rounded-xl font-bold hover:bg-white/[0.1] transition text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Se connecter (0% frais)
                </Link>
                <p className="text-xs text-white/20 mt-3">
                  Pas encore de compte ?{" "}
                  <Link href={`/inscription?redirect=/pay/user/${userId}`} className="text-emerald-400 hover:underline">
                    Créer un compte
                  </Link>
                </p>
              </div>
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
