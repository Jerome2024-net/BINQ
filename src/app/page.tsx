"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Calendar,
  Shield,
  Menu,
  X,
  Star,
} from "lucide-react";

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white font-sans antialiased text-neutral-900 overflow-x-hidden">

      {/* ═══════ HEADER — Ultra-minimal Transparent ═══════ */}
      <header className="fixed top-0 inset-x-0 z-[60]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
              <Star className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-neutral-900">Binq</span>
          </Link>

          <div className="flex items-center gap-5">
            <nav className="hidden md:flex items-center gap-5">
              {[
                { label: "Fonctionnalités", href: "#fonctionnalites" },
                { label: "Tarifs", href: "#tarifs" },
              ].map((l) => (
                <a key={l.href} href={l.href} className="text-[13px] text-neutral-500 hover:text-neutral-900 transition-colors">{l.label}</a>
              ))}
            </nav>
            <Link href="/connexion" className="text-[13px] text-neutral-600 hover:text-neutral-900 transition-colors font-medium">
              Connexion
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border border-neutral-100 pb-4 pt-3 px-4 mx-3 mt-1 rounded-2xl shadow-xl animate-fade-in">
            <div className="flex flex-col gap-1">
              {[
                { label: "Fonctionnalités", href: "#fonctionnalites" },
                { label: "Tarifs", href: "#tarifs" },
              ].map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-50 text-sm transition-colors">
                  {l.label}
                </a>
              ))}
              <hr className="my-2 border-neutral-100" />
              <Link href="/connexion" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-50 text-sm transition-colors">
                Connexion
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════ HERO — Clean & Bold ═══════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden">

        {/* Soft gradient background */}
        <div className="absolute inset-0 -z-10 bg-[#fafbfc]" />
        <div className="absolute inset-0 -z-10 opacity-50" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, #dbeafe 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 20%, #fce7f3 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 20% 30%, #ede9fe 0%, transparent 50%)" }} />

        {/* ── Text ── */}
        <div className="relative z-10 text-center px-4 sm:px-6 pt-28 sm:pt-36">
          <h1 className="text-[2.75rem] sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.02] mb-5">
            <span className="text-neutral-900">Créez des moments</span><br />
            <span className="text-blue-600">inoubliables.</span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 max-w-sm mx-auto mb-8 leading-relaxed">
            Billetterie, paiement Mobile Money, scan QR — tout en un seul endroit.
          </p>
          <Link href="/inscription" className="inline-flex items-center gap-2 px-7 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all text-sm shadow-xl shadow-neutral-900/20">
            Commencer gratuitement <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Phone mockup ── */}
        <div className="relative z-10 mt-12 sm:mt-16 mb-0 w-[260px] sm:w-[300px]" style={{ filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.5))" }}>
          <div className="bg-black rounded-[2.8rem] sm:rounded-[3.2rem] p-[7px] sm:p-[9px] relative">
            {/* Dynamic Island */}
            <div className="absolute top-0 inset-x-0 flex justify-center z-30 pt-[7px] sm:pt-[9px]">
              <div className="w-[90px] sm:w-[105px] h-[26px] sm:h-[30px] bg-black rounded-b-2xl sm:rounded-b-3xl" />
            </div>

            <div className="rounded-[2.3rem] sm:rounded-[2.7rem] overflow-hidden bg-black">
              {/* Banner — edge to edge */}
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=700&fit=crop&q=80"
                  alt=""
                  className="w-full aspect-[3/4] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[8px] font-semibold text-white/80 uppercase tracking-[0.12em]">En vente</span>
                  </div>
                  <h3 className="text-[24px] sm:text-[28px] font-black text-white leading-[0.92] tracking-tight mb-1">
                    AFRO<br />NIGHT
                  </h3>
                  <p className="text-[10px] text-white/40 font-light">Sam. 12 Avril · 21h · Dakar</p>
                </div>
              </div>

              {/* Bottom content */}
              <div className="bg-white px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white" style={{ background: ["#3b82f6", "#ec4899", "#8b5cf6", "#f59e0b"][i] }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-neutral-400">+2.4k</span>
                  </div>
                  <span className="text-[11px] font-bold text-neutral-900">5 000 FCFA</span>
                </div>
                <button className="w-full py-3 bg-neutral-900 text-white font-bold text-[13px] rounded-full">
                  Réserver
                </button>
              </div>

              {/* Home indicator */}
              <div className="flex justify-center pb-2.5 pt-1 bg-white">
                <div className="w-28 h-1 bg-neutral-200 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent z-20 pointer-events-none" />
      </section>

      {/* ═══════ 3 PILLARS — Ultra-compact ═══════ */}
      <section id="fonctionnalites" className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-10 sm:gap-14 text-center">
            {[
              { icon: Calendar, word: "Simple", line: "Créez et publiez en 2 minutes." },
              { icon: CircleDollarSign, word: "Gratuit", line: "0 frais pour l'organisateur." },
              { icon: Shield, word: "Fiable", line: "QR unique, zéro fraude." },
            ].map((item, i) => (
              <div key={i}>
                <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-5 h-5 text-neutral-500" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">{item.word}</h3>
                <p className="text-sm text-neutral-400">{item.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ USE CASES — Visual grid ═══════ */}
      <section id="pourqui" className="pb-20 sm:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-xl sm:text-3xl font-semibold tracking-tight mb-10 sm:mb-14 text-neutral-900">
            Pour tous vos événements.
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {[
              { label: "Concerts", img: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=400&fit=crop&q=80" },
              { label: "Soirées", img: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&h=400&fit=crop&q=80" },
              { label: "Formations", img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop&q=80" },
              { label: "Conférences", img: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop&q=80" },
              { label: "Restaurants", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&q=80" },
              { label: "Salons", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop&q=80" },
            ].map((item, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden aspect-[4/3] group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.img} alt={item.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <p className="absolute bottom-3 left-3 text-[13px] font-medium text-white">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS — 3 steps inline ═══════ */}
      <section className="py-16 sm:py-24 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-3xl font-semibold tracking-tight mb-10 sm:mb-14 text-neutral-900">3 étapes. C&apos;est tout.</h2>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-6">
            {[
              { n: "1", title: "Créez", desc: "Nom, date, billets." },
              { n: "2", title: "Partagez", desc: "Un lien, c'est tout." },
              { n: "3", title: "Scannez", desc: "QR code à l'entrée." },
            ].map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-9 h-9 bg-neutral-900 rounded-full flex items-center justify-center text-white font-semibold text-sm mb-3">{s.n}</div>
                <p className="text-sm font-semibold text-neutral-900 mb-0.5">{s.title}</p>
                <p className="text-xs text-neutral-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PRICING — One-liner ═══════ */}
      <section id="tarifs" className="py-16 sm:py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-3xl font-semibold tracking-tight mb-3 text-neutral-900">
            0 frais pour l&apos;organisateur.
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 mb-8 max-w-md mx-auto">
            Vous fixez le prix, vous recevez 100%. L&apos;acheteur paye un petit frais de service.
          </p>
          <div className="inline-flex items-baseline gap-1 mb-6">
            <span className="text-5xl sm:text-6xl font-bold text-neutral-900">0</span>
            <span className="text-lg sm:text-xl font-medium text-neutral-400">FCFA / mois</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-[13px] text-neutral-400">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-neutral-900" />Mobile Money & Carte</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-neutral-900" />Billets gratuits = 0 frais</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-neutral-900" />Sans engagement</span>
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-neutral-900 rounded-2xl p-10 sm:p-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-4">
              Lancez votre événement.
            </h2>
            <p className="text-sm text-neutral-500 mb-7">Gratuit. Sans abonnement. En 5 minutes.</p>
            <Link href="/inscription" className="inline-flex items-center gap-2 px-7 py-3 bg-white text-neutral-900 font-medium rounded-full hover:bg-neutral-100 transition-all text-sm">
              Commencer <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-neutral-100 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm shadow-blue-500/30">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="font-semibold text-neutral-900 tracking-tight">Binq</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-neutral-400">
              <a href="#fonctionnalites" className="hover:text-neutral-900 transition">Fonctionnalités</a>
              <a href="#pourqui" className="hover:text-neutral-900 transition">Pour qui ?</a>
              <a href="#tarifs" className="hover:text-neutral-900 transition">Tarifs</a>
            </div>
            <p className="text-xs text-neutral-300">&copy; {new Date().getFullYear()} Binq. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
