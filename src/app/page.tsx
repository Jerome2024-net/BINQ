"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Search,
  Zap,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Store,
  Package,
  Clock,
  Menu,
  X,
  QrCode,
  Utensils,
  MapPin,
  Sparkles,
  Leaf,
} from "lucide-react";

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f7f9fe] font-sans antialiased text-slate-950 overflow-x-hidden">

      {/* ═══════ HEADER ═══════ */}
      <header className="fixed top-0 inset-x-0 z-[60] bg-white/75 backdrop-blur-2xl border-b border-white/70 shadow-sm shadow-slate-200/40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 via-green-500 to-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <QrCode className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-slate-950">Binq</span>
          </Link>

          <div className="flex items-center gap-5">
            <Link href="/explorer" className="text-[13px] text-slate-500 hover:text-slate-950 transition-colors font-medium">
              Commander
            </Link>
            <Link href="/connexion" className="text-[13px] text-slate-500 hover:text-slate-950 transition-colors font-medium hidden sm:inline">
              Connexion
            </Link>
            <Link href="/inscription" className="hidden md:inline-flex text-[13px] px-4 py-2 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
              Devenir partenaire
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border border-white pb-4 pt-3 px-4 mx-3 mt-1 rounded-2xl shadow-xl shadow-slate-900/10">
            <div className="flex flex-col gap-1">
              <Link href="/explorer" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-sm">Commander</Link>
              <Link href="/connexion" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-sm">Connexion</Link>
              <Link href="/inscription" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl bg-emerald-600 text-white text-sm text-center font-semibold">Devenir partenaire</Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-screen overflow-hidden bg-[#ffe963]">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.55),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(16,185,129,0.34),transparent_26%),linear-gradient(180deg,#ffef74_0%,#fff2ad_55%,#f7f9fe_100%)]" />
        <div className="absolute -top-24 right-[-7rem] w-[34rem] h-[34rem] bg-white/35 rounded-full blur-3xl" />
        <div className="absolute top-56 left-[-8rem] w-96 h-96 bg-emerald-300/35 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-28 sm:pt-36 pb-16 min-h-screen flex flex-col items-center justify-center text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/85 border border-white rounded-full mb-6 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">Livraison locale · restaurants · boutiques</span>
            </div>

            <h1 className="text-[3.2rem] sm:text-7xl lg:text-8xl font-black tracking-[-0.075em] leading-[0.88] mb-6 text-slate-950">
              Commandez.<br />
              <span className="text-emerald-700">Recevez vite.</span>
            </h1>
            <p className="text-base sm:text-xl text-slate-700 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
              Restaurants, courses, pharmacies et boutiques locales : trouvez ce qu&apos;il vous faut, payez en sécurité et recevez rapidement.
            </p>

            <div className="bg-white rounded-[1.75rem] p-2.5 shadow-2xl shadow-emerald-950/10 border border-white max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                  <input
                    aria-label="Adresse de livraison"
                    placeholder="Entrez votre adresse de livraison"
                    className="w-full bg-transparent outline-none text-sm sm:text-base font-semibold text-slate-950 placeholder:text-slate-400"
                  />
                </div>
                <Link href="/explorer" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 active:scale-[0.98]">
                  Voir les commerces <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {[
                { icon: Utensils, label: "Restaurants", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=360&q=80" },
                { icon: Store, label: "Courses", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=360&q=80" },
                { icon: Leaf, label: "Pharmacie", image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=360&q=80" },
                { icon: ShoppingBag, label: "Boutiques", image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=360&q=80" },
              ].map((item, i) => (
                <Link key={i} href="/explorer" className="group overflow-hidden bg-white/90 border border-white rounded-[1.6rem] p-2 shadow-sm hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-950/10 transition-all">
                  <div className="relative h-24 sm:h-28 rounded-[1.25rem] overflow-hidden bg-slate-100">
                    <img src={item.image} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 to-transparent" />
                    <div className="absolute right-2 top-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  <span className="block py-3 text-sm font-black text-slate-900 text-center">{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-[12px] sm:text-[13px] text-slate-600 font-semibold">
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 border border-white shadow-sm"><Truck className="w-4 h-4 text-emerald-500" /> Livraison rapide</span>
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 border border-white shadow-sm"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Paiement sécurisé</span>
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 border border-white shadow-sm"><Store className="w-4 h-4 text-amber-500" /> Commerces locaux</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ COMMENT ÇA MARCHE — 3 steps ═══════ */}
      <section id="fonctionnalites" className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 sm:mb-18">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-white shadow-sm text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-4">Simple et immédiat</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.04em] text-slate-950 mb-3">Commandez en 3 gestes</h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">Adresse, panier, livraison. Binq va droit au but.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: "01",
                icon: Search,
                title: "Entrez l'adresse",
                desc: "Binq affiche les restaurants, boutiques et services ouverts autour de vous.",
                gradient: "from-emerald-500 to-green-500",
              },
              {
                step: "02",
                icon: ShoppingBag,
                title: "Remplissez le panier",
                desc: "Ajoutez vos articles, vérifiez le total et confirmez la commande.",
                gradient: "from-amber-500 to-yellow-500",
              },
              {
                step: "03",
                icon: Truck,
                title: "Recevez vite",
                desc: "Le commerce prépare, le livreur arrive et vous suivez la commande.",
                gradient: "from-emerald-500 to-green-600",
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="relative overflow-hidden bg-white border border-white rounded-[1.75rem] p-6 sm:p-8 shadow-sm shadow-slate-200/80 hover:shadow-2xl hover:shadow-emerald-900/10 hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-emerald-50 group-hover:bg-yellow-50 transition-colors" />
                  <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5 shadow-lg shadow-black/10`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="relative text-[10px] font-bold text-slate-300 uppercase tracking-widest">{item.step}</span>
                  <h3 className="relative text-lg font-extrabold text-slate-950 mt-1 mb-2">{item.title}</h3>
                  <p className="relative text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ UN QR POUR TOUT — Use cases ═══════ */}
      <section id="pourqui" className="pb-20 sm:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-white shadow-sm text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-4">Tout près de vous</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.04em] text-slate-950 mb-3">De quoi avez-vous besoin ?</h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">Repas, courses, santé, beauté : une seule plateforme pour commander local.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: Utensils, label: "Restaurants", desc: "Repas, snacks & boissons", gradient: "from-red-500 to-rose-500", bg: "bg-red-50" },
              { icon: ShoppingBag, label: "Boutiques", desc: "Mode, accessoires, cadeaux", gradient: "from-pink-500 to-rose-500", bg: "bg-pink-50" },
              { icon: Store, label: "Supermarchés", desc: "Courses du quotidien", gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50" },
              { icon: Leaf, label: "Pharmacies", desc: "Santé & bien-être", gradient: "from-teal-500 to-emerald-500", bg: "bg-teal-50" },
              { icon: Sparkles, label: "Beauté", desc: "Soins, salons & services", gradient: "from-violet-500 to-purple-500", bg: "bg-violet-50" },
              { icon: Package, label: "Services locaux", desc: "Commandes sur demande", gradient: "from-sky-500 to-blue-500", bg: "bg-sky-50" },
            ].map((item, i) => (
              <div key={i} className="group bg-white border border-white rounded-[1.5rem] p-5 sm:p-6 shadow-sm shadow-slate-200/70 hover:shadow-2xl hover:shadow-emerald-900/10 hover:-translate-y-1 transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-md shadow-black/10`}>
                  <item.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-950 mb-0.5">{item.label}</h3>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 3 PILIERS ═══════ */}
      <section className="py-20 sm:py-28 bg-white/70 border-y border-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-3xl sm:text-5xl font-black tracking-[-0.04em] text-slate-950 mb-4">Pourquoi Binq</h2>
          <p className="text-center text-sm sm:text-base text-slate-500 max-w-md mx-auto mb-12 sm:mb-16">Une expérience directe : commande claire, paiement sécurisé, livraison locale.</p>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 text-center">
            {[
              { icon: Clock, title: "Rapide", desc: "Moins d'étapes, moins d'attente, plus d'efficacité.", color: "text-amber-500", bg: "bg-amber-50" },
              { icon: ShieldCheck, title: "Fiable", desc: "Commande enregistrée, commerce notifié, suivi lisible.", color: "text-emerald-500", bg: "bg-emerald-50" },
              { icon: Truck, title: "Proche", desc: "Les commerces de votre quartier deviennent accessibles en quelques taps.", color: "text-emerald-500", bg: "bg-emerald-50" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-[1.75rem] border border-slate-100 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-shadow">
                <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center mx-auto mb-4 ring-8 ring-slate-50/80`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-950 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA FINAL ═══════ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-slate-950 via-emerald-950 to-green-900 px-6 sm:px-12 py-12 sm:py-16 text-center shadow-2xl shadow-emerald-950/20">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-emerald-500/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-yellow-400/25 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-3 tracking-[-0.04em]">Prêt à vendre localement ?</h2>
              <p className="text-sm sm:text-base text-white/70 max-w-md mx-auto mb-8">Mettez votre commerce sur Binq et recevez des commandes prêtes à préparer.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/inscription" className="inline-flex items-center gap-2 px-7 py-3 bg-white text-emerald-700 font-bold rounded-full hover:bg-emerald-50 transition-all text-sm shadow-xl">
                  Devenir partenaire <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link href="/explorer" className="inline-flex items-center gap-2 px-7 py-3 bg-white/10 text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all text-sm backdrop-blur-sm">
                  Explorer les commerces
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-white bg-white/70 backdrop-blur-xl py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 via-green-500 to-yellow-400 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-500/30">
                  <QrCode className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold text-slate-950 tracking-tight">Binq</span>
              </div>
              <p className="text-[11px] text-slate-400">Commerce local avec paiement et livraison</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/explorer" className="hover:text-slate-950 transition">Commander</Link>
              <a href="#fonctionnalites" className="hover:text-slate-950 transition">Comment ça marche</a>
              <a href="#pourqui" className="hover:text-slate-950 transition">Pour qui ?</a>
            </div>
            <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} Binq. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
