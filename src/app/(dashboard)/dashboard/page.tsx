"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_DEVISE, formatMontant, type DeviseCode } from "@/lib/currencies";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Package,
  Plus,
  ShoppingBag,
  Store,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";

interface BoutiqueInfo {
  id: string;
  nom: string;
  slug: string;
  ville?: string | null;
  logo_url?: string | null;
}

interface ProduitInfo {
  id: string;
  nom: string;
  prix: number;
  devise?: string;
  image_url?: string | null;
  stock?: number | null;
  ventes?: number | null;
}

interface CommandeInfo {
  id: string;
  reference?: string | null;
  statut: string;
  montant?: number;
  montant_total?: number;
  devise?: string;
  client_nom?: string | null;
  client_telephone?: string | null;
  adresse_livraison?: string | null;
  created_at?: string;
}

const activeStatuses = ["nouvelle", "payee", "acceptee", "preparation", "en_livraison"];

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    nouvelle: "Nouvelle",
    payee: "Payée",
    acceptee: "Acceptée",
    preparation: "Préparation",
    en_livraison: "En livraison",
    livree: "Livrée",
    annulee: "Annulée",
  };
  return labels[status] || status;
}

function timeAgo(value?: string) {
  if (!value) return "À l'instant";
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [boutique, setBoutique] = useState<BoutiqueInfo | null>(null);
  const [produits, setProduits] = useState<ProduitInfo[]>([]);
  const [commandes, setCommandes] = useState<CommandeInfo[]>([]);
  const [stats, setStats] = useState({ totalProduits: 0, totalCommandes: 0, totalVentes: 0, vues: 0 });
  const [loading, setLoading] = useState(true);
  const [devise] = useState<DeviseCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("binq_devise") as DeviseCode) || DEFAULT_DEVISE;
    }
    return DEFAULT_DEVISE;
  });

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch("/api/boutiques/me");
        const meData = await meRes.json();
        setBoutique(meData.boutique || null);
        setProduits(Array.isArray(meData.produits) ? meData.produits : []);
        setStats(meData.stats || { totalProduits: 0, totalCommandes: 0, totalVentes: 0, vues: 0 });

        if (meData.boutique) {
          const orderRes = await fetch("/api/commandes?role=vendeur&limit=6");
          const orderData = await orderRes.json();
          setCommandes(Array.isArray(orderData.commandes) ? orderData.commandes : []);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeOrders = useMemo(
    () => commandes.filter((commande) => activeStatuses.includes(commande.statut)),
    [commandes]
  );
  const lowStockProducts = useMemo(
    () => produits.filter((produit) => produit.stock !== null && produit.stock !== undefined && produit.stock <= 5),
    [produits]
  );
  const topProducts = useMemo(
    () => [...produits].sort((a, b) => Number(b.ventes || 0) - Number(a.ventes || 0)).slice(0, 3),
    [produits]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!boutique) {
    return (
      <div className="min-h-[calc(100vh-8rem)] relative overflow-hidden rounded-[2rem] bg-[#fff6cf] border border-white px-5 py-10 sm:p-10 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,197,94,0.20),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(250,204,21,0.42),transparent_30%),linear-gradient(180deg,#fff7d6_0%,#fffbea_62%,#f7f9fe_100%)]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center py-10 sm:py-16">
          <div className="w-20 h-20 rounded-[1.75rem] bg-white/90 border border-white shadow-xl shadow-emerald-950/10 flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-emerald-600" />
          </div>
          <p className="text-[12px] font-black text-emerald-700 uppercase tracking-[0.18em] mb-3">Commerce local · livraison · commandes</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.05em] text-slate-950">
            Bienvenue {user?.prenom || "sur Binq"}, ouvrez votre commerce.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Votre espace sert à vendre vos produits, recevoir des commandes et organiser les livraisons locales.
          </p>

          <div className="mt-8 grid sm:grid-cols-3 gap-3 text-left">
            {[
              { icon: Package, title: "Ajoutez vos produits", desc: "Menu, courses, pharmacie, boutique." },
              { icon: ShoppingBag, title: "Recevez les commandes", desc: "Le client commande depuis votre page." },
              { icon: Truck, title: "Préparez la livraison", desc: "Suivez chaque statut en temps réel." },
            ].map((item) => (
              <div key={item.title} className="bg-white/85 border border-white rounded-2xl p-4 shadow-sm">
                <item.icon className="w-5 h-5 text-emerald-600 mb-3" />
                <p className="font-black text-slate-950 text-sm">{item.title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <Link
            href="/ma-boutique"
            className="mt-8 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-7 py-3.5 rounded-2xl font-black text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            Créer mon commerce <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-8 space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#fff6cf] border border-white p-5 sm:p-7 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,197,94,0.18),transparent_32%),radial-gradient(circle_at_88%_10%,rgba(250,204,21,0.40),transparent_28%),linear-gradient(180deg,#fff7d6_0%,#fffbea_62%,#f7f9fe_100%)]" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/85 border border-white text-[11px] font-black uppercase tracking-wider text-emerald-700 mb-4">
              <Zap className="w-3.5 h-3.5" /> Tableau de bord commerce
            </p>
            <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.055em] text-slate-950">
              Bonjour {user?.prenom || ""},<br /> gérez vos commandes.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              Votre espace Binq est maintenant pensé pour le commerce local : produits, paniers, commandes et livraison rapide.
            </p>
          </div>
          <div className="bg-white/90 border border-white rounded-[1.75rem] p-4 min-w-[240px] shadow-xl shadow-emerald-950/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center overflow-hidden">
                {boutique.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={boutique.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-6 h-6 text-emerald-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-950 truncate">{boutique.nom}</p>
                <p className="text-xs text-slate-500 truncate">{boutique.ville || "Commerce local"}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/ma-boutique" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 text-white px-3 py-2 text-xs font-black hover:bg-emerald-700 transition">
                Gérer <ArrowRight className="w-3 h-3" />
              </Link>
              <a href={`/boutique/${boutique.slug}`} target="_blank" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 px-3 py-2 text-xs font-black hover:bg-emerald-100 transition">
                Voir <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp, label: "Chiffre d'affaires", value: formatMontant(stats.totalVentes || 0, devise), hint: "ventes encaissées" },
          { icon: ShoppingBag, label: "Commandes", value: String(stats.totalCommandes || commandes.length), hint: `${activeOrders.length} à traiter` },
          { icon: Package, label: "Produits", value: String(stats.totalProduits || produits.length), hint: `${lowStockProducts.length} stock faible` },
          { icon: Store, label: "Vues boutique", value: String(stats.vues || 0), hint: "visites publiques" },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <card.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[11px] text-slate-400 font-bold uppercase">{card.hint}</span>
            </div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wide">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-[1.15fr_0.85fr] gap-5">
        <div className="bg-white border border-slate-100 rounded-[1.75rem] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-black text-slate-950">Commandes à préparer</h2>
              <p className="text-sm text-slate-500">Priorité aux nouvelles commandes et livraisons.</p>
            </div>
            <Link href="/commandes" className="text-sm font-black text-emerald-700 hover:text-emerald-800">Tout voir</Link>
          </div>

          {commandes.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-slate-50 border border-slate-100">
              <ShoppingBag className="w-9 h-9 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">Aucune commande pour le moment</p>
              <p className="text-sm text-slate-400 mt-1">Partagez votre boutique pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commandes.slice(0, 5).map((commande) => {
                const total = Number(commande.montant_total || commande.montant || 0);
                return (
                  <Link key={commande.id} href="/commandes" className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 hover:border-emerald-100 hover:bg-emerald-50/40 transition">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                      {commande.statut === "livree" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Clock className="w-5 h-5 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-sm text-slate-950 truncate">{commande.client_nom || "Client"}</p>
                        <span className="px-2 py-0.5 rounded-full bg-white text-[10px] font-black text-emerald-700 border border-emerald-100">{statusLabel(commande.statut)}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{commande.adresse_livraison || commande.reference || "Commande locale"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-slate-950">{formatMontant(total, (commande.devise as DeviseCode) || devise)}</p>
                      <p className="text-[11px] text-slate-400">{timeAgo(commande.created_at)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-slate-950 text-white rounded-[1.75rem] p-5 sm:p-6 shadow-xl shadow-slate-950/10">
            <h2 className="text-lg font-black">Actions rapides</h2>
            <p className="text-sm text-white/60 mt-1">Tout pour lancer la vente locale.</p>
            <div className="grid gap-2 mt-5">
              <Link href="/ma-boutique" className="flex items-center justify-between rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-3 transition">
                <span className="flex items-center gap-2 text-sm font-bold"><Plus className="w-4 h-4" /> Ajouter un produit</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/commandes" className="flex items-center justify-between rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-3 transition">
                <span className="flex items-center gap-2 text-sm font-bold"><Truck className="w-4 h-4" /> Traiter les commandes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href={`/boutique/${boutique.slug}`} target="_blank" className="flex items-center justify-between rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-3 transition">
                <span className="flex items-center gap-2 text-sm font-black"><ExternalLink className="w-4 h-4" /> Ouvrir la boutique</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[1.75rem] p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Produits populaires</h2>
            <div className="mt-4 space-y-3">
              {topProducts.length === 0 ? (
                <p className="text-sm text-slate-400">Ajoutez vos premiers produits pour remplir votre boutique.</p>
              ) : (
                topProducts.map((produit) => (
                  <Link key={produit.id} href="/ma-boutique" className="flex items-center gap-3 rounded-2xl p-2 hover:bg-slate-50 transition">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                      {produit.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={produit.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-950 truncate">{produit.nom}</p>
                      <p className="text-xs text-slate-500">{Number(produit.ventes || 0)} vente{Number(produit.ventes || 0) > 1 ? "s" : ""}</p>
                    </div>
                    <p className="text-sm font-black text-slate-950">{formatMontant(Number(produit.prix || 0), (produit.devise as DeviseCode) || devise)}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
