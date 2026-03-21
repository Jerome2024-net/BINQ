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
  ArrowUpRight,
} from "lucide-react";

interface Commande {
  id: string;
  montant: number;
  devise: string;
  statut: string;
  reference: string;
  methode_paiement: string;
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
  payee: { label: "Payée", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  confirmee: { label: "Confirmée", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
  livree: { label: "Livrée", icon: Truck, color: "text-emerald-600", bg: "bg-emerald-50" },
  annulee: { label: "Annulée", icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
};

export default function CommandesPage() {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
          <p className="text-[13px] text-gray-500 mb-6">Partagez votre boutique pour recevoir des commandes</p>
          <Link
            href="/ma-boutique"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white text-[14px] font-bold hover:bg-emerald-400 transition-all active:scale-[0.97]"
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

            return (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {/* Product image */}
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {c.produit?.image_url ? (
                    <img src={c.produit.image_url} alt={c.produit.nom} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {c.produit?.nom || "Produit"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${cfg.color} ${cfg.bg}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <p className="text-[14px] font-bold text-emerald-600 shrink-0">
                  +{formatMontant(c.montant, dv)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
