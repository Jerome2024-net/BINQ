"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import BinqLogo from "@/components/BinqLogo";
import { hapticSuccess, hapticError } from "@/lib/haptics";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  Send,
  Store,
  Share2,
  QrCode,
  CreditCard,
  Smartphone,
  ChevronRight,
  Shield,
  Zap,
  Globe,
  Lock,
  Phone,
  Download,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import dynamic from "next/dynamic";
const SuccessConfetti = dynamic(() => import("@/components/SuccessConfetti"), {
  ssr: false,
});
import { type DeviseCode, DEVISES, formatMontant } from "@/lib/currencies";
import {
  type PaymentMethodId,
  calculateFees,
  getPaymentMethod,
  isMobileMoneyMethod,
  getAvailableMethods,
} from "@/lib/payment-gateway";

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
  const [paidMethod, setPaidMethod] = useState("");

  // Payment method selection
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodId | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Charger les infos du lien
  useEffect(() => {
    if (!code) return;

    const fetchLink = async () => {
      try {
        const res = await fetch(`/api/payment-links/${code}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Lien introuvable");
          if (data.statut === "paye")
            setError("Ce lien de paiement a déjà été utilisé.");
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

  // ── Paiement (carte / mobile money) ──
  const handlePay = async () => {
    if (!link || !selectedMethod) return;

    const montant = link.montant ? link.montant : parseFloat(montantLibre);
    if (!montant || montant <= 0) {
      showToast("error", "Erreur", "Veuillez saisir un montant valide");
      return;
    }

    if (isMobileMoneyMethod(selectedMethod) && !phoneNumber.trim()) {
      showToast("error", "Erreur", "Numéro de téléphone requis");
      return;
    }

    setPaying(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      const res = await fetch("/api/payment/universal", {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: link.code,
          method: selectedMethod,
          montant,
          phoneNumber: phoneNumber.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Paiement échoué");
        return;
      }

      // Redirection pour Stripe / PayDunya
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      // Succès direct
      setPaid(true);
      setPaidRef(data.reference);
      setPaidMontant(montant);
      setPaidMethod(getPaymentMethod(selectedMethod)?.label || selectedMethod);
      setPaidDate(new Date().toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }));
      hapticSuccess();
    } catch {
      hapticError();
      showToast("error", "Erreur", "Erreur lors du paiement");
    } finally {
      setPaying(false);
    }
  };

  // ── LOADING ──
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-black animate-spin mx-auto" />
          <p className="text-gray-400 text-sm mt-3">Chargement du paiement...</p>
        </div>
      </div>
    );
  }

  // ── ERROR ──
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="bg-gray-50/80 rounded-3xl p-8 max-w-md w-full text-center border border-gray-200/50 backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien non disponible</h1>
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

  // ── SUCCESS ──
  if (paid) {
    const linkDevise = (link?.devise as DeviseCode) || "XOF";
    const receiptText = `Binq Pay — Paiement\n${formatMontant(paidMontant, linkDevise)}\nÀ: ${link?.createur.prenom} ${link?.createur.nom}\nMéthode: ${paidMethod}\nRéf: ${paidRef}\n${paidDate}`;
    const handleShareReceipt = async () => {
      if (navigator.share) {
        try { await navigator.share({ title: "Reçu Binq", text: receiptText }); } catch { /* cancelled */ }
      } else {
        try { await navigator.clipboard.writeText(receiptText); showToast("success", "Copié", "Reçu copié"); } catch { /* ignore */ }
      }
    };

    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <SuccessConfetti />
        <div className="bg-gray-50/80 rounded-3xl p-8 max-w-md w-full text-center border border-gray-200/50 backdrop-blur-xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
            <CheckCircle2 className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Paiement effectué !</h1>
          <p className="text-3xl font-black text-blue-600 mb-2">{formatMontant(paidMontant, linkDevise)}</p>
          <p className="text-gray-600 text-sm mb-1">
            À <span className="text-gray-900 font-semibold">{link?.createur.prenom} {link?.createur.nom}</span>
          </p>

          <div className="bg-gray-50/50 rounded-xl p-3 my-4 border border-gray-200/50 text-left space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-gray-700">Référence</span><span className="text-gray-700 font-mono">{paidRef}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-700">Méthode</span><span className="text-gray-700">{paidMethod}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-700">Date</span><span className="text-gray-700">{paidDate}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-700">Statut</span><span className="text-blue-600 font-semibold">Confirmé</span></div>
          </div>

          <div className="flex flex-col items-center my-3">
            <div className="bg-white rounded-lg p-2">
              <QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : ""}/pay/${code}?ref=${paidRef}`} size={100} bgColor="#FFFFFF" fgColor="#000000" level="M" includeMargin={true} />
            </div>
            <p className="text-[9px] text-gray-600 mt-1.5 flex items-center gap-1"><QrCode className="w-2.5 h-2.5" />Preuve de paiement vérifiable</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/")}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-600 transition text-sm"
            >
              Fermer
            </button>
            <button onClick={handleShareReceipt} className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-gray-50/80 hover:bg-gray-100 text-gray-700 font-bold text-sm transition active:scale-95">
              <Share2 className="w-4 h-4" />Recu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!link) return null;

  // ── Computed values ──
  const creatorInitials = `${(link.createur.prenom || "?")[0]}${(link.createur.nom || "?")[0]}`.toUpperCase();
  const montantFixe = link.montant !== null;
  const linkDevise = (link.devise as DeviseCode) || "XOF";
  const currentAmount = montantFixe ? link.montant! : parseFloat(montantLibre) || 0;

  // Méthodes de paiement (carte + mobile money)
  const paymentMethods = getAvailableMethods().filter((m) => m.id !== "binq_wallet");

  // ═══════════════════════════════════════════
  // SEND LINKS — Simple claim flow
  // ═══════════════════════════════════════════
  if (link.type === "send") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-2">
              <BinqLogo size="sm" />
              <span className="text-lg font-black text-gray-900 tracking-tight">Pay</span>
            </div>
          </div>

          <div className="bg-gray-50/80 rounded-3xl p-8 border border-gray-200/50 backdrop-blur-xl text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Lien non disponible</h1>
            <p className="text-gray-600 text-sm mb-6">Ce type de lien n&apos;est plus pris en charge.</p>
            <button
              onClick={() => window.history.length > 1 ? router.back() : router.push("/")}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition active:scale-95"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // MAIN RENDER — 3 cas UX (Alipay/WeChat model)
  // ═══════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2">
            <BinqLogo size="sm" />
            <span className="text-lg font-black text-gray-900 tracking-tight">Billetterie</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Shield className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-gray-500 text-xs font-medium">Paiement sécurisé</p>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">

          {/* Creator header */}
          <div className="bg-gradient-to-r from-black to-gray-900 px-6 py-5 text-white">
            <div className="flex items-center gap-4">
              {link.createur.avatar_url ? (
                <img src={link.createur.avatar_url} alt={link.createur.prenom} className="w-14 h-14 rounded-full object-cover ring-2 ring-white/30" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30">
                  <span className="text-lg font-bold text-white">{creatorInitials}</span>
                </div>
              )}
              <div>
                <p className="text-lg font-bold">{link.createur.prenom} {link.createur.nom}</p>
                <p className="text-white/70 text-sm">{link.isMerchant ? "Marchand vérifié" : "Paiement sécurisé"}</p>
              </div>
              {link.isMerchant && <div className="ml-auto"><Store className="w-6 h-6 text-white/60" /></div>}
            </div>
          </div>

          <div className="p-6">

            {/* Montant */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-center border border-gray-100">
              {montantFixe ? (
                <>
                  <p className="text-sm text-gray-500 mb-1 font-medium">Montant à payer</p>
                  <p className="text-4xl font-black text-gray-900">{formatMontant(link.montant!, linkDevise)}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-3 font-medium">Entrez le montant</p>
                  <div className="relative">
                    <input
                      type="number"
                      min={DEVISES[linkDevise].minTransfer}
                      step={DEVISES[linkDevise].decimals === 0 ? "1" : "0.01"}
                      placeholder={DEVISES[linkDevise].decimals === 0 ? "5 000" : "0.00"}
                      value={montantLibre}
                      onChange={(e) => setMontantLibre(e.target.value)}
                      className="w-full bg-transparent text-4xl font-black text-gray-900 text-center outline-none placeholder-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-gray-400 text-lg absolute right-4 top-1/2 -translate-y-1/2">{DEVISES[linkDevise].symbol}</span>
                  </div>
                </>
              )}
            </div>

            {/* Description */}
            {link.description && (
              <div className="bg-gray-50 rounded-xl p-3 mb-6 border border-gray-200/50">
                <p className="text-sm text-gray-700 italic">&ldquo;{link.description}&rdquo;</p>
              </div>
            )}

            {/* ═══════════════════════════════════
                Moyens de paiement
                ═══════════════════════════════════ */}
            <div>
                <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  Choisissez votre moyen de paiement
                </p>

                <div className="space-y-2 mb-6">
                  {paymentMethods.map((method) => {
                    const isSelected = selectedMethod === method.id;
                    const feesInfo = currentAmount > 0 ? calculateFees(currentAmount, method.id) : null;

                    return (
                      <button
                        key={method.id}
                        onClick={() => { setSelectedMethod(method.id); }}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left ${
                          isSelected
                            ? "border-black bg-gray-50 ring-1 ring-black/10"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shrink-0 ${method.color}`}>
                          {method.id === "card_stripe" && <CreditCard className="w-5 h-5" />}
                          {isMobileMoneyMethod(method.id) && <Smartphone className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{method.label}</p>
                          <p className="text-xs text-gray-500 truncate">{method.description}</p>
                        </div>

                        <div className="text-right shrink-0">
                          {feesInfo && feesInfo.frais > 0 ? (
                            <p className="text-xs text-gray-500">+{formatMontant(feesInfo.frais, linkDevise)}</p>
                          ) : (
                            <p className="text-xs text-gray-400">{method.feePercent}%</p>
                          )}
                          <ChevronRight className={`w-4 h-4 ml-auto mt-0.5 transition-colors ${isSelected ? "text-black" : "text-gray-300"}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Phone input for mobile money */}
                {selectedMethod && isMobileMoneyMethod(selectedMethod) && (
                  <div className="mb-6 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      placeholder="+221 7X XXX XX XX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition"
                    />
                    <p className="text-[11px] text-gray-400 mt-1.5">Le numéro associé à votre compte {getPaymentMethod(selectedMethod)?.label}</p>
                  </div>
                )}

                {/* Fee summary */}
                {selectedMethod && currentAmount > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-6 border border-gray-100 animate-in fade-in duration-200">
                    {(() => {
                      const f = calculateFees(currentAmount, selectedMethod);
                      return (
                        <>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Montant</span>
                            <span className="text-gray-700">{formatMontant(currentAmount, linkDevise)}</span>
                          </div>
                          {f.frais > 0 && (
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Frais ({getPaymentMethod(selectedMethod)?.feePercent}%)</span>
                              <span className="text-gray-700">+{formatMontant(f.frais, linkDevise)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5 mt-1.5">
                            <span className="text-gray-900">Total</span>
                            <span className="text-gray-900">{formatMontant(f.totalPayeur, linkDevise)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Pay button */}
                <button
                  onClick={handlePay}
                  disabled={paying || !selectedMethod || currentAmount <= 0 || (selectedMethod !== null && isMobileMoneyMethod(selectedMethod) && !phoneNumber.trim())}
                  className="w-full flex items-center justify-center gap-2.5 bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-blue-500/20"
                >
                  {paying ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Traitement en cours...</>
                  ) : selectedMethod === "card_stripe" ? (
                    <><Lock className="w-4 h-4" />Payer par carte</>
                  ) : selectedMethod && isMobileMoneyMethod(selectedMethod) ? (
                    <><Smartphone className="w-4 h-4" />Payer via {getPaymentMethod(selectedMethod)?.label}</>
                  ) : (
                    <><CreditCard className="w-4 h-4" />Choisissez un moyen de paiement</>
                  )}
                </button>

                {/* CTA "Inscription Binq" pour non-users */}
                {!user && (
                  <div className="mt-5 bg-gray-50 rounded-2xl p-4 border border-gray-200 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-blue-500" />
                      <p className="text-sm font-bold text-gray-900">Vous aussi, vendez avec Binq</p>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      Cr&eacute;ez votre boutique et encaissez via QR Code. Commission r&eacute;duite.
                    </p>
                    <Link
                      href={`/inscription?redirect=/pay/${code}`}
                      className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      Cr&eacute;er mon compte &mdash; Gratuit
                    </Link>
                  </div>
                )}

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 mt-5">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Shield className="w-3.5 h-3.5" /><span className="text-[10px] font-medium">Securise</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Globe className="w-3.5 h-3.5" /><span className="text-[10px] font-medium">Universel</span>
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-5">
          <p className="text-[11px] text-gray-400">Propulsé par Binq — Billetterie QR avec paiement intégré</p>
        </div>
      </div>
    </div>
  );
}
