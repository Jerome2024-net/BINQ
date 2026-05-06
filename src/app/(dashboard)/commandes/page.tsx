"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";
import {
  Package,
  Store,
  Loader2,
  CheckCircle2,
  Truck,
  XCircle,
  Clock,
  Phone,
  MapPin,
} from "lucide-react";

interface Commande {
  id: string;
  montant: number;
  devise: string;
  statut: string;
  reference: string;
  methode_paiement: string;
  client_nom?: string | null;
  client_telephone?: string | null;
  adresse_livraison?: string | null;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  delivery_geocoded_address?: string | null;
  note_livraison?: string | null;
  sous_total?: number | null;
  frais_livraison?: number | null;
  montant_total?: number | null;
  note?: string | null;
  created_at: string;
  produit: {
    id: string;
    nom: string;
    image_url: string | null;
    prix: number;
    devise: string;
  } | null;
  boutique: {
    id: string;
    nom: string;
    slug: string;
    logo_url: string | null;
  } | null;
}

interface Stats {
  totalVentes: number;
  nbVentes: number;
}

const statutConfig: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  nouvelle: { label: "Nouvelle", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
  payee: { label: "Payée", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  acceptee: { label: "Acceptée", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
  preparation: { label: "Préparation", icon: Package, color: "text-violet-600", bg: "bg-violet-50" },
  en_livraison: { label: "En livraison", icon: Truck, color: "text-indigo-600", bg: "bg-indigo-50" },
  confirmee: { label: "Confirmée", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
  livree: { label: "Livrée", icon: Truck, color: "text-blue-600", bg: "bg-blue-50" },
  annulee: { label: "Annulée", icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
};

function parseDeliveryNote(c: Commande) {
  try {
    const parsed = c.note ? JSON.parse(c.note) : null;
    return parsed?.type === "local_delivery" ? parsed : null;
  } catch {
    return null;
  }
}

function getMapDirectionsUrl(latitude?: number | null, longitude?: number | null, address?: string | null) {
  if (latitude && longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return null;
}

const nextStatus: Record<string, { statut: string; label: string }> = {
  nouvelle: { statut: "acceptee", label: "Accepter" },
  payee: { statut: "acceptee", label: "Accepter" },
  acceptee: { statut: "preparation", label: "Préparer" },
  preparation: { statut: "en_livraison", label: "Livrer" },
  en_livraison: { statut: "livree", label: "Terminer" },
};

export default function CommandesPage() {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchCommandes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/commandes?role=vendeur`);
        const data = await res.json();
        setCommandes(data.commandes || []);
        setStats(data.stats ? { totalVentes: data.stats.totalVentes || 0, nbVentes: data.stats.nbVentes || 0 } : null);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchCommandes();
  }, [user]);

  const updateStatut = async (commandeId: string, statut: string) => {
    setUpdatingId(commandeId);
    try {
      const res = await fetch("/api/commandes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commande_id: commandeId, statut }),
      });
      const data = await res.json();
      if (res.ok && data.commande) {
        setCommandes((prev) => prev.map((c) => c.id === commandeId ? { ...c, ...data.commande } : c));
      }
    } catch { /* ignore */ }
    finally { setUpdatingId(null); }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-8 pb-28">
      {/* Header */}
      <h1 className="text-[22px] font-black tracking-tight text-gray-900">Mes ventes</h1>

      {/* Stats */}
      {stats && (
        <div className="mt-6 flex items-center gap-6">
          <div>
            <p className="text-[28px] font-black text-gray-900">{formatMontant(stats.totalVentes, "XOF")}</p>
            <p className="text-[12px] text-gray-500 font-medium mt-0.5">Chiffre d&apos;affaires</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div>
            <p className="text-[28px] font-black text-gray-900">{stats.nbVentes}</p>
            <p className="text-[12px] text-gray-500 font-medium mt-0.5">Ventes</p>
          </div>
        </div>
      )}

      {/* Commandes list */}
      {commandes.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-[14px] font-semibold text-gray-900 mb-1">Aucune vente</p>
          <p className="text-[13px] text-gray-500 mb-6">Ajoutez vos produits et partagez votre commerce</p>
          <Link
            href="/ma-boutique"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-500 text-white text-[14px] font-bold hover:bg-blue-400 transition-all active:scale-[0.97]"
          >
            <Store className="w-4 h-4" />
            Ma boutique
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {commandes.map((c) => {
            const cfg = statutConfig[c.statut] || statutConfig.payee;
            const StatusIcon = cfg.icon;
            const dv = (c.devise as DeviseCode) || "XOF";
            const delivery = parseDeliveryNote(c);
            const clientNom = c.client_nom || delivery?.client_nom || "Client";
            const clientTelephone = c.client_telephone || delivery?.client_telephone;
            const adresse = c.delivery_geocoded_address || c.adresse_livraison || delivery?.delivery_geocoded_address || delivery?.adresse_livraison;
            const deliveryLatitude = c.delivery_latitude || delivery?.delivery_latitude || null;
            const deliveryLongitude = c.delivery_longitude || delivery?.delivery_longitude || null;
            const directionsUrl = getMapDirectionsUrl(deliveryLatitude, deliveryLongitude, adresse);
            const note = c.note_livraison || delivery?.note_livraison;
            const action = nextStatus[c.statut];

            return (
              <div
                key={c.id}
                className="rounded-3xl bg-gray-50 border border-gray-100 p-3.5 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {c.produit?.image_url ? (
                      <img src={c.produit.image_url} alt={c.produit.nom} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-black text-gray-900 truncate">
                          {clientNom}
                        </p>
                        <p className="text-[12px] text-gray-500 truncate">
                          {c.produit?.nom || "Commande locale"}
                        </p>
                      </div>
                      <p className="text-[14px] font-black text-blue-600 shrink-0">
                        +{formatMontant(c.montant_total || c.montant, dv)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${cfg.color} ${cfg.bg}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                </div>

                {(clientTelephone || adresse || note) && (
                  <div className="mt-3 space-y-1.5 text-[12px] text-gray-500">
                    {clientTelephone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-300" />{clientTelephone}</p>}
                    {adresse && <p className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-300 mt-0.5" />{adresse}</p>}
                    {directionsUrl && (
                      <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-500">
                        <MapPin className="w-3.5 h-3.5" /> Ouvrir l&apos;itinéraire
                      </a>
                    )}
                    {note && <p className="text-gray-400">Note : {note}</p>}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  {action && (
                    <button
                      onClick={() => updateStatut(c.id, action.statut)}
                      disabled={updatingId === c.id}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-black text-white text-[12px] font-black disabled:opacity-60 active:scale-[0.98] transition"
                    >
                      {updatingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                      {action.label}
                    </button>
                  )}
                  {c.statut !== "annulee" && c.statut !== "livree" && (
                    <button
                      onClick={() => updateStatut(c.id, "annulee")}
                      disabled={updatingId === c.id}
                      className="px-3 py-2.5 rounded-2xl bg-red-50 text-red-600 text-[12px] font-bold disabled:opacity-60 active:scale-[0.98] transition"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
