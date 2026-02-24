"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
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
} from "lucide-react";

interface PaymentLinkPublic {
  id: string;
  code: string;
  montant: number | null;
  devise: string;
  description: string | null;
  statut: string;
  type: "send" | "request";
  createur: {
    prenom: string;
    nom: string;
    avatar_url: string | null;
  };
}

function formatMontant(montant: number, devise: string = "EUR"): string {
  if (devise === "USD") return `$${montant.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${montant.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
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
    if (montant < 1) {
      showToast("error", "Erreur", "Montant minimum : 1 €");
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
      const isSend = link.type === "send";
      showToast("success", isSend ? "Argent récupéré" : "Paiement effectué", `${formatMontant(montant)} ${isSend ? "reçus" : "envoyés"} avec succès`);
    } catch {
      showToast("error", "Erreur", "Erreur lors du paiement");
    } finally {
      setPaying(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement du lien de paiement...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-800/60 rounded-3xl p-8 max-w-md w-full text-center border border-gray-700/50 backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Lien non disponible</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  // Success
  if (paid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-800/60 rounded-3xl p-8 max-w-md w-full text-center border border-gray-700/50 backdrop-blur-xl">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {link?.type === "send" ? "Argent récupéré !" : "Paiement effectué !"}
          </h1>
          <p className="text-gray-400 mb-2">
            {link?.type === "send" ? (
              <>Vous avez reçu <span className="text-white font-semibold">{link?.montant ? formatMontant(link.montant) : ""}</span> de <span className="text-white font-semibold">{link?.createur.prenom} {link?.createur.nom}</span>.</>
            ) : (
              <>Votre paiement à <span className="text-white font-semibold">{link?.createur.prenom} {link?.createur.nom}</span> a été effectué avec succès.</>
            )}
          </p>
          <p className="text-xs text-gray-500 mb-6">Réf: {paidRef}</p>
          <Link
            href="/dashboard/portefeuille"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition"
          >
            <Wallet className="w-4 h-4" />
            Mon portefeuille
          </Link>
        </div>
      </div>
    );
  }

  if (!link) return null;

  const creatorInitials = `${(link.createur.prenom || "?")[0]}${(link.createur.nom || "?")[0]}`.toUpperCase();
  const montantFixe = link.montant !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight">
            <span className="text-primary-400">Binq</span> Pay
          </h2>
          <p className="text-gray-500 text-sm mt-1">Paiement sécurisé entre particuliers</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800/60 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-xl">
          {/* Creator */}
          <div className="flex flex-col items-center mb-6">
            {link.createur.avatar_url ? (
              <img
                src={link.createur.avatar_url}
                alt={link.createur.prenom}
                className="w-16 h-16 rounded-full object-cover mb-3 ring-2 ring-primary-500/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-600/30 flex items-center justify-center mb-3 ring-2 ring-primary-500/30">
                <span className="text-lg font-bold text-primary-300">{creatorInitials}</span>
              </div>
            )}
            <p className="text-lg font-semibold text-white">
              {link.createur.prenom} {link.createur.nom}
            </p>
            <p className="text-gray-400 text-sm">
              {link.type === "send" ? "vous envoie de l'argent" : "vous demande un paiement"}
            </p>
          </div>

          {/* Montant */}
          <div className="bg-gray-900/50 rounded-2xl p-5 mb-6 text-center border border-gray-700/30">
            {link.type === "send" ? (
              <>
                <p className="text-sm text-gray-400 mb-1">Montant à récupérer</p>
                <p className="text-3xl font-black text-primary-400">
                  {formatMontant(link.montant!, link.devise)}
                </p>
              </>
            ) : montantFixe ? (
              <>
                <p className="text-sm text-gray-400 mb-1">Montant à payer</p>
                <p className="text-3xl font-black text-white">
                  {formatMontant(link.montant!, link.devise)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-3">Montant libre</p>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    value={montantLibre}
                    onChange={(e) => setMontantLibre(e.target.value)}
                    className="w-full bg-transparent text-3xl font-black text-white text-center outline-none placeholder-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-gray-500 text-lg absolute right-4 top-1/2 -translate-y-1/2">€</span>
                </div>
              </>
            )}
          </div>

          {/* Description */}
          {link.description && (
            <div className="bg-gray-700/30 rounded-xl p-3 mb-6 border border-gray-700/30">
              <p className="text-sm text-gray-300">&ldquo;{link.description}&rdquo;</p>
            </div>
          )}

          {/* Action */}
          {!user ? (
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-4">
                Connectez-vous pour {link.type === "send" ? "récupérer cet argent" : "effectuer ce paiement"}
              </p>
              <Link
                href={`/auth/login?redirect=/pay/${code}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-primary-700 transition"
              >
                <LogIn className="w-5 h-5" />
                Se connecter
              </Link>
              <p className="text-xs text-gray-500 mt-3">
                Pas encore de compte ?{" "}
                <Link href={`/auth/register?redirect=/pay/${code}`} className="text-primary-400 hover:underline">
                  Créer un compte
                </Link>
              </p>
            </div>
          ) : (
            <button
              onClick={handlePay}
              disabled={paying || (link.type !== "send" && !montantFixe && (!montantLibre || parseFloat(montantLibre) <= 0))}
              className={`w-full flex items-center justify-center gap-2 ${link.type === "send" ? "bg-primary-600 hover:bg-primary-700" : "bg-primary-600 hover:bg-primary-700"} text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed`}
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
        <p className="text-center text-xs text-gray-600 mt-6">
          Paiement sécurisé via Binq. Vos fonds sont débités de votre portefeuille.
        </p>
      </div>
    </div>
  );
}
