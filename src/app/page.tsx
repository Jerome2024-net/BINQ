"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  QrCode,
  CircleDollarSign,
  ScanLine,
  Ticket,
  Calendar,
  Globe,
  Shield,
  Menu,
  X,
} from "lucide-react";

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white font-sans antialiased text-neutral-900 overflow-x-hidden">

      {/* ═══════ HEADER — Transparent / Floating ═══════ */}
      <header className="fixed top-0 inset-x-0 z-[60]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 rounded-xl shadow-lg shadow-black/10 flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-neutral-900">Binq</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: "Fonctionnalités", href: "#fonctionnalites" },
              { label: "Pour qui ?", href: "#pourqui" },
              { label: "Tarifs", href: "#tarifs" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-neutral-400 hover:text-neutral-900 transition-colors">{l.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/connexion" className="hidden sm:block text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              Connexion
            </Link>
            <Link href="/inscription" className="hidden sm:flex items-center gap-1.5 text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20">
              Créer ma billetterie <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-700 hover:bg-neutral-100/60 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-neutral-100 pb-4 pt-3 px-4 mx-3 mt-1 rounded-2xl shadow-xl animate-fade-in">
            <div className="flex flex-col gap-1">
              {[
                { label: "Fonctionnalités", href: "#fonctionnalites" },
                { label: "Pour qui ?", href: "#pourqui" },
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
              <Link href="/inscription" onClick={() => setMobileOpen(false)} className="text-center font-medium bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm mt-1">
                Créer ma billetterie
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════ HERO — Hublot 3D Ocean ═══════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#f8fafb]">

        {/* Subtle background texture */}
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 100% 70% at 50% 30%, #e0f2fe 0%, #f0f9ff 30%, #f8fafb 70%)" }} />

        {/* ── Title + CTA ── */}
        <div className="relative z-30 text-center px-4 sm:px-6 pt-24 sm:pt-28 mb-10 sm:mb-14">
          <h1 className="text-4xl sm:text-6xl lg:text-[4.5rem] font-extrabold tracking-tight leading-[1.08] mb-5 text-neutral-900">
            Créez des moments<br /><span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 bg-clip-text text-transparent">inoubliables.</span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 max-w-lg mx-auto mb-7 leading-relaxed">
            Billetterie, paiement Mobile Money, scan QR — tout en un seul endroit. Lancez-vous en 5 minutes.
          </p>
          <Link href="/inscription" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-all text-[15px] active:scale-[0.97] shadow-xl shadow-blue-600/30">
            Créer ma billetterie <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-neutral-400 mt-4">Gratuit &middot; Sans abonnement &middot; Sans engagement</p>
        </div>

        {/* ══ 3D SCENE — Hublot + Phone + Floating Objects ══ */}
        <div className="relative z-10 w-full flex items-center justify-center px-4 pb-8 sm:pb-12" style={{ perspective: "1400px" }}>

          {/* ── The Porthole (Hublot) ── */}
          <div className="relative w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] lg:w-[540px] lg:h-[540px] rounded-full overflow-visible">

            {/* Ocean circle background */}
            <div className="absolute inset-0 rounded-full overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.25)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=800&fit=crop&q=80"
                alt="Ocean"
                className="w-full h-full object-cover scale-110"
              />
              {/* Turquoise gradient overlay to unify tones */}
              <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 60%, rgba(6,182,212,0.2) 0%, rgba(14,116,144,0.35) 70%, rgba(8,47,73,0.5) 100%)" }} />
              {/* Caustics / light ripple effect */}
              <div className="absolute inset-0 opacity-20 animate-float-gentle" style={{ background: "radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.6) 0%, transparent 40%), radial-gradient(ellipse at 70% 55%, rgba(255,255,255,0.4) 0%, transparent 35%)" }} />
            </div>

            {/* Inner border ring for glass effect */}
            <div className="absolute inset-0 rounded-full border-[3px] border-white/30 pointer-events-none z-[5]" />
            {/* Outer glow ring */}
            <div className="absolute -inset-2 rounded-full border border-cyan-200/20 pointer-events-none" />

            {/* ════ FLOATING OBJECTS ════ */}

            {/* ── Object 1 — Billet Binq (top-left, IN FRONT z-40) ── */}
            <div
              className="absolute -top-4 -left-4 sm:-top-2 sm:-left-6 z-40 animate-float-slow"
              style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.18))" }}
            >
              <div className="bg-white rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 border border-neutral-100/80 backdrop-blur-sm" style={{ transform: "rotate(-8deg)" }}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shrink-0">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-neutral-900 leading-tight">Billet VIP</p>
                  <p className="text-[10px] text-neutral-400">5 000 FCFA</p>
                </div>
              </div>
            </div>

            {/* ── Object 2 — Emoji Party (top-right, BEHIND z-[2]) ── */}
            <div
              className="absolute -top-6 -right-2 sm:-top-4 sm:-right-4 z-[2] animate-float-medium"
              style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.1))", animationDelay: "0.8s" }}
            >
              <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 border border-neutral-100/60 text-center" style={{ transform: "rotate(6deg)" }}>
                <p className="text-3xl sm:text-4xl leading-none mb-0.5">🎉</p>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Let&apos;s go!</p>
              </div>
            </div>

            {/* ── Object 3 — Badge "Vendu" (bottom-left, IN FRONT z-40) ── */}
            <div
              className="absolute -bottom-2 -left-6 sm:bottom-4 sm:-left-10 z-40 animate-float-fast"
              style={{ filter: "drop-shadow(0 28px 56px rgba(0,0,0,0.2))", animationDelay: "1.5s" }}
            >
              <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-neutral-100/80 flex items-center gap-2.5" style={{ transform: "rotate(-3deg)" }}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-emerald-600 leading-tight">Vendu !</p>
                  <p className="text-[10px] text-neutral-400">Paiement confirmé</p>
                </div>
              </div>
            </div>

            {/* ── Object 4 — Calendar (bottom-right, BEHIND z-[2]) ── */}
            <div
              className="absolute -bottom-4 -right-4 sm:bottom-2 sm:-right-8 z-[2] animate-float-gentle"
              style={{ filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.12))", animationDelay: "2.2s" }}
            >
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-neutral-100/60 text-center" style={{ transform: "rotate(5deg)" }}>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-1">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <p className="text-[10px] font-bold text-neutral-900">12 Avril</p>
              </div>
            </div>

            {/* ── Object 5 — Stats badge (right-center, IN FRONT z-40) ── */}
            <div
              className="absolute top-1/2 -right-8 sm:-right-14 -translate-y-1/2 z-40 animate-float-medium"
              style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))", animationDelay: "0.3s" }}
            >
              <div className="bg-white rounded-2xl px-3.5 py-3 border border-neutral-100/80 text-center" style={{ transform: "rotate(4deg)" }}>
                <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-none">2.4k</p>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">inscrits</p>
              </div>
            </div>

            {/* ════ IPHONE MOCKUP (CENTER, POP-OUT) ════ */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-8 sm:-top-14 z-20 w-[220px] sm:w-[260px]"
              style={{
                filter: "drop-shadow(0 50px 100px rgba(0,0,0,0.25)) drop-shadow(0 20px 40px rgba(0,0,0,0.12))",
                transform: "translateX(-50%) rotateX(3deg) rotateY(-1deg)",
              }}
            >
              {/* Phone frame */}
              <div className="bg-neutral-900 rounded-[2.4rem] sm:rounded-[2.8rem] p-[8px] sm:p-[10px] relative">
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 flex justify-center z-20 pt-[8px] sm:pt-[10px]">
                  <div className="w-[72px] sm:w-[90px] h-[22px] sm:h-[26px] bg-neutral-900 rounded-b-xl sm:rounded-b-2xl" />
                </div>

                {/* Screen */}
                <div className="bg-white rounded-[2rem] sm:rounded-[2.2rem] overflow-hidden relative">
                  {/* Turquoise reflection overlay on screen */}
                  <div className="absolute inset-0 z-[15] pointer-events-none opacity-[0.08]" style={{ background: "linear-gradient(145deg, rgba(6,182,212,0.6) 0%, transparent 40%, rgba(6,182,212,0.3) 70%, transparent 100%)" }} />

                  {/* Status bar */}
                  <div className="h-10 sm:h-12 bg-white flex items-end justify-between px-5 sm:px-6 pb-1 pt-5 sm:pt-6">
                    <span className="text-[9px] sm:text-[10px] font-semibold text-neutral-900">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 sm:w-3.5 h-1.5 sm:h-2 bg-neutral-900 rounded-sm" />
                      <div className="w-1 sm:w-1.5 h-1.5 sm:h-2 bg-neutral-400 rounded-sm" />
                    </div>
                  </div>

                  {/* Event content */}
                  <div className="px-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=380&fit=crop&q=80"
                      alt="Afro Night Festival"
                      className="w-full aspect-[16/10] object-cover"
                    />
                    <div className="px-4 sm:px-5 py-3 sm:py-4">
                      <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
                        <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-pink-500" />
                        <span className="text-[9px] sm:text-[10px] font-semibold text-pink-500 uppercase tracking-wider">Live</span>
                      </div>
                      <h3 className="text-[13px] sm:text-[15px] font-extrabold text-neutral-900 leading-snug mb-0.5 sm:mb-1">Afro Night Festival</h3>
                      <p className="text-[10px] sm:text-[11px] text-neutral-400 mb-0.5 sm:mb-1">Sam. 12 Avril · 21h00</p>
                      <p className="text-[10px] sm:text-[11px] text-neutral-400 mb-3 sm:mb-4">📍 Dakar, Sénégal</p>

                      {/* Avatars */}
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                        <div className="flex -space-x-1.5">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-5 sm:w-6 h-5 sm:h-6 rounded-full border-[1.5px] border-white" style={{ background: ['#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981'][i] }} />
                          ))}
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-neutral-400">+2,400</span>
                      </div>

                      {/* CTA Button */}
                      <button className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-lg shadow-pink-500/30">
                        Réserver · 5 000 FCFA
                      </button>
                    </div>
                  </div>

                  {/* Bottom bar */}
                  <div className="flex items-center justify-center pb-2 sm:pb-3 pt-0.5 sm:pt-1">
                    <div className="w-20 sm:w-28 h-1 bg-neutral-200 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

          </div>{/* end porthole */}
        </div>

        {/* Bottom fade into white */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent z-20 pointer-events-none" />
      </section>

      {/* ═══════ 3 PILLARS ═══════ */}
      <section id="fonctionnalites" className="py-16 sm:py-24 border-t border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 sm:mb-20">
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-4">
              Une billetterie qui reste simple.
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg max-w-xl mx-auto">
              Conçue pour tout type d&apos;événement. De 10 à 10 000 participants.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-0 border border-neutral-200 rounded-xl overflow-hidden">
            <div className="p-8 sm:p-10 border-b md:border-b-0 md:border-r border-neutral-200">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mb-5">
                <Calendar className="w-5 h-5 text-neutral-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Simple.</h3>
              <p className="text-neutral-400 text-sm mb-5 leading-relaxed">Créez votre événement en quelques clics. Aucune compétence technique requise.</p>
              <ul className="space-y-2.5">
                {["Créez votre événement gratuitement", "Personnalisez à votre image", "Partagez et vendez instantanément", "Suivez vos ventes en temps réel"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-500">
                    <Check className="w-4 h-4 text-neutral-900 mt-0.5 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 sm:p-10 border-b md:border-b-0 md:border-r border-neutral-200">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mb-5">
                <CircleDollarSign className="w-5 h-5 text-neutral-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Transparent.</h3>
              <p className="text-neutral-400 text-sm mb-5 leading-relaxed">Tarifs clairs, sans surprises. Les frais sont à la charge de l&apos;acheteur.</p>
              <ul className="space-y-2.5">
                {["0 frais pour les organisateurs", "Aucun frais d'installation", "Aucun abonnement", "Billets gratuits = zéro frais"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-500">
                    <Check className="w-4 h-4 text-neutral-900 mt-0.5 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 sm:p-10">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mb-5">
                <Shield className="w-5 h-5 text-neutral-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Fiable.</h3>
              <p className="text-neutral-400 text-sm mb-5 leading-relaxed">Chaque billet est unique et infalsifiable. Zéro fraude.</p>
              <ul className="space-y-2.5">
                {["QR code unique par billet", "Signature cryptographique", "Scanner ultra-rapide intégré", "Contrôle d'accès en temps réel"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-500">
                    <Check className="w-4 h-4 text-neutral-900 mt-0.5 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES HIGHLIGHT ═══════ */}
      <section className="py-16 sm:py-24 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Phone */}
            <div className="relative max-w-[240px] mx-auto lg:mx-0 shrink-0">
              <div className="bg-neutral-900 rounded-[2rem] p-4 pt-6 pb-6 text-white">
                <div className="flex justify-center pt-1 pb-3"><div className="w-16 h-4 bg-black rounded-full" /></div>
                <div className="text-center mb-4">
                  <p className="text-[9px] font-medium text-neutral-500 uppercase tracking-widest mb-2">Votre billet</p>
                  <div className="w-24 h-24 bg-white rounded-xl mx-auto flex items-center justify-center">
                    <QrCode className="w-14 h-14 text-neutral-900" />
                  </div>
                  <p className="text-[10px] font-medium text-neutral-400 mt-2">Afro Night — VIP</p>
                </div>
                <div className="space-y-1">
                  {[
                    { name: "Afro Night — VIP", badge: "Valide" },
                    { name: "Concert Dakar", badge: "Scanné" },
                    { name: "Festival Abidjan", badge: "Valide" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.06]">
                      <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center shrink-0">
                        <Ticket className="w-3 h-3 text-neutral-400" />
                      </div>
                      <p className="text-[10px] text-white/70 truncate flex-1">{t.name}</p>
                      <span className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-white/50">{t.badge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right text */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-5">
                Votre événement commence par un scan.
              </h2>
              <p className="text-neutral-400 text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                80% des participants achètent depuis leur téléphone. Binq offre une expérience de réservation fluide, optimisée pour le mobile.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
                {[
                  { title: "Scan < 1 seconde", desc: "Validation instantanée à l'entrée" },
                  { title: "Mobile Money", desc: "Orange, MTN, Visa, Mastercard" },
                  { title: "QR infalsifiable", desc: "Signature cryptographique unique" },
                  { title: "Temps réel", desc: "Suivi des ventes et entrées en direct" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-neutral-200 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ USE CASES ═══════ */}
      <section id="pourqui" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-3">
              Pour tous les types d&apos;événements.
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg max-w-xl mx-auto">
              Un atelier pour 10 personnes ? Un concert pour 10 000 ? Binq s&apos;adapte.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "Concerts & Spectacles", img: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=400&fit=crop&q=80" },
              { label: "Soirées & Clubs", img: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&h=400&fit=crop&q=80" },
              { label: "Formations & Ateliers", img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop&q=80" },
              { label: "Conférences & Séminaires", img: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop&q=80" },
              { label: "Restaurants", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&q=80" },
              { label: "Salons & Expositions", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop&q=80" },
            ].map((item, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden aspect-[3/2]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.img} alt={item.label} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-16 sm:py-24 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3">Comment ça marche</p>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-3">3 étapes. C&apos;est tout.</h2>
            <p className="text-neutral-400 text-base sm:text-lg">De zéro à votre premier événement en 5 minutes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Créez votre événement", desc: "Nom, date, lieu, cover et types de billets. Publiez en quelques clics.", icon: Calendar },
              { step: "2", title: "Partagez & vendez", desc: "Envoyez le lien à votre audience. Ils achètent en un clic.", icon: Ticket },
              { step: "3", title: "Scannez à l'entrée", desc: "Ouvrez le scanner, validez chaque QR code. Rapide et fiable.", icon: ScanLine },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 text-center">
                <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white font-medium text-sm mx-auto mb-5">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">{item.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section id="tarifs" className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3">Tarifs</p>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight">
              Vous fixez le prix.<br />Vous recevez 100%.
            </h2>
          </div>

          <div className="max-w-md mx-auto mb-10">
            <div className="rounded-xl border border-neutral-200 overflow-hidden">
              <div className="p-5 sm:p-7 text-center border-b border-neutral-100">
                <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">Exemple concret</p>
                <p className="text-sm text-neutral-500 mb-1">Vous vendez un billet à</p>
                <p className="text-3xl font-semibold text-neutral-900">5,000 <span className="text-lg">FCFA</span></p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-neutral-100">
                <div className="p-4 sm:p-6 text-center">
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider mb-2">L&apos;acheteur paye</p>
                  <p className="text-xl font-semibold text-neutral-900">5 500</p>
                  <p className="text-xs text-neutral-400 mt-0.5">FCFA (billet + frais)</p>
                </div>
                <div className="p-4 sm:p-6 text-center bg-neutral-50">
                  <p className="text-[11px] text-neutral-900 uppercase tracking-wider mb-2 font-medium">Vous recevez</p>
                  <p className="text-xl font-semibold text-neutral-900">5 000</p>
                  <p className="text-xs text-neutral-400 mt-0.5">FCFA — 100% du prix</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {[
              { icon: CircleDollarSign, title: "0 FCFA pour vous", desc: "Aucun abonnement, aucun frais caché." },
              { icon: Globe, title: "Mobile Money & Carte", desc: "Tous les moyens de paiement locaux." },
              { icon: Ticket, title: "Gratuit = 0 frais", desc: "Les billets gratuits ne coûtent rien." },
            ].map((item, i) => (
              <div key={i} className="bg-neutral-50 rounded-xl p-5 text-center">
                <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-4 h-4 text-neutral-600" />
                </div>
                <p className="text-sm font-medium text-neutral-900 mb-1">{item.title}</p>
                <p className="text-xs text-neutral-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-neutral-900 rounded-2xl p-8 sm:p-16 text-center">
            <h2 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight mb-4">
              Prêt à lancer votre événement ?
            </h2>
            <p className="text-base text-neutral-400 max-w-md mx-auto mb-8">
              Gratuit, sans abonnement. Lancez-vous en 5 minutes.
            </p>
            <Link href="/inscription" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition-all text-[15px] active:scale-[0.97] shadow-lg shadow-blue-600/25">
              Créer ma billetterie <ChevronRight className="w-4 h-4" />
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
