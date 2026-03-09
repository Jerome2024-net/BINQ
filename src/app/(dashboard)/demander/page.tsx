"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess, hapticMedium } from "@/lib/haptics";
import {
  type DeviseCode,
  DEVISE_LIST,
  DEVISES,
  DEFAULT_DEVISE,
  formatMontant,
} from "@/lib/currencies";
import {
  HandCoins,
  Link2,
  Copy,
  Check,
  Trash2,
  Loader2,
  Plus,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Share2,
  MessageSquare,
  QrCode,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface PaymentLink {
  id: string;
  code: string;
  montant: number | null;
  devise: string;
  description: string | null;
  statut: string;
  type: string;
  usage_unique: boolean;
  created_at: string;
  paye_par: string | null;
  paye_at: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  actif: { label: "Actif", color: "text-emerald-600 bg-emerald-50", icon: Clock },
  paye: { label: "Payé", color: "text-cyan-600 bg-cyan-50", icon: CheckCircle2 },
  annule: { label: "Annulé", color: "text-red-500 bg-red-50", icon: XCircle },
  expire: { label: "Expiré", color: "text-gray-300 bg-gray-50/80", icon: XCircle },
};

export default function DemanderPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [devise, setDevise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("binq_devise") as DeviseCode) || DEFAULT_DEVISE;
    }
    return DEFAULT_DEVISE;
  });

  const deviseConfig = DEVISES[devise];

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/payment-links");
      const data = await res.json();
      setLinks((data.links || []).filter((l: PaymentLink) => !l.type || l.type === "request"));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchLinks();
  }, [user, fetchLinks]);

  const getShareUrl = (code: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/pay/${code}`;
    }
    return `/pay/${code}`;
  };

  const handleCopy = async (link: PaymentLink) => {
    const url = getShareUrl(link.code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(link.id);
      hapticMedium();
      showToast("success", "Copié", "Lien copié dans le presse-papiers");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("error", "Erreur", "Impossible de copier le lien");
    }
  };

  const handleShare = async (link: PaymentLink) => {
    const url = getShareUrl(link.code);
    const montantText = link.montant
      ? formatMontant(link.montant, link.devise as DeviseCode)
      : "montant libre";
    const text = `${link.description || "Demande de paiement"} — ${montantText}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Binq — Demande de paiement", text, url });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy(link);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload: Record<string, unknown> = { devise };
      if (montant) {
        const parsed = parseFloat(montant);
        if (isNaN(parsed) || parsed <= 0) {
          showToast("error", "Erreur", "Montant invalide");
          setCreating(false);
          return;
        }
        if (parsed < deviseConfig.minTransfer) {
          showToast("error", "Erreur", `Montant minimum : ${formatMontant(deviseConfig.minTransfer, devise)}`);
          setCreating(false);
          return;
        }
        payload.montant = parsed;
      }
      if (description.trim()) payload.description = description.trim();

      const res = await fetch("/api/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Impossible de créer le lien");
        return;
      }

      hapticSuccess();
      showToast("success", "Lien créé", "Votre lien de demande est prêt !");
      setMontant("");
      setDescription("");
      setShowForm(false);
      fetchLinks();

      // Auto-copy the new link
      const url = getShareUrl(data.link.code);
      try {
        await navigator.clipboard.writeText(url);
        setCopiedId(data.link.id);
        setTimeout(() => setCopiedId(null), 3000);
      } catch {
        /* ignore */
      }
    } catch {
      showToast("error", "Erreur", "Erreur réseau");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/payment-links?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showToast("error", "Erreur", data.error || "Impossible d\u2019annuler");
        return;
      }
      hapticMedium();
      showToast("success", "Annulé", "Lien de paiement annulé");
      fetchLinks();
    } catch {
      showToast("error", "Erreur", "Erreur réseau");
    } finally {
      setDeletingId(null);
    }
  };

  const activeLinks = links.filter((l) => l.statut === "actif");
  const pastLinks = links.filter((l) => l.statut !== "actif");

  return (
    <div className="space-y-6 pb-28">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Demander</h1>
          <p className="text-xs text-gray-500 mt-0.5">Créez un lien pour recevoir un paiement</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 transition-all active:scale-95"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Annuler" : "Nouveau"}
        </button>
      </div>

      {/* ── Create Form ── */}
      {showForm && (
        <div className="rounded-2xl bg-gray-50/50 border border-gray-200/50 p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-1">
            <HandCoins className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">Nouvelle demande</h2>
          </div>

          {/* Devise */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Devise</label>
            <div className="flex gap-2">
              {DEVISE_LIST.map((d) => {
                const dc = DEVISES[d];
                return (
                  <button
                    key={d}
                    onClick={() => setDevise(d)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      devise === d
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                        : "bg-gray-50/50 text-gray-400 border border-gray-200/50 hover:bg-gray-100/50"
                    }`}
                  >
                    <span>{dc.flag}</span>
                    <span>{dc.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Montant <span className="text-gray-400">(optionnel — laissez vide pour montant libre)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={deviseConfig.minTransfer}
                step={deviseConfig.decimals === 0 ? "1" : "0.01"}
                placeholder={deviseConfig.decimals === 0 ? "5 000" : "10.00"}
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl px-4 py-3 text-gray-900 text-lg font-bold placeholder-gray-400 outline-none focus:border-emerald-200 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                {deviseConfig.symbol}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Description <span className="text-gray-400">(optionnel)</span>
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                maxLength={100}
                placeholder="Ex: Remboursement restaurant"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl pl-9 pr-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-200 transition text-sm"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Link2 className="w-5 h-5" />
            )}
            {creating ? "Création..." : "Créer le lien"}
          </button>
        </div>
      )}

      {/* ── Active Links ── */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
          Liens actifs {activeLinks.length > 0 && `(${activeLinks.length})`}
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          </div>
        ) : activeLinks.length === 0 ? (
          <div className="rounded-2xl bg-gray-50/50 border border-gray-200/50 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50/50 flex items-center justify-center mx-auto mb-3">
              <HandCoins className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold text-sm mb-1">Aucun lien actif</p>
            <p className="text-gray-400 text-xs">Créez un lien pour demander un paiement.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                copiedId={copiedId}
                deletingId={deletingId}
                onCopy={handleCopy}
                onShare={handleShare}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Past Links ── */}
      {pastLinks.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
            Historique ({pastLinks.length})
          </p>
          <div className="space-y-3">
            {pastLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                copiedId={copiedId}
                deletingId={deletingId}
                onCopy={handleCopy}
                onShare={handleShare}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Link Card Component ── */
function LinkCard({
  link,
  copiedId,
  deletingId,
  onCopy,
  onShare,
  onDelete,
}: {
  link: PaymentLink;
  copiedId: string | null;
  deletingId: string | null;
  onCopy: (l: PaymentLink) => void;
  onShare: (l: PaymentLink) => void;
  onDelete: (id: string) => void;
}) {
  const status = statusConfig[link.statut] || statusConfig.actif;
  const StatusIcon = status.icon;
  const isActive = link.statut === "actif";
  const [showQR, setShowQR] = useState(false);
  const linkUrl = typeof window !== "undefined" ? `${window.location.origin}/pay/${link.code}` : `/pay/${link.code}`;

  return (
    <div className="rounded-2xl bg-gray-50/50 border border-gray-200/50 p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {link.description ? (
            <p className="text-sm font-bold text-gray-900 truncate">{link.description}</p>
          ) : (
            <p className="text-sm font-bold text-gray-400 italic">Sans description</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(link.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${status.color}`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </div>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <HandCoins className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-lg font-black text-gray-900">
            {link.montant
              ? formatMontant(link.montant, (link.devise as DeviseCode) || "XOF")
              : "Montant libre"}
          </p>
          <p className="text-[10px] text-gray-400 font-mono">{link.code}</p>
        </div>
      </div>

      {/* Actions */}
      {isActive && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCopy(link)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-50/80 hover:bg-gray-100 text-gray-500 text-xs font-bold transition-all active:scale-95"
          >
            {copiedId === link.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copier
              </>
            )}
          </button>
          <button
            onClick={() => setShowQR(!showQR)}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95 ${
              showQR
                ? "bg-emerald-50 text-emerald-600"
                : "bg-gray-50/80 hover:bg-gray-100 text-gray-400"
            }`}
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={() => onShare(link)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/60 text-emerald-600 text-xs font-bold transition-all active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            Partager
          </button>
          <button
            onClick={() => onDelete(link.id)}
            disabled={deletingId === link.id}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-50 text-red-500 transition-all active:scale-95 disabled:opacity-50"
          >
            {deletingId === link.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* QR Code */}
      {isActive && showQR && (
        <div className="flex flex-col items-center py-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-white rounded-xl p-4 mb-2">
            <QRCodeSVG
              value={linkUrl}
              size={240}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="M"
              includeMargin={true}
            />
          </div>
          <p className="text-[10px] text-gray-400">Scannez pour payer</p>
        </div>
      )}

      {/* Link preview for active links */}
      {isActive && (
        <div className="flex items-center gap-2 bg-gray-50/50 rounded-lg px-3 py-2 border border-gray-200/50">
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <p className="text-[11px] text-gray-500 font-mono truncate">
            {linkUrl}
          </p>
        </div>
      )}
    </div>
  );
}
