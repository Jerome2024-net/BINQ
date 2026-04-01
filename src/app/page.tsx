"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Ticket,
  Calendar,
  Shield,
  Menu,
  X,
} from "lucide-react";

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white font-sans antialiased text-neutral-900 overflow-x-hidden">

      {/* ═══════ HEADER — Ultra-minimal Transparent ═══════ */}
      <header className="fixed top-0 inset-x-0 z-[60]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-neutral-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-neutral-800">Binq</span>
          </Link>

          <div className="flex items-center gap-5">
            <nav className="hidden md:flex items-center gap-5">
              {[
                { label: "Fonctionnalités", href: "#fonctionnalites" },
                { label: "Tarifs", href: "#tarifs" },
              ].map((l) => (
                <a key={l.href} href={l.href} className="text-[13px] text-neutral-400 hover:text-neutral-700 transition-colors">{l.label}</a>
              ))}
            </nav>
            <Link href="/connexion" className="text-[13px] text-neutral-500 hover:text-neutral-900 transition-colors font-medium">
              Connexion
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100/60 transition-colors"
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

      {/* ═══════ HERO — Luma Creative Canvas ═══════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#f7f8fa]">

        {/* Very subtle radial wash */}
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 40%, rgba(219,234,254,0.25) 0%, #f7f8fa 60%)" }} />

        {/* ── Title + Subtitle ── */}
        <div className="relative z-30 text-center px-4 sm:px-6 pt-24 sm:pt-28 mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] mb-5 text-neutral-900">
            Créez des moments<br /><span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 bg-clip-text text-transparent">inoubliables.</span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-400 max-w-md mx-auto mb-7 leading-relaxed font-light">
            Billetterie, paiement Mobile Money, scan QR — tout en un seul endroit.
          </p>
          <Link href="/inscription" className="inline-flex items-center gap-2 px-7 py-3 bg-neutral-900 text-white font-medium rounded-full hover:bg-neutral-800 transition-all text-sm shadow-xl shadow-neutral-900/20">
            Commencer gratuitement <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <p className="text-[11px] text-neutral-400 mt-3.5 font-light">Gratuit &middot; Sans abonnement &middot; Sans engagement</p>
        </div>

        {/* ══ 3D SCENE — Ocean Canvas + Phone + Orbiting Objects ══ */}
        <div className="relative z-10 w-full flex items-center justify-center px-4 pb-16 sm:pb-24" style={{ perspective: "1600px" }}>

          {/* ── The Ocean Circle (Canvas) ── */}
          <div className="relative w-[360px] h-[360px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px] rounded-full overflow-visible">

            {/* Blurred ocean background */}
            <div className="absolute inset-0 rounded-full overflow-hidden shadow-[0_0_160px_rgba(6,182,212,0.18)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=800&fit=crop&q=80"
                alt=""
                className="w-full h-full object-cover scale-125 blur-[2px]"
              />
              <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 55%, rgba(6,182,212,0.12) 0%, rgba(14,116,144,0.28) 60%, rgba(8,47,73,0.45) 100%)" }} />
              {/* Caustics — animated light ripple */}
              <div className="absolute inset-0 opacity-15 animate-float-gentle" style={{ background: "radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.7) 0%, transparent 35%), radial-gradient(ellipse at 65% 60%, rgba(255,255,255,0.5) 0%, transparent 30%)" }} />
            </div>

            {/* Glass ring */}
            <div className="absolute inset-0 rounded-full border-2 border-white/20 pointer-events-none z-[5]" />
            <div className="absolute -inset-3 rounded-full border border-cyan-100/10 pointer-events-none" />

            {/* ════ FLOATING ORBITING OBJECTS ════ */}

            {/* ── 1. Billet VIP — top-left, CLOSE (no blur, z-40) ── */}
            <div
              className="absolute -top-10 -left-14 sm:-top-8 sm:-left-20 lg:-top-6 lg:-left-28 z-40 animate-float-slow"
              style={{ filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.18))" }}
            >
              <div className="bg-white rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 border border-neutral-100/80" style={{ transform: "rotate(-12deg)" }}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shrink-0">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-neutral-900 leading-tight">Billet VIP</p>
                  <p className="text-[9px] text-neutral-400 font-medium">5 000 FCFA</p>
                </div>
              </div>
            </div>

            {/* ── 2. Glassmorphism Attendee Badge — top-right, CLOSE (z-40) ── */}
            <div
              className="absolute -top-6 -right-10 sm:-top-4 sm:-right-16 lg:-top-2 lg:-right-24 z-40 animate-float-medium"
              style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.12))", animationDelay: "0.8s" }}
            >
              <div className="bg-white/40 backdrop-blur-xl rounded-full px-4 py-2.5 border border-white/50 flex items-center gap-2.5" style={{ transform: "rotate(4deg)" }}>
                <div className="flex -space-x-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white/80" style={{ background: ["#3b82f6", "#ec4899", "#8b5cf6", "#f59e0b"][i] }} />
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-white drop-shadow-sm">+2.4k</span>
              </div>
            </div>

            {/* ── 3. "Vendu!" — bottom-left, MEDIUM distance (slight blur, z-30) ── */}
            <div
              className="absolute -bottom-6 -left-12 sm:-bottom-4 sm:-left-20 lg:-bottom-2 lg:-left-28 z-30 animate-float-fast"
              style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.14)) blur(0.5px)", animationDelay: "1.5s" }}
            >
              <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-neutral-100/80 flex items-center gap-2.5" style={{ transform: "rotate(-5deg)" }}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-emerald-600 leading-tight">Vendu !</p>
                  <p className="text-[9px] text-neutral-400 font-medium">Paiement confirmé</p>
                </div>
              </div>
            </div>

            {/* ── 4. Calendar — far bottom-right, FAR (blur, z-[2]) ── */}
            <div
              className="absolute -bottom-10 -right-12 sm:-bottom-8 sm:-right-20 lg:-bottom-6 lg:-right-32 z-[2] animate-float-gentle"
              style={{ filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.1)) blur(1.5px)", animationDelay: "2.2s" }}
            >
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 border border-neutral-100/60 text-center" style={{ transform: "rotate(8deg)" }}>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-1">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <p className="text-[10px] font-bold text-neutral-700">12 Avril</p>
              </div>
            </div>

            {/* ── 5. Decorative Donut — far right, VERY FAR (max blur, z-[1]) ── */}
            <div
              className="absolute top-1/3 -right-16 sm:-right-28 lg:-right-40 z-[1] animate-float-slow"
              style={{ filter: "blur(2.5px)", animationDelay: "0.5s" }}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 shadow-xl opacity-60" style={{ transform: "rotate(15deg)" }}>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#f7f8fa]" />
                </div>
              </div>
            </div>

            {/* ── 6. Floating Emoji — far left-center, FAR (blur, z-[1]) ── */}
            <div
              className="absolute top-1/2 -left-14 sm:-left-24 lg:-left-36 -translate-y-1/2 z-[1] animate-float-medium"
              style={{ filter: "blur(2px)", animationDelay: "1.8s" }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg opacity-50 flex items-center justify-center" style={{ transform: "rotate(-10deg)" }}>
                <span className="text-2xl sm:text-3xl">🎵</span>
              </div>
            </div>

            {/* ════ IPHONE MOCKUP (CENTER, POP-OUT) ════ */}
            <div
              className="absolute left-1/2 -top-12 sm:-top-16 z-20 w-[230px] sm:w-[270px] lg:w-[290px]"
              style={{
                transform: "translateX(-50%) rotateX(2deg)",
                filter: "drop-shadow(0 60px 120px rgba(0,0,0,0.3)) drop-shadow(0 25px 50px rgba(0,0,0,0.15))",
              }}
            >
              {/* Phone frame — jet black */}
              <div className="bg-black rounded-[2.6rem] sm:rounded-[3rem] p-[7px] sm:p-[9px] relative">
                {/* Dynamic Island */}
                <div className="absolute top-0 inset-x-0 flex justify-center z-30 pt-[7px] sm:pt-[9px]">
                  <div className="w-[80px] sm:w-[100px] h-[24px] sm:h-[28px] bg-black rounded-b-2xl sm:rounded-b-3xl" />
                </div>

                {/* Screen — edge-to-edge, no white wrapper */}
                <div className="rounded-[2.2rem] sm:rounded-[2.5rem] overflow-hidden relative bg-black">
                  {/* Turquoise screen reflection */}
                  <div className="absolute inset-0 z-[15] pointer-events-none opacity-[0.05]" style={{ background: "linear-gradient(145deg, rgba(6,182,212,0.8) 0%, transparent 35%, rgba(6,182,212,0.4) 65%, transparent 100%)" }} />

                  {/* ── Banner Image — EDGE TO EDGE ── */}
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=700&fit=crop&q=80"
                      alt=""
                      className="w-full aspect-[3/4] object-cover"
                    />
                    {/* Dark gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                    {/* Overlaid expressive text */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                      {/* Tag pill */}
                      <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-full px-2.5 py-1 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                        <span className="text-[8px] font-semibold text-white/90 uppercase tracking-[0.15em]">En vente</span>
                      </div>

                      {/* Expressive title — bold, tight, display-like */}
                      <h3 className="text-[22px] sm:text-[26px] font-black text-white leading-[0.95] tracking-[-0.03em] mb-1.5">
                        BINQ<br />AFRO NIGHT
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-white/50 font-light tracking-wide">Sam. 12 Avril · 21h00 · Dakar</p>
                    </div>
                  </div>

                  {/* ── Below-banner content ── */}
                  <div className="bg-white px-4 sm:px-5 py-3.5 sm:py-4">
                    {/* Attendee row */}
                    <div className="flex items-center justify-between mb-3.5 sm:mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-5 sm:w-6 h-5 sm:h-6 rounded-full border-[1.5px] border-white shadow-sm" style={{ background: ["#3b82f6", "#ec4899", "#8b5cf6", "#f59e0b", "#10b981"][i] }} />
                          ))}
                        </div>
                        <span className="text-[10px] text-neutral-400 font-light">+2 400 inscrits</span>
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-900">5 000 FCFA</span>
                    </div>

                    {/* Pink pill CTA — Luma-style */}
                    <button className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-[13px] sm:text-sm rounded-full shadow-lg shadow-pink-500/25 active:scale-[0.98] transition-transform">
                      Réserver
                    </button>
                  </div>

                  {/* Home indicator */}
                  <div className="flex items-center justify-center pb-2 pt-0.5 bg-white">
                    <div className="w-24 sm:w-28 h-1 bg-neutral-200 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

          </div>{/* end ocean circle */}
        </div>

        {/* Fade to white */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent z-20 pointer-events-none" />
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
              <div className="w-6 h-6 bg-neutral-900 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold text-[10px]">B</span>
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
