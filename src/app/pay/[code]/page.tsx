"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess, hapticError } from "@/lib/haptics";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  Wallet,
  ArrowRight,
  Send,
  User,
  Store,
  Share2,
  Receipt,
  QrCode,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import dynamic from "next/dynamic";
const SuccessConfetti = dynamic(() => import("@/components/SuccessConfetti"), { ssr: false });
import { type DeviseCode, DEVISES, formatMontant } from "@/lib/currencies";

interface PaymentLinkPublic {
  id: string;
  code: string;
  montant: number | null;
  devise: string;
  description: string | null;
  statut: string;
  type: "send" | "request";
  isMerchant?: boolean;
  createur: {
    prenom: string;
    nom: string;
    avatar_url: string | null;
  };
}

export default function PayPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const code = params.code as string;

  const [link, setLink] = useState<PaymentLinkPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [montantLibre, setMontantLibre] = useState("");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paidRef, setPaidRef] = useState("");
  const [paidMontant, setPaidMontant] = useState(0);
  const [paidDate, setPaidDate] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);

  // Check for guest payment success
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("guest_success") === "true") {
      const amount = parseFloat(params.get("amount") || "0");
      setPaid(true);
      setPaidMontant(amount);
      setPaidRef("GUEST");
      setPaidDate(new Date().toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }));
    }
  }, []);

  // Charger les infos du lien
  useEffect(() => {
    if (!code) return;

    const fetchLink = async () => {
      try {
        const res = await fetch(`/api/payment-links/${code}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Lien introuvable");
          if (data.statut === "paye") setError("Ce lien de paiement a déjà été utilisé.");
          return;
        }

        setLink(data.link);
      } catch {
        setError("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchLink();
  }, [code]);

  const handlePay = async () => {
    if (!user) return;
    if (!link) return;

    const montant = link.montant ? link.montant : parseFloat(montantLibre);
    if (!montant || montant <= 0) {
      showToast("error", "Erreur", "Veuillez saisir un montant valide");
      return;
    }
    const linkDevise = (link.devise as DeviseCode) || "XOF";
    const minAmount = DEVISES[linkDevise].minTransfer;
    if (montant < minAmount) {
      showToast("error", "Erreur", `Montant minimum : ${formatMontant(minAmount, linkDevise)}`);
      return;
    }

    setPaying(true);
    try {
      const res = await fetch("/api/payment-links/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: link.code, montant }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Paiement échoué");
        return;
      }

      setPaid(true);
      setPaidRef(data.transfert.reference);
      setPaidMontant(montant);
      setPaidDate(new Date().toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }));
      const isSend = link.type === "send";
      hapticSuccess();
      showToast("success", isSend ? "Argent récupéré" : "Paiement effectué", `${formatMontant(montant, (link.devise as DeviseCode) || "XOF")} ${isSend ? "reçus" : "envoyés"} avec succès`);
    } catch {
      hapticError();
      showToast("error", "Erreur", "Erreur lors du paiement");
    } finally {
      setPaying(false);
    }
  };

  const handleGuestPay = async () => {
    if (!link) return;
    const montant = link.montant ? link.montant : parseFloat(montantLibre);
    if (!montant || montant <= 0) {
      showToast("error", "Erreur", "Veuillez saisir un montant valide");
      return;
    }
    const linkDevise = (link.devise as DeviseCode) || "XOF";
    const minAmount = DEVISES[linkDevise].minTransfer;
    if (montant < minAmount) {
      showToast("error", "Erreur", `Montant minimum : ${formatMontant(minAmount, linkDevise)}`);
      return;
    }
    setGuestLoading(true);
    try {
      const res = await fetch("/api/payment/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "link",
          code: link.code,
          montant,
          devise: linkDevise,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Erreur de paiement");
        return;
      }
      // Redirect to Stripe Checkout
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
          <p className="text-white/40">Chargement du lien de paiement...</p>
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
          <h1 className="text-xl font-bold text-white mb-2">Lien non disponible</h1>
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
  if (paid) {
    const receiptText = `Binq Pay — ${link?.type === "send" ? "Réception" : "Paiement"}\n${formatMontant(paidMontant, (link?.devise as DeviseCode) || "XOF")}\n${link?.type === "send" ? "De" : "À"}: ${link?.createur.prenom} ${link?.createur.nom}\nRéf: ${paidRef}\n${paidDate}`;
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
          <h1 className="text-2xl font-black text-white mb-1">
            {link?.type === "send" ? "Argent récupéré !" : "Paiement effectué !"}
          </h1>
          <p className="text-3xl font-black text-emerald-400 mb-2">
            {formatMontant(paidMontant, (link?.devise as DeviseCode) || "XOF")}
          </p>
          <p className="text-white/40 text-sm mb-1">
            {link?.type === "send" ? (
              <>De <span className="text-white font-semibold">{link?.createur.prenom} {link?.createur.nom}</span></>
            ) : (
              <>À <span className="text-white font-semibold">{link?.createur.prenom} {link?.createur.nom}</span></>
            )}
          </p>

          {/* Receipt */}
          <div className="bg-white/[0.03] rounded-xl p-3 my-4 border border-white/[0.06] text-left space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-white/30">Référence</span><span className="text-white/60 font-mono">{paidRef}</span></div>
            <div className="flex justify-between text-xs"><span className="text-white/30">Date</span><span className="text-white/60">{paidDate}</span></div>
            <div className="flex justify-between text-xs"><span className="text-white/30">Statut</span><span className="text-emerald-400 font-semibold">Confirmé</span></div>
          </div>

          {/* QR Receipt - scannable proof */}
          <div className="flex flex-col items-center my-3">
            <div className="bg-white rounded-lg p-2">
              <QRCodeSVG
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/pay/${code}?ref=${paidRef}`}
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

  if (!link) return null;

  const creatorInitials = `${(link.createur.prenom || "?")[0]}${(link.createur.nom || "?")[0]}`.toUpperCase();
  const montantFixe = link.montant !== null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight">
            <span className="text-emerald-400">Binq</span> Pay
          </h2>
          <p className="text-white/30 text-sm mt-1">{link?.isMerchant ? "Terminal de paiement marchand" : "Paiement sécurisé entre particuliers"}</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] rounded-3xl p-8 border border-white/[0.06] backdrop-blur-xl">
          {/* Creator */}
          <div className="flex flex-col items-center mb-6">
            {link.createur.avatar_url ? (
              <img
                src={link.createur.avatar_url}
                alt={link.createur.prenom}
                className="w-16 h-16 rounded-full object-cover mb-3 ring-2 ring-emerald-500/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-600/30 flex items-center justify-center mb-3 ring-2 ring-emerald-500/30">
                <span className="text-lg font-bold text-emerald-300">{creatorInitials}</span>
              </div>
            )}
            <p className="text-lg font-semibold text-white">
              {link.createur.prenom} {link.createur.nom}
            </p>
            <p className="text-white/40 text-sm">
              {link.isMerchant ? "Terminal de paiement" : link.type === "send" ? "vous envoie de l'argent" : "vous demande un paiement"}
            </p>
          </div>

          {/* Montant */}
          <div className="bg-white/[0.03] rounded-2xl p-5 mb-6 text-center border border-white/[0.06]">
            {link.type === "send" ? (
              <>
                <p className="text-sm text-white/40 mb-1">Montant à récupérer</p>
                <p className="text-3xl font-black text-emerald-400">
                  {formatMontant(link.montant!, (link.devise as DeviseCode) || "XOF")}
                </p>
              </>
            ) : montantFixe ? (
              <>
                <p className="text-sm text-white/40 mb-1">Montant à payer</p>
                <p className="text-3xl font-black text-white">
                  {formatMontant(link.montant!, (link.devise as DeviseCode) || "XOF")}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-white/40 mb-3">Montant libre</p>
                <div className="relative">
                  <input
                    type="number"
                    min={DEVISES[(link.devise as DeviseCode) || "XOF"].minTransfer}
                    step={DEVISES[(link.devise as DeviseCode) || "XOF"].decimals === 0 ? "1" : "0.01"}
                    placeholder={DEVISES[(link.devise as DeviseCode) || "XOF"].decimals === 0 ? "5 000" : "0.00"}
                    value={montantLibre}
                    onChange={(e) => setMontantLibre(e.target.value)}
                    className="w-full bg-transparent text-3xl font-black text-white text-center outline-none placeholder-white/15 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-white/20 text-lg absolute right-4 top-1/2 -translate-y-1/2">{DEVISES[(link.devise as DeviseCode) || "XOF"].symbol}</span>
                </div>
              </>
            )}
          </div>

          {/* Description */}
          {link.description && (
            <div className="bg-white/[0.03] rounded-xl p-3 mb-6 border border-white/[0.06]">
              <p className="text-sm text-white/60">&ldquo;{link.description}&rdquo;</p>
            </div>
          )}

          {/* Action */}
          {!user ? (
            <div className="space-y-4">
              {/* Guest card payment — for "request" type only */}
              {link.type !== "send" && (
                <>
                  {/* Free amount input for guest if montant is libre */}
                  {!link.montant && (
                    <div className="bg-white/[0.03] rounded-2xl p-5 text-center border border-white/[0.06]">
                      <p className="text-sm text-white/40 mb-3">Montant à payer</p>
                      <div className="relative">
                        <input
                          type="number"
                          min={DEVISES[(link.devise as DeviseCode) || "XOF"].minTransfer}
                          step={DEVISES[(link.devise as DeviseCode) || "XOF"].decimals === 0 ? "1" : "0.01"}
                          placeholder={DEVISES[(link.devise as DeviseCode) || "XOF"].decimals === 0 ? "5 000" : "0.00"}
                          value={montantLibre}
                          onChange={(e) => setMontantLibre(e.target.value)}
                          className="w-full bg-transparent text-3xl font-black text-white text-center outline-none placeholder-white/15 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-white/20 text-lg absolute right-4 top-1/2 -translate-y-1/2">{DEVISES[(link.devise as DeviseCode) || "XOF"].symbol}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleGuestPay}
                    disabled={guestLoading || (!link.montant && (!montantLibre || parseFloat(montantLibre) <= 0))}
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
                </>
              )}

              {/* Login / signup — wallet payment (0% fees) */}
              {link.isMerchant ? (
                <>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <p className="text-xs text-emerald-400/80 font-semibold">Payez 0% de frais avec Binq</p>
                    <p className="text-[11px] text-white/30 mt-0.5">Créez un compte gratuit en 30 secondes pour payer depuis votre portefeuille.</p>
                  </div>
                  <Link
                    href={`/inscription?redirect=/pay/${code}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-white/[0.06] text-white/70 px-6 py-3 rounded-xl font-bold hover:bg-white/[0.1] transition text-sm"
                  >
                    <User className="w-5 h-5" />
                    Créer un compte gratuit (0% frais)
                  </Link>
                  <Link
                    href={`/connexion?redirect=/pay/${code}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-white/[0.04] text-white/50 px-6 py-2.5 rounded-xl font-bold hover:bg-white/[0.08] transition text-xs"
                  >
                    <LogIn className="w-4 h-4" />
                    J&apos;ai déjà un compte
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-white/30 text-xs mb-3">
                      {link.type === "send"
                        ? "Connectez-vous pour récupérer cet argent"
                        : "Payez 0% de frais avec votre portefeuille Binq"}
                    </p>
                    <Link
                      href={`/connexion?redirect=/pay/${code}`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-white/[0.06] text-white/70 px-6 py-3 rounded-xl font-bold hover:bg-white/[0.1] transition text-sm"
                    >
                      <LogIn className="w-5 h-5" />
                      Se connecter (0% frais)
                    </Link>
                    <p className="text-xs text-white/20 mt-3">
                      Pas encore de compte ?{" "}
                      <Link href={`/inscription?redirect=/pay/${code}`} className="text-emerald-400 hover:underline">
                        Créer un compte
                      </Link>
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={handlePay}
              disabled={paying || (link.type !== "send" && !montantFixe && (!montantLibre || parseFloat(montantLibre) <= 0))}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className={`w-5 h-5 ${link.type === "send" ? "rotate-180" : ""}`} />
              )}
              {paying ? (link.type === "send" ? "Récupération..." : "Paiement en cours...") : (link.type === "send" ? "Récupérer l'argent" : "Payer")}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-xs text-white/15">
            Paiement sécurisé via Binq. Vos fonds sont débités de votre portefeuille.
          </p>
          {link.isMerchant && !user && (
            <p className="text-[11px] text-white/20">
              Binq est ouvert à tous : particuliers, commerçants, freelances.
              <Link href="/inscription" className="text-emerald-400/60 hover:text-emerald-400 ml-1">Rejoignez-nous</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
