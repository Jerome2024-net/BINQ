"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess, hapticError } from "@/lib/haptics";
import { type DeviseCode, DEVISES, DEVISE_LIST, DEFAULT_DEVISE, formatMontant } from "@/lib/currencies";
import {
  getAvailableMethods,
  getPaymentMethod,
  calculateFees,
  type PaymentMethodId,
} from "@/lib/payment-gateway";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Smartphone,
  Send,
  QrCode,
  MessageSquare,
  Share2,
  ShieldCheck,
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
  const { showToast } = useToast();
  const userId = params.id as string;

  const [targetUser, setTargetUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [montant, setMontant] = useState("");
  const [message, setMessage] = useState("");
  const [devise, setDevise] = useState<DeviseCode>(DEFAULT_DEVISE);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentRef, setSentRef] = useState("");
  const [sentMontant, setSentMontant] = useState(0);
  const [sentDate, setSentDate] = useState("");

  const deviseConfig = DEVISES[devise];
  const methods = getAvailableMethods();

  useEffect(() => {
    if (methods.length > 0 && !selectedMethod) {
      setSelectedMethod(methods[0].id);
    }
  }, [methods, selectedMethod]);

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

  const parsedMontant = parseFloat(montant) || 0;
  const fees = selectedMethod && parsedMontant > 0
    ? calculateFees(parsedMontant, selectedMethod)
    : null;

  const handlePay = async () => {
    if (!targetUser || !selectedMethod) return;

    if (parsedMontant <= 0) {
      showToast("error", "Erreur", "Veuillez saisir un montant valide");
      return;
    }
    if (parsedMontant < deviseConfig.minTransfer) {
      showToast("error", "Erreur", `Montant minimum : ${formatMontant(deviseConfig.minTransfer, devise)}`);
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendeur_id: targetUser.id,
          montant: parsedMontant,
          devise,
          methode: selectedMethod,
          description: message.trim() || `Paiement a ${targetUser.prenom} ${targetUser.nom}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Paiement echoue");
        hapticError();
        return;
      }

      // If payment gateway returns a redirect URL, go there
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      // Otherwise, show success
      setSent(true);
      setSentRef(data.reference || "");
      setSentMontant(parsedMontant);
      setSentDate(new Date().toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }));
      hapticSuccess();
      showToast("success", "Paiement initie", `${formatMontant(parsedMontant, devise)} en cours de traitement`);
    } catch {
      hapticError();
      showToast("error", "Erreur", "Erreur reseau");
    } finally {
      setSending(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-black animate-spin mx-auto" />
          <p className="text-gray-400 text-sm mt-3">Chargement...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="bg-gray-50/80 rounded-3xl p-8 max-w-md w-full text-center border border-gray-200/50 backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Utilisateur introuvable</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.length > 1 ? router.back() : router.push("/")}
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition active:scale-95"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // Success
  if (sent && targetUser) {
    const receiptText = `Binq Pay\n${formatMontant(sentMontant, devise)}\nVendeur: ${targetUser.prenom} ${targetUser.nom}\nRef: ${sentRef}\n${sentDate}`;
    const handleShareReceipt = async () => {
      if (navigator.share) {
        try { await navigator.share({ title: "Recu Binq", text: receiptText }); } catch { /* cancelled */ }
      } else {
        try { await navigator.clipboard.writeText(receiptText); } catch { /* ignore */ }
      }
    };
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <SuccessConfetti />
        <div className="bg-gray-50/80 rounded-3xl p-8 max-w-md w-full text-center border border-gray-200/50 backdrop-blur-xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
            <CheckCircle2 className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Paiement effectue !</h1>
          <p className="text-3xl font-black text-blue-600 mb-2">{formatMontant(sentMontant, devise)}</p>
          <p className="text-gray-600 text-sm mb-1">
            {"Vendeur : "}<span className="text-gray-900 font-semibold">{targetUser.prenom} {targetUser.nom}</span>
          </p>

          {/* Receipt */}
          <div className="bg-gray-50/50 rounded-xl p-3 my-4 border border-gray-200/50 text-left space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-gray-700">Reference</span><span className="text-gray-700 font-mono">{sentRef}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-700">Date</span><span className="text-gray-700">{sentDate}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-700">Statut</span><span className="text-blue-600 font-semibold">Confirme</span></div>
          </div>

          {/* QR Receipt */}
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
            <p className="text-[9px] text-gray-600 mt-1.5 flex items-center gap-1"><QrCode className="w-2.5 h-2.5" />Preuve de paiement</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-600 transition text-sm"
            >
              Fermer
            </Link>
            <button
              onClick={handleShareReceipt}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-gray-50/80 hover:bg-gray-100 text-gray-700 font-bold text-sm transition active:scale-95"
            >
              <Share2 className="w-4 h-4" />Recu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!targetUser) return null;

  const initials = `${(targetUser.prenom || "?")[0]}${(targetUser.nom || "?")[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            <span className="text-black">Binq</span> Pay
          </h2>
          <p className="text-gray-700 text-sm mt-1 flex items-center justify-center gap-1.5">
            <QrCode className="w-3.5 h-3.5" />
            Paiement sécurisé
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-50/80 rounded-3xl p-8 border border-gray-200/50 backdrop-blur-xl">
          {/* User info */}
          <div className="flex flex-col items-center mb-6">
            {targetUser.avatar_url ? (
              <img
                src={targetUser.avatar_url}
                alt={targetUser.prenom}
                className="w-16 h-16 rounded-full object-cover mb-3 ring-2 ring-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3 ring-2 ring-gray-200">
                <span className="text-lg font-bold text-gray-600">{initials}</span>
              </div>
            )}
            <p className="text-lg font-semibold text-gray-900">
              {targetUser.prenom} {targetUser.nom}
            </p>
            <p className="text-gray-600 text-sm">Payer ce vendeur</p>
          </div>

          <div className="space-y-4">
            {/* Devise */}
            <div className="flex gap-2">
              {DEVISE_LIST.map((d) => {
                const dc = DEVISES[d];
                return (
                  <button
                    key={d}
                    onClick={() => { setDevise(d); setSelectedMethod(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      devise === d
                        ? "bg-blue-500 text-white border border-blue-500"
                        : "bg-gray-50/50 text-gray-600 border border-gray-200/50 hover:bg-gray-100/50"
                    }`}
                  >
                    <span>{dc.flag}</span>
                    <span>{dc.code}</span>
                  </button>
                );
              })}
            </div>

            {/* Montant */}
            <div className="bg-gray-50/50 rounded-2xl p-5 text-center border border-gray-200/50">
              <p className="text-sm text-gray-600 mb-3">Montant</p>
              <div className="relative">
                <input
                  type="number"
                  min={deviseConfig.minTransfer}
                  step={deviseConfig.decimals === 0 ? "1" : "0.01"}
                  placeholder={deviseConfig.decimals === 0 ? "5 000" : "10.00"}
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="w-full bg-transparent text-3xl font-black text-gray-900 text-center outline-none placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-gray-600 text-lg absolute right-4 top-1/2 -translate-y-1/2">
                  {deviseConfig.symbol}
                </span>
              </div>
            </div>

            {/* Payment methods */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Moyen de paiement</p>
              <div className="grid grid-cols-1 gap-2">
                {methods.map((m) => {
                  const isActive = selectedMethod === m.id;
                  const methodFees = parsedMontant > 0 ? calculateFees(parsedMontant, m.id) : null;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        isActive
                          ? "border-black bg-gray-50"
                          : "border-gray-200/60 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isActive ? "bg-gray-200" : "bg-gray-100"
                      }`}>
                        {m.provider === "stripe" ? (
                          <CreditCard className={`w-5 h-5 ${isActive ? "text-black" : "text-gray-600"}`} />
                        ) : (
                          <Smartphone className={`w-5 h-5 ${isActive ? "text-black" : "text-gray-600"}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${isActive ? "text-black" : "text-gray-900"}`}>{m.label}</p>
                        {methodFees && (
                          <p className="text-xs text-gray-500">
                            Frais : {formatMontant(methodFees.frais, devise)}
                          </p>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isActive ? "border-blue-500" : "border-gray-300"
                      }`}>
                        {isActive && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fees summary */}
            {fees && parsedMontant > 0 && (
              <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-200/50 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant</span>
                  <span className="text-gray-900 font-medium">{formatMontant(parsedMontant, devise)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frais</span>
                  <span className="text-gray-900 font-medium">{formatMontant(fees.frais, devise)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200/50">
                  <span className="text-gray-900 font-bold">Total</span>
                  <span className="text-blue-600 font-bold">{formatMontant(fees.totalPayeur, devise)}</span>
                </div>
              </div>
            )}

            {/* Message */}
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
              <input
                type="text"
                maxLength={100}
                placeholder="Message (optionnel)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl pl-9 pr-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-black transition text-sm"
              />
            </div>

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={sending || !montant || parsedMontant <= 0 || !selectedMethod}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3.5 rounded-xl font-bold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {sending ? "Paiement en cours..." : "Payer"}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Propulse par Binq &mdash; Paiement securise
        </p>
      </div>
    </div>
  );
}
