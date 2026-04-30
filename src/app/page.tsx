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
      <section className="relative min-h-screen overflow-hidden bg-[#fff6cf]">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,197,94,0.22),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(250,204,21,0.45),transparent_28%),linear-gradient(180deg,#fff7d6_0%,#fffbea_62%,#f7f9fe_100%)]" />
        <div className="absolute -top-24 right-[-7rem] w-96 h-96 bg-yellow-300/40 rounded-full blur-3xl" />
        <div className="absolute top-48 left-[-6rem] w-80 h-80 bg-emerald-300/30 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-28 sm:pt-36 pb-16 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center min-h-screen">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/85 border border-white rounded-full mb-6 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">Livraison locale · restaurants · boutiques</span>
            </div>

            <h1 className="text-[3rem] sm:text-6xl lg:text-7xl font-black tracking-[-0.06em] leading-[0.95] mb-5 text-slate-950">
              Commandez ce que<br />
              <span className="text-emerald-600">vous aimez.</span>
            </h1>
            <p className="text-base sm:text-xl text-slate-700 max-w-xl mb-7 leading-relaxed font-medium">
              Repas, courses, pharmacie, boutiques : choisissez, payez et recevez sans perdre de temps.
            </p>

            <div className="bg-white rounded-[1.5rem] p-2.5 shadow-2xl shadow-emerald-950/10 border border-white max-w-xl">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                  <input
                    aria-label="Adresse de livraison"
                    placeholder="Entrez votre adresse de livraison"
                    className="w-full bg-transparent outline-none text-sm font-semibold text-slate-950 placeholder:text-slate-400"
                  />
                </div>
                <Link href="/explorer" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 active:scale-[0.98]">
                  Voir les commerces <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 max-w-xl">
              {[
                { icon: Utensils, label: "Restaurants" },
                { icon: Store, label: "Courses" },
                { icon: Leaf, label: "Pharmacie" },
              ].map((item, i) => (
                <Link key={i} href="/explorer" className="bg-white/85 border border-white rounded-2xl px-3 py-3 flex flex-col items-center gap-2 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-950/10 transition-all">
                  <item.icon className="w-5 h-5 text-emerald-600" />
                  <span className="text-[12px] font-black text-slate-800 text-center">{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3 text-[12px] sm:text-[13px] text-slate-600 font-semibold">
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 border border-white shadow-sm"><Truck className="w-4 h-4 text-emerald-500" /> Livraison rapide</span>
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 border border-white shadow-sm"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Paiement sécurisé</span>
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 border border-white shadow-sm"><Store className="w-4 h-4 text-amber-500" /> Commerces locaux</span>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="hidden sm:block absolute left-4 top-12 rounded-3xl bg-white/90 border border-white shadow-2xl shadow-emerald-900/10 p-4 rotate-[-7deg] z-20">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Livraison</p>
              <p className="text-2xl font-black text-slate-950">22 min</p>
              <p className="text-[11px] text-emerald-600 font-semibold">Livreur en route</p>
            </div>
            <div className="hidden sm:block absolute right-0 bottom-24 rounded-3xl bg-white/90 border border-white shadow-2xl shadow-amber-900/10 p-4 rotate-[6deg] z-20">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Panier</p>
              <p className="text-2xl font-black text-slate-950">3 items</p>
              <p className="text-[11px] text-emerald-600 font-semibold">Mobile Money</p>
            </div>

            <div className="relative w-[290px] sm:w-[340px] rounded-[2.5rem] bg-slate-950 p-2 shadow-[0_50px_120px_rgba(15,23,42,0.28)] ring-1 ring-white/30">
              <div className="absolute top-0 inset-x-0 flex justify-center z-30 pt-2">
                <div className="w-[105px] h-[30px] bg-slate-950 rounded-b-3xl" />
              </div>
              <div className="rounded-[2rem] overflow-hidden bg-white">
                <div className="bg-emerald-600 px-5 pt-12 pb-5 text-white">
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-[0.18em] mb-4 text-center">Binq delivery</p>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black">Livraison à Cotonou</p>
                      <p className="text-xs text-white/70">Arrivée estimée · 22 min</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["Repas", "Courses", "Santé"].map((label) => (
                      <div key={label} className="rounded-2xl bg-white/12 py-3 text-center text-[11px] font-bold">
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 py-5 space-y-3">
                  {[
                    ["Burger + jus", "En préparation", "3 500 XOF"],
                    ["Courses rapides", "Disponible", "5 200 XOF"],
                  ].map(([name, status, price]) => (
                    <div key={name} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black text-slate-950 truncate">{name}</p>
                        <p className="text-[10px] text-slate-400">{status}</p>
                      </div>
                      <p className="text-[11px] font-black text-slate-900">{price}</p>
                    </div>
                  ))}
                  <div className="w-full py-3 bg-slate-950 text-white font-black text-[12px] rounded-full text-center">
                    Commander
                  </div>
                </div>

                <div className="flex justify-center pb-2.5 pt-1 bg-white">
                  <div className="w-28 h-1 bg-neutral-200 rounded-full" />
                </div>
              </div>
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
