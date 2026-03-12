"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";
import {
  Package,
  ShoppingCart,
  Store,
  Loader2,
  ChevronRight,
  CheckCircle2,
  Truck,
  XCircle,
  Clock,
  TrendingUp,
  ArrowDownLeft,
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
  totalAchats: number;
  totalVentes: number;
  nbAchats: number;
  nbVentes: number;
}

type Role = "acheteur" | "vendeur";

const statutConfig: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  payee: { label: "Payée", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  confirmee: { label: "Confirmée", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
  livree: { label: "Livrée", icon: Truck, color: "text-emerald-600", bg: "bg-emerald-50" },
  annulee: { label: "Annulée", icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
};

export default function CommandesPage() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role>("acheteur");
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchCommandes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/commandes?role=${role}`);
        const data = await res.json();
        setCommandes(data.commandes || []);
        setStats(data.stats || null);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchCommandes();
  }, [user, role]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black tracking-tight">Commandes</h1>
        <p className="text-gray-500 text-xs mt-0.5">Suivez vos achats et ventes</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-700">Mes achats</span>
            </div>
            <p className="text-lg font-black text-emerald-700">{stats.nbAchats}</p>
            <p className="text-[10px] text-emerald-600/70 font-semibold mt-0.5">
              Total: {formatMontant(stats.totalAchats, "XOF")}
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 border border-cyan-200/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-cyan-700">Mes ventes</span>
            </div>
            <p className="text-lg font-black text-cyan-700">{stats.nbVentes}</p>
            <p className="text-[10px] text-cyan-600/70 font-semibold mt-0.5">
              Total: {formatMontant(stats.totalVentes, "XOF")}
            </p>
          </div>
        </div>
      )}

      {/* Role toggle */}
      <div className="flex bg-gray-100 rounded-xl p-0.5">
        <button
          onClick={() => setRole("acheteur")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
            role === "acheteur" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Mes achats
        </button>
        <button
          onClick={() => setRole("vendeur")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
            role === "vendeur" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          <Store className="w-4 h-4" />
          Mes ventes
        </button>
      </div>

      {/* Commandes list */}
      {commandes.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold text-sm">
            {role === "acheteur" ? "Aucun achat" : "Aucune vente"}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {role === "acheteur"
              ? "Explorez les produits et achetez en 1 tap"
              : "Créez votre boutique et commencez à vendre"}
          </p>
          <Link
            href={role === "acheteur" ? "/dashboard" : "/ma-boutique"}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 transition-all active:scale-95 mt-4"
          >
            {role === "acheteur" ? (
              <>
                <ShoppingCart className="w-4 h-4" />
                Explorer
              </>
            ) : (
              <>
                <Store className="w-4 h-4" />
                Ma boutique
              </>
            )}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {commandes.map((c) => {
            const cfg = statutConfig[c.statut] || statutConfig.payee;
            const StatusIcon = cfg.icon;
            const dv = (c.devise as DeviseCode) || "XOF";

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Product image */}
                  <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                    {c.produit?.image_url ? (
                      <img src={c.produit.image_url} alt={c.produit.nom} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {c.produit?.nom || "Produit"}
                    </p>
                    {c.boutique && (
                      <Link href={`/boutique/${c.boutique.slug}`} className="text-[11px] text-emerald-600 font-semibold hover:underline">
                        {c.boutique.nom}
                      </Link>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${cfg.color} ${cfg.bg}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black ${role === "acheteur" ? "text-gray-900" : "text-emerald-600"}`}>
                      {role === "vendeur" && "+"}{formatMontant(c.montant, dv)}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{c.reference}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
