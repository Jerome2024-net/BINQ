"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Zap,
  ScanLine,
  ShieldCheck,
  Ticket,
  Menu,
  X,
  QrCode,
  Utensils,
  GraduationCap,
  Sparkles,
  Building2,
  Leaf,
  Music,
} from "lucide-react";

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f7f9fe] font-sans antialiased text-slate-950 overflow-x-hidden">

      {/* ═══════ HEADER ═══════ */}
      <header className="fixed top-0 inset-x-0 z-[60] bg-white/75 backdrop-blur-2xl border-b border-white/70 shadow-sm shadow-slate-200/40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <QrCode className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-slate-950">Binq</span>
          </Link>

          <div className="flex items-center gap-5">
            <Link href="/explorer" className="text-[13px] text-slate-500 hover:text-slate-950 transition-colors font-medium">
              Explorer
            </Link>
            <Link href="/connexion" className="text-[13px] text-slate-500 hover:text-slate-950 transition-colors font-medium hidden sm:inline">
              Connexion
            </Link>
            <Link href="/inscription" className="hidden md:inline-flex text-[13px] px-4 py-2 bg-slate-950 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-slate-950/15">
              Créer ma billetterie
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
              <Link href="/explorer" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-sm">Explorer</Link>
              <Link href="/connexion" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-sm">Connexion</Link>
              <Link href="/inscription" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl bg-slate-950 text-white text-sm text-center font-semibold">Créer ma billetterie</Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.22),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(124,58,237,0.18),transparent_30%),linear-gradient(180deg,#ffffff_0%,#eef5ff_64%,#ffffff_100%)]" />
        <div className="absolute -top-24 right-[-6rem] w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute top-36 left-[-5rem] w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-4 sm:px-6 pt-32 sm:pt-40 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 border border-white rounded-full mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Billetterie QR & accès sécurisé</span>
          </div>

          <h1 className="text-[2.65rem] sm:text-6xl lg:text-7xl font-black tracking-[-0.055em] leading-[0.98] mb-6">
            <span className="text-slate-950">Votre billetterie</span><br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">en QR code.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Binq transforme chaque événement, service ou accès en une billetterie mobile : paiement intégré, billet QR instantané et contrôle anti-fraude en temps réel.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/inscription" className="inline-flex items-center gap-2 px-7 py-3.5 bg-slate-950 text-white font-bold rounded-full hover:bg-blue-700 transition-all text-sm shadow-2xl shadow-slate-950/20 hover:-translate-y-0.5">
              Créer ma billetterie <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/explorer" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/85 text-slate-700 font-semibold rounded-full border border-white hover:border-blue-100 hover:shadow-lg hover:shadow-blue-900/5 transition-all text-sm">
              Explorer
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[12px] sm:text-[13px] text-slate-500">
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 border border-white shadow-sm"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Validation anti-fraude</span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 border border-white shadow-sm"><Zap className="w-4 h-4 text-amber-500" /> Paiement instantané</span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 border border-white shadow-sm"><Ticket className="w-4 h-4 text-blue-500" /> Billets illimités</span>
          </div>
        </div>

        {/* Phone mockup — QR scan animation */}
        <div className="relative z-10 mt-12 sm:mt-16 mb-0 w-[270px] sm:w-[315px]" style={{ filter: "drop-shadow(0 45px 90px rgba(15,23,42,0.22))" }}>
          <div className="hidden sm:block absolute -left-24 top-24 rounded-3xl bg-white/90 border border-white shadow-2xl shadow-blue-900/10 p-4 rotate-[-8deg]">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ventes</p>
            <p className="text-xl font-black text-slate-950">+128</p>
            <p className="text-[11px] text-emerald-500 font-semibold">Aujourd&apos;hui</p>
          </div>
          <div className="hidden sm:block absolute -right-24 top-44 rounded-3xl bg-white/90 border border-white shadow-2xl shadow-indigo-900/10 p-4 rotate-[7deg]">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scan</p>
            <p className="text-xl font-black text-slate-950">0.8s</p>
            <p className="text-[11px] text-blue-500 font-semibold">Accès validé</p>
          </div>
          <div className="bg-slate-950 rounded-[2.8rem] sm:rounded-[3.2rem] p-[7px] sm:p-[9px] relative ring-1 ring-white/20">
            <div className="absolute top-0 inset-x-0 flex justify-center z-30 pt-[7px] sm:pt-[9px]">
              <div className="w-[90px] sm:w-[105px] h-[26px] sm:h-[30px] bg-slate-950 rounded-b-2xl sm:rounded-b-3xl" />
            </div>

            <div className="rounded-[2.3rem] sm:rounded-[2.7rem] overflow-hidden bg-white">
              {/* Screen — Scan QR */}
              <div className="relative bg-gradient-to-b from-blue-600 via-indigo-600 to-violet-700 px-5 pt-12 pb-5">
                <p className="text-[10px] text-white/60 font-medium text-center uppercase tracking-[0.15em] mb-4">Scanner pour accéder</p>
                <div className="relative w-40 h-40 mx-auto mb-4">
                  {/* QR frame corners */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white/80 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white/80 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white/80 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white/80 rounded-br-xl" />
                  {/* Scan line */}
                  <div className="absolute inset-x-4 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent animate-pulse" />
                  {/* QR placeholder */}
                  <div className="absolute inset-6 flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-white/30" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-sm">AFRO NIGHT</p>
                  <p className="text-white/50 text-[10px]">Sam. 12 Avril · 21h · Dakar</p>
                </div>
              </div>

              {/* Bottom card */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Ticket className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-neutral-900">1 × VIP Pass</p>
                      <p className="text-[9px] text-neutral-400">Validé · Mobile Money</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Payé ✓</span>
                </div>
                <div className="w-full py-2.5 bg-slate-950 text-white font-bold text-[12px] rounded-full text-center">
                  Accès confirmé
                </div>
              </div>

              <div className="flex justify-center pb-2.5 pt-1 bg-white">
                <div className="w-28 h-1 bg-neutral-200 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#f7f9fe] to-transparent z-20 pointer-events-none" />
      </section>

      {/* ═══════ COMMENT ÇA MARCHE — 3 steps ═══════ */}
      <section id="fonctionnalites" className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 sm:mb-18">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-white shadow-sm text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-4">Simple et rapide</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.04em] text-slate-950 mb-3">Comment ça marche</h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">Trois étapes. Zéro friction. Une billetterie prête à vendre.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: "01",
                icon: Sparkles,
                title: "Créez",
                desc: "Publiez votre événement, service ou produit en 2 minutes. Configurez vos tickets et tarifs.",
                gradient: "from-blue-500 to-indigo-500",
              },
              {
                step: "02",
                icon: ScanLine,
                title: "Un QR, une billetterie",
                desc: "Le client scanne, choisit son ticket et paie instantanément par carte ou Mobile Money.",
                gradient: "from-violet-500 to-purple-500",
              },
              {
                step: "03",
                icon: ShieldCheck,
                title: "Accès vérifié",
                desc: "Le QR ticket est validé en temps réel. Anti-fraude intégré. Zéro doublon possible.",
                gradient: "from-emerald-500 to-green-500",
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="relative overflow-hidden bg-white border border-white rounded-[1.75rem] p-6 sm:p-8 shadow-sm shadow-slate-200/80 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-blue-50 group-hover:bg-indigo-50 transition-colors" />
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
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-white shadow-sm text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-4">Polyvalent</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.04em] text-slate-950 mb-3">Un QR pour tout</h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">Partout où il y a un accès à vendre, Binq simplifie la billetterie et l&apos;encaissement.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: Music, label: "Événements & Concerts", desc: "Billetterie complète", gradient: "from-purple-500 to-pink-500", bg: "bg-purple-50" },
              { icon: Utensils, label: "Restaurants & Bars", desc: "Commandes & réservations", gradient: "from-red-500 to-rose-500", bg: "bg-red-50" },
              { icon: Sparkles, label: "Services Premium", desc: "Accès VIP & abonnements", gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50" },
              { icon: Building2, label: "Hôtellerie & Immo", desc: "Check-in digital", gradient: "from-sky-500 to-blue-500", bg: "bg-sky-50" },
              { icon: GraduationCap, label: "Formations", desc: "Workshops & certifications", gradient: "from-indigo-500 to-violet-500", bg: "bg-indigo-50" },
              { icon: Leaf, label: "Bien-être & Spas", desc: "Rendez-vous & soins", gradient: "from-teal-500 to-emerald-500", bg: "bg-teal-50" },
            ].map((item, i) => (
              <div key={i} className="group bg-white border border-white rounded-[1.5rem] p-5 sm:p-6 shadow-sm shadow-slate-200/70 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300">
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
          <p className="text-center text-sm sm:text-base text-slate-500 max-w-md mx-auto mb-12 sm:mb-16">La solution la plus simple pour vendre des accès, encaisser et contrôler vos entrées.</p>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 text-center">
            {[
              { icon: Zap, title: "Instantané", desc: "Scan < 1 seconde. Encaissement en temps réel. Accès immédiat.", color: "text-amber-500", bg: "bg-amber-50" },
              { icon: ShieldCheck, title: "0 % de commission", desc: "Aucun frais pour l'organisateur. Vous gardez 100 % de vos ventes.", color: "text-emerald-500", bg: "bg-emerald-50" },
              { icon: ScanLine, title: "Anti-fraude", desc: "Signature cryptographique unique. Impossible à copier ou falsifier.", color: "text-blue-500", bg: "bg-blue-50" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-[1.75rem] border border-slate-100 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-shadow">
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
          <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 px-6 sm:px-12 py-12 sm:py-16 text-center shadow-2xl shadow-blue-950/20">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-blue-500/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/25 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-3 tracking-[-0.04em]">Prêt à lancer votre billetterie ?</h2>
              <p className="text-sm sm:text-base text-white/70 max-w-md mx-auto mb-8">Créez votre premier ticket QR en moins de 2 minutes. Paiement, validation et suivi inclus.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/inscription" className="inline-flex items-center gap-2 px-7 py-3 bg-white text-blue-700 font-bold rounded-full hover:bg-blue-50 transition-all text-sm shadow-xl">
                  Créer ma billetterie <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link href="/explorer" className="inline-flex items-center gap-2 px-7 py-3 bg-white/10 text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all text-sm backdrop-blur-sm">
                  Voir les événements
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
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
                  <QrCode className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold text-slate-950 tracking-tight">Binq</span>
              </div>
              <p className="text-[11px] text-slate-400">Billetterie QR avec paiement intégré</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/explorer" className="hover:text-slate-950 transition">Explorer</Link>
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
