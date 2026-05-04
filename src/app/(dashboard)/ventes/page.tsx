"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";
import { BarChart3, Loader2, Package, ShoppingBag, Store, TrendingUp, Truck } from "lucide-react";

interface Produit { id: string; nom: string; prix: number; devise?: string; image_url?: string | null; stock?: number | null; ventes?: number | null; }
interface Commande { id: string; statut: string; montant?: number; montant_total?: number; devise?: string; client_nom?: string | null; }

export default function VentesPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [stats, setStats] = useState({ totalProduits: 0, totalCommandes: 0, totalVentes: 0, vues: 0 });
  const [hasBoutique, setHasBoutique] = useState(false);
  const [loading, setLoading] = useState(true);
  const [devise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("binq_devise") as DeviseCode) || "XOF";
    return "XOF";
  });

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch("/api/boutiques/me");
        const meData = await meRes.json();
        setHasBoutique(Boolean(meData.boutique));
        setProduits(Array.isArray(meData.produits) ? meData.produits : []);
        setStats(meData.stats || { totalProduits: 0, totalCommandes: 0, totalVentes: 0, vues: 0 });
        if (meData.boutique) {
          const orderRes = await fetch("/api/commandes?role=vendeur&limit=50");
          const orderData = await orderRes.json();
          setCommandes(Array.isArray(orderData.commandes) ? orderData.commandes : []);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const deliveredOrders = useMemo(() => commandes.filter((c) => c.statut === "livree" || c.statut === "payee"), [commandes]);
  const revenue = stats.totalVentes || deliveredOrders.reduce((sum, c) => sum + Number(c.montant_total || c.montant || 0), 0);
  const totalUnits = produits.reduce((sum, p) => sum + Number(p.ventes || 0), 0);
  const averageOrder = commandes.length > 0 ? revenue / commandes.length : 0;
  const bestProducts = [...produits].sort((a, b) => Number(b.ventes || 0) - Number(a.ventes || 0)).slice(0, 5);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /></div>;

  if (!hasBoutique) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center">
        <div className="max-w-sm">
          <Store className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-950">Aucun commerce</h1>
          <p className="text-sm text-slate-500 mt-2">Créez votre boutique pour suivre vos ventes, commandes et produits.</p>
          <Link href="/ma-boutique" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white">Créer ma boutique</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-8 space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Performance commerce</p>
        <h1 className="text-3xl font-black tracking-[-0.05em] text-slate-950 mt-1">Stats des ventes</h1>
        <p className="text-sm text-slate-500 mt-2">Suivez vos produits, commandes et revenus marchands.</p>
      </div>

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp, label: "Chiffre d'affaires", value: formatMontant(revenue, devise), hint: "encaissé" },
          { icon: ShoppingBag, label: "Commandes", value: String(stats.totalCommandes || commandes.length), hint: "total" },
          { icon: Package, label: "Articles vendus", value: String(totalUnits), hint: "unités" },
          { icon: BarChart3, label: "Panier moyen", value: formatMontant(averageOrder, devise), hint: "par commande" },
        ].map((card) => <div key={card.label} className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between mb-4"><div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center"><card.icon className="w-5 h-5 text-emerald-600" /></div><span className="text-[11px] font-bold uppercase text-slate-400">{card.hint}</span></div><p className="text-xs font-black uppercase tracking-wide text-slate-500">{card.label}</p><p className="text-2xl font-black text-slate-950 mt-1">{card.value}</p></div>)}
      </section>

      <section className="grid lg:grid-cols-[1fr_0.9fr] gap-5">
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-black text-slate-950">Produits les plus vendus</h2><p className="text-sm text-slate-500">Classement par volume de ventes.</p></div><Link href="/ma-boutique" className="text-sm font-black text-emerald-700">Catalogue</Link></div>
          {bestProducts.length === 0 ? <div className="py-12 text-center rounded-2xl bg-slate-50"><Package className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="font-bold text-slate-700">Aucune vente produit</p><p className="text-sm text-slate-400">Ajoutez et partagez vos produits.</p></div> : <div className="space-y-2">{bestProducts.map((produit) => <Link key={produit.id} href={`/produit/${produit.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 hover:bg-emerald-50/40 transition"><div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center">{produit.image_url ? <img src={produit.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-300" />}</div><div className="flex-1 min-w-0"><p className="text-sm font-black text-slate-950 truncate">{produit.nom}</p><p className="text-xs text-slate-500">{Number(produit.ventes || 0)} vente{Number(produit.ventes || 0) > 1 ? "s" : ""}</p></div><p className="text-sm font-black text-slate-950">{formatMontant(Number(produit.prix || 0), (produit.devise as DeviseCode) || devise)}</p></Link>)}</div>}
        </div>

        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-black text-slate-950">Flux commandes</h2><p className="text-sm text-slate-500">Activité récente côté livraison.</p></div><Truck className="w-5 h-5 text-emerald-600" /></div>
          {commandes.length === 0 ? <p className="text-sm text-slate-400">Aucune commande récente.</p> : <div className="space-y-2">{commandes.slice(0, 6).map((commande) => <Link key={commande.id} href="/commandes" className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 hover:bg-emerald-50 transition"><div className="min-w-0"><p className="text-sm font-black text-slate-950 truncate">{commande.client_nom || "Client"}</p><p className="text-xs text-slate-500">{commande.statut}</p></div><p className="text-sm font-black text-slate-950">{formatMontant(Number(commande.montant_total || commande.montant || 0), (commande.devise as DeviseCode) || devise)}</p></Link>)}</div>}
        </div>
      </section>
    </div>
  );
}
