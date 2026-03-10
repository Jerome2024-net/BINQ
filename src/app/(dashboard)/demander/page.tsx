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
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Share2,
  QrCode,
  Sparkles,
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

const statusConfig: Record<string, { label: string; color: string; dot: string; icon: typeof Clock }> = {
  actif: { label: "Actif", color: "text-emerald-700 bg-emerald-50 border-emerald-100", dot: "bg-emerald-500", icon: Clock },
  paye: { label: "Payé", color: "text-cyan-700 bg-cyan-50 border-cyan-100", dot: "bg-cyan-500", icon: CheckCircle2 },
  annule: { label: "Annulé", color: "text-red-600 bg-red-50 border-red-100", dot: "bg-red-400", icon: XCircle },
  expire: { label: "Expiré", color: "text-gray-600 bg-gray-100 border-gray-200", dot: "bg-gray-400", icon: XCircle },
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
      showToast("success", "Lien créé", "Votre demande de paiement est prête !");
      setMontant("");
      setDescription("");
      setShowForm(false);
      fetchLinks();

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
        showToast("error", "Erreur", data.error || "Impossible d’annuler");
        return;
      }
      hapticMedium();
      showToast("success", "Annulé", "Demande de paiement annulée");
      fetchLinks();
    } catch {
      showToast("error", "Erreur", "Erreur réseau");
    } finally {
      setDeletingId(null);
    }
  };

  const activeLinks = links.filter((l) => l.statut === "actif");
  const pastLinks = links.filter((l) => l.statut !== "actif");

  const totalPaye = links.filter((l) => l.statut === "paye").length;
  const totalRecuMontant = links
    .filter((l) => l.statut === "paye" && l.montant)
    .reduce((acc, l) => acc + (l.montant || 0), 0);

  return (
    <div className="space-y-5 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Demander un paiement</h1>
        <p className="text-sm text-gray-600 mt-1">Cr&eacute;ez un lien ou un QR pour recevoir de l&apos;argent</p>
      </div>

      {/* Primary CTA */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-base hover:from-emerald-400 hover:to-emerald-500 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          Créer une demande
        </button>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-200/60 p-5 space-y-5 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Nouvelle demande</h2>
                <p className="text-[11px] text-gray-500">Remplissez et partagez en 3 secondes</p>
              </div>
            </div>
            <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Montant</label>
            <div className="relative">
              <input
                type="number"
                min={deviseConfig.minTransfer}
                step={deviseConfig.decimals === 0 ? "1" : "0.01"}
                placeholder={deviseConfig.decimals === 0 ? "5 000" : "10.00"}
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/60 rounded-2xl px-5 py-4 text-gray-900 text-2xl font-black placeholder-gray-300 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                {deviseConfig.symbol}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5 ml-1">Laissez vide pour montant libre</p>
          </div>

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
                      : "bg-gray-50/80 text-gray-600 border border-gray-200/50 hover:bg-gray-100/50"
                  }`}
                >
                  <span>{dc.flag}</span>
                  <span>{dc.code}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Description <span className="text-gray-400 normal-case font-medium">(optionnel)</span></label>
            <input
              type="text"
              maxLength={100}
              placeholder="Ex: Vente terminal, Remboursement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-50/80 border border-gray-200/60 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-300 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition text-sm"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2.5 bg-gray-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Link2 className="w-5 h-5" />
            )}
            {creating ? "Création..." : "Créer le lien de paiement"}
          </button>
        </div>
      )}

      {/* Stats bar */}
      {totalPaye > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-100/60">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-emerald-700">
              {totalPaye} paiement{totalPaye > 1 ? "s" : ""} reçu{totalPaye > 1 ? "s" : ""}
            </p>
            {totalRecuMontant > 0 && (
              <p className="text-lg font-black text-gray-900 -mt-0.5">
                {formatMontant(totalRecuMontant, devise)}
                <span className="text-xs font-bold text-gray-500 ml-1">total reçu</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        </div>
      ) : activeLinks.length === 0 && pastLinks.length === 0 ? (
        <div className="rounded-2xl bg-gray-50/50 border border-gray-200/50 p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <HandCoins className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-gray-900 font-bold text-base mb-1">Aucune demande</p>
          <p className="text-gray-500 text-sm mb-5">Créez votre première demande de paiement<br />et partagez-la en un clic.</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Créer une demande
            </button>
          )}
        </div>
      ) : (
        <>
          {activeLinks.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
                En cours ({activeLinks.length})
              </p>
              <div className="space-y-3">
                {activeLinks.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    copiedId={copiedId}
                    deletingId={deletingId}
                    devise={devise}
                    onCopy={handleCopy}
                    onShare={handleShare}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {pastLinks.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
                Historique ({pastLinks.length})
              </p>
              <div className="space-y-2">
                {pastLinks.map((link) => (
                  <PastLinkCard key={link.id} link={link} deletingId={deletingId} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Active Link Card — amount-first design
   ═══════════════════════════════════════════ */
function LinkCard({
  link,
  copiedId,
  deletingId,
  devise,
  onCopy,
  onShare,
  onDelete,
}: {
  link: PaymentLink;
  copiedId: string | null;
  deletingId: string | null;
  devise: DeviseCode;
  onCopy: (l: PaymentLink) => void;
  onShare: (l: PaymentLink) => void;
  onDelete: (id: string) => void;
}) {
  const status = statusConfig[link.statut] || statusConfig.actif;
  const [showQR, setShowQR] = useState(false);
  const linkUrl = typeof window !== "undefined" ? `${window.location.origin}/pay/${link.code}` : `/pay/${link.code}`;

  const dateStr = new Date(link.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden shadow-sm">
      <div className="p-4 pb-3">
        <p className="text-2xl font-black text-gray-900 tracking-tight">
          {link.montant
            ? formatMontant(link.montant, (link.devise as DeviseCode) || "XOF")
            : <span className="text-lg font-bold text-gray-500">Montant libre</span>}
        </p>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {link.description && (
            <>
              <p className="text-sm text-gray-600 font-medium truncate">{link.description}</p>
              <span className="text-gray-300">&middot;</span>
            </>
          )}
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </div>
          <span className="text-gray-300">&middot;</span>
          <p className="text-xs text-gray-400 whitespace-nowrap">{dateStr}</p>
        </div>
      </div>

      <div className="flex items-center border-t border-gray-100 divide-x divide-gray-100">
        <button
          onClick={() => onShare(link)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-emerald-600 text-xs font-bold hover:bg-emerald-50/50 transition-colors active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5" />
          Partager
        </button>
        <button
          onClick={() => setShowQR(!showQR)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors active:scale-95 ${
            showQR ? "text-emerald-600 bg-emerald-50/50" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          QR Code
        </button>
        <button
          onClick={() => onCopy(link)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors active:scale-95"
        >
          {copiedId === link.id ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copié !</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copier lien
            </>
          )}
        </button>
        <button
          onClick={() => onDelete(link.id)}
          disabled={deletingId === link.id}
          className="px-4 flex items-center justify-center py-3 text-red-400 hover:bg-red-50/50 transition-colors active:scale-95 disabled:opacity-50"
        >
          {deletingId === link.id ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {showQR && (
        <div className="flex flex-col items-center py-5 border-t border-gray-100 bg-gray-50/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <QRCodeSVG
              value={linkUrl}
              size={200}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="M"
              includeMargin={true}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-3">Scannez pour payer</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Past Link Card — compact, muted
   ═══════════════════════════════════════════ */
function PastLinkCard({ link, deletingId, onDelete }: { link: PaymentLink; deletingId: string | null; onDelete: (id: string) => void }) {
  const status = statusConfig[link.statut] || statusConfig.expire;

  const dateStr = new Date(link.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-200/40">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        link.statut === "paye" ? "bg-cyan-50" : "bg-gray-100"
      }`}>
        {link.statut === "paye" ? (
          <CheckCircle2 className="w-4 h-4 text-cyan-600" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">
          {link.montant
            ? formatMontant(link.montant, (link.devise as DeviseCode) || "XOF")
            : "Montant libre"}
        </p>
        <p className="text-[11px] text-gray-500 truncate">
          {link.description || "Sans description"} &middot; {dateStr}
        </p>
      </div>

      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${status.color}`}>
        {status.label}
      </span>

      <button
        onClick={() => onDelete(link.id)}
        disabled={deletingId === link.id}
        className="p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50/50 transition-colors active:scale-95 disabled:opacity-50"
      >
        {deletingId === link.id ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}