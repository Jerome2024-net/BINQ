"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ChevronDown,
  QrCode,
  CircleDollarSign,
  Star,
  ScanLine,
  Ticket,
  Calendar,
  Globe,
  Shield,
  Sparkles,
  Fingerprint,
  Menu,
  X,
} from "lucide-react";

export default function HomePage() {
  const [solOpen, setSolOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const solRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (solRef.current && !solRef.current.contains(e.target as Node)) setSolOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  return (
    <div className="min-h-screen bg-white font-sans antialiased text-gray-900 overflow-x-hidden">

      {/* ═══════ HEADER ═══════ */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-200/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tight">Binq</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Fonctionnalités", href: "#fonctionnalites" },
              { label: "Pour qui ?", href: "#pourqui" },
              { label: "Tarifs", href: "#tarifs" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">{l.label}</a>
            ))}

            {/* Solutions dropdown */}
            <div ref={solRef} className="relative">
              <button
                onClick={() => setSolOpen(!solOpen)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Solutions
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${solOpen ? "rotate-180" : ""}`} />
              </button>
              {solOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 p-2 z-50">
                  <Link
                    href="/binq-access"
                    onClick={() => setSolOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Fingerprint className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">Binq Access</p>
                      <p className="text-xs text-gray-500">Contrôle d&apos;accès entreprises</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/connexion" className="hidden sm:block text-[11px] sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors px-2 sm:px-4 py-2">
              Connexion
            </Link>
            <Link href="/inscription" className="hidden sm:block text-[11px] sm:text-sm font-bold bg-emerald-500 text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/25">
              Créer ma billetterie
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 pb-4 pt-3 px-4 sm:px-6 animate-fade-up">
            <div className="flex flex-col gap-1">
              {[
                { label: "Fonctionnalités", href: "#fonctionnalites" },
                { label: "Pour qui ?", href: "#pourqui" },
                { label: "Tarifs", href: "#tarifs" },
              ].map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors">
                  {l.label}
                </a>
              ))}
              <button
                onClick={() => setSolOpen(!solOpen)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors w-full text-left"
              >
                Solutions
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${solOpen ? "rotate-180" : ""}`} />
              </button>
              {solOpen && (
                <Link
                  href="/binq-access"
                  onClick={() => { setMobileOpen(false); setSolOpen(false); }}
                  className="flex items-center gap-3 ml-4 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors"
                >
                  <Fingerprint className="w-5 h-5 text-emerald-500" />
                  Binq Access
                </Link>
              )}
              <hr className="my-2 border-gray-100" />
              <Link href="/connexion" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors">
                Connexion
              </Link>
              <Link href="/inscription" onClick={() => setMobileOpen(false)} className="text-center font-bold bg-emerald-500 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 mt-1">
                Créer ma billetterie
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="relative pt-28 sm:pt-40 pb-20 sm:pb-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-20%] left-[-15%] w-[60vw] h-[60vw] bg-emerald-100/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-100/30 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-xs font-bold mb-6 sm:mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            La billetterie pensée pour l&apos;Afrique de l&apos;Ouest
          </div>

          <h1 className="text-[2.5rem] sm:text-6xl lg:text-[4.5rem] font-black tracking-tight leading-[1.08] mb-6 sm:mb-8">
            Créez. Vendez.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400">Scannez.</span>
          </h1>

          <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Créez votre billetterie en ligne, encaissez via Mobile Money ou carte, et contrôlez chaque entrée par QR code. <span className="text-gray-700 font-semibold">Inscription gratuite et sans engagement.</span>
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
            <Link href="/inscription" className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/25 text-[15px] active:scale-[0.97]">
              Créer ma billetterie
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-xs text-gray-400 font-medium">✓ Gratuit &nbsp; ✓ Sans abonnement &nbsp; ✓ Sans engagement</p>
        </div>
      </section>

      {/* ═══════ 3 PILIERS ═══════ */}
      <section id="fonctionnalites" className="py-16 sm:py-24 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 sm:mb-20">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4">
              La billetterie qui reste{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-400">simple.</span>
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              Adaptée à tous les événements. Pour 10 ou 10 000 participants.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-0 md:gap-0 border border-gray-200 rounded-3xl overflow-hidden bg-white">
            {/* Pilier 1: Simple */}
            <div className="p-8 sm:p-10 border-b md:border-b-0 md:border-r border-gray-200 group">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
                <Calendar className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Simple.</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">Lancez votre billetterie en quelques clics, sans compétence technique.</p>
              <ul className="space-y-3">
                {[
                  "Créez votre billetterie gratuitement",
                  "Personnalisez à votre image",
                  "Vendez et partagez en un instant",
                  "Suivez les ventes en temps réel",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pilier 2: Transparent */}
            <div className="p-8 sm:p-10 border-b md:border-b-0 md:border-r border-gray-200 group">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
                <CircleDollarSign className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Transparent.</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">Tarif clair, pas de surprise. Les frais sont payés par l&apos;acheteur.</p>
              <ul className="space-y-3">
                {[
                  "0 FCFA pour l'organisateur",
                  "Sans frais d'installation",
                  "Sans abonnement, ni engagement",
                  "Gratuit pour les billets gratuits",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pilier 3: Fiable */}
            <div className="p-8 sm:p-10 group">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
                <Shield className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Fiable.</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">Chaque billet est unique et infalsifiable. Zéro fraude, zéro doublon.</p>
              <ul className="space-y-3">
                {[
                  "QR code unique par billet",
                  "Signature cryptographique",
                  "Scanner intégré ultra-rapide",
                  "Contrôle en temps réel",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ PHONE MOCKUP ═══════ */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Phone */}
            <div className="relative max-w-[260px] mx-auto lg:mx-0 shrink-0">
              <div className="relative bg-gradient-to-b from-[#111] to-[#0a0a0a] rounded-[2.5rem] border border-white/10 p-4 pt-6 pb-6 shadow-2xl shadow-black/20 text-white">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full" />
                <div className="flex items-center justify-between mb-3 px-1 pt-3">
                  <span className="text-[10px] text-gray-400 font-semibold">9:41</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-2 rounded-sm bg-white/15" />
                    <div className="w-6 h-2.5 rounded-sm bg-emerald-500/50" />
                  </div>
                </div>
                <div className="text-center mb-3">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Votre billet</p>
                  <div className="w-28 h-28 bg-white rounded-2xl mx-auto flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-gray-900" />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-400 mt-2">Afro Night — VIP · 5 000 FCFA</p>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {[
                    { icon: ScanLine, label: "Scanner", color: "from-emerald-500 to-emerald-600" },
                    { icon: Calendar, label: "Billetterie", color: "from-cyan-500 to-cyan-600" },
                    { icon: Ticket, label: "Billets", color: "from-violet-500 to-violet-600" },
                  ].map((btn, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${btn.color} flex items-center justify-center`}>
                        <btn.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[8px] font-medium text-gray-500">{btn.label}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {[
                    { name: "Afro Night — VIP", badge: "Validé", bc: "bg-emerald-500/15 text-emerald-400" },
                    { name: "Concert Dakar", badge: "Scanné", bc: "bg-cyan-500/15 text-cyan-400" },
                    { name: "Festival Abidjan", badge: "Validé", bc: "bg-emerald-500/15 text-emerald-400" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.04]">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Ticket className="w-3 h-3 text-emerald-400" />
                      </div>
                      <p className="text-[10px] font-semibold text-white/80 truncate flex-1">{t.name}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${t.bc}`}>{t.badge}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -inset-6 bg-gradient-to-b from-emerald-200/30 to-cyan-200/20 rounded-[3rem] blur-3xl -z-10" />
            </div>

            {/* Right text */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-6">
                Votre billetterie commence par un scan.
              </h2>
              <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                80% des participants achètent depuis leur téléphone. Binq offre une expérience de réservation fluide, sans création de compte, optimisée mobile.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
                {[
                  { title: "Scan < 1 seconde", desc: "Validation instantanée à l'entrée" },
                  { title: "Mobile Money", desc: "Orange Money, MTN, carte bancaire" },
                  { title: "QR infalsifiable", desc: "Signature unique par billet" },
                  { title: "Temps réel", desc: "Suivi des ventes et entrées en direct" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ POUR QUI ? ═══════ */}
      <section id="pourqui" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4">
              Pour tous les types d&apos;événements.
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              Un atelier pour 10 personnes ? Un concert pour 10 000 participants ? Binq s&apos;adapte.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              { label: "Concerts & Spectacles", img: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=400&fit=crop&q=80" },
              { label: "Soirées & Clubs", img: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&h=400&fit=crop&q=80" },
              { label: "Formations & Ateliers", img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop&q=80" },
              { label: "Conférences & Séminaires", img: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop&q=80" },
              { label: "Restaurants", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&q=80" },
              { label: "Salons & Expositions", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop&q=80" },
            ].map((item, i) => (
              <div key={i} className="group relative rounded-2xl overflow-hidden aspect-[3/2] cursor-default">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.img} alt={item.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
                  <p className="text-sm sm:text-base font-bold text-white leading-tight drop-shadow-lg">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SOLUTIONS ═══════ */}
      <section id="solutions" className="py-16 sm:py-24 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Solutions</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900">Nos verticales</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Des solutions spécialisées pour répondre à chaque besoin.</p>
          </div>

          <div className="grid gap-6 sm:gap-8">
            {/* Binq Access */}
            <Link href="/binq-access" className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 sm:p-10 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 group block">
              <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Bientôt disponible</div>
              
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Fingerprint className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                    Binq Access
                    <ArrowRight className="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-lg text-emerald-600 font-semibold mb-3">Contrôle d&apos;accès pour entreprises</p>
                  <p className="text-gray-500 leading-relaxed">
                    Un terminal de vérification sur mesure pour sécuriser et gérer les accès de votre entreprise. 
                    Contrôlez qui entre, quand, et où — en temps réel.
                  </p>
                </div>
              </div>
            </Link>

            {/* Placeholder futur */}
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 sm:p-10 text-center">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-semibold">D&apos;autres solutions arrivent bientôt...</p>
              <p className="text-sm text-gray-300 mt-1">Restez connectés.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ COMMENT ÇA MARCHE ═══════ */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Comment ça marche</p>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3">
              3 étapes. C&apos;est tout.
            </h2>
            <p className="text-gray-500 text-base sm:text-lg">De zéro à votre première billetterie en 5 minutes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Créez votre billetterie", desc: "Nom, date, lieu, cover et types de billets. Publiez en quelques clics.", icon: Calendar, color: "bg-emerald-500" },
              { step: "2", title: "Partagez & vendez", desc: "Envoyez le lien à votre audience. Vos participants achètent en un clic.", icon: Ticket, color: "bg-cyan-500" },
              { step: "3", title: "Scannez à l'entrée", desc: "Ouvrez le scanner, validez chaque QR code. Rapide et fiable.", icon: ScanLine, color: "bg-violet-500" },
            ].map((item, i) => (
              <div key={i} className="relative bg-white rounded-2xl border border-gray-200/60 p-6 sm:p-8 text-center hover:shadow-lg transition-all group">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className={`w-8 h-8 ${item.color} rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg`}>
                    {item.step}
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mt-4 mb-5 group-hover:scale-105 transition-transform`}>
                  <item.icon className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TARIFS ═══════ */}
      <section id="tarifs" className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Tarifs</p>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Vous fixez le prix,<br /><span className="text-emerald-600">vous recevez 100%</span>.
            </h2>
          </div>

          {/* Exemple */}
          <div className="max-w-md mx-auto mb-10">
            <div className="rounded-2xl sm:rounded-3xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-7 text-center border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Exemple concret</p>
                <p className="text-sm text-gray-500 mb-1">Vous vendez un billet à</p>
                <p className="text-3xl sm:text-4xl font-black text-gray-900">5 000 <span className="text-lg font-bold">FCFA</span></p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                <div className="p-4 sm:p-6 text-center">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">L&apos;acheteur paye</p>
                  <p className="text-xl sm:text-2xl font-black text-gray-900">5 500</p>
                  <p className="text-xs text-gray-400 mt-0.5">FCFA (billet + frais)</p>
                </div>
                <div className="p-4 sm:p-6 text-center bg-emerald-50/50">
                  <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-2">Vous recevez</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600">5 000</p>
                  <p className="text-xs text-emerald-500 mt-0.5">FCFA — 100% du prix</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-3">
                <CircleDollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">0 FCFA pour vous</p>
              <p className="text-xs text-gray-500">Aucun abonnement, aucun frais caché.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-3">
                <Globe className="w-5 h-5 text-cyan-600" />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">Mobile Money &amp; Carte</p>
              <p className="text-xs text-gray-500">Tous les moyens de paiement locaux.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-5 h-5 text-violet-600" />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">Gratuit = 0 frais</p>
              <p className="text-xs text-gray-500">Les billets gratuits ne coûtent rien.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ CTA FINAL ═══════ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-[2rem] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-cyan-500" />
            <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

            <div className="relative z-10 p-8 sm:p-16 text-center">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
                Prêt à lancer votre billetterie ?
              </h2>
              <p className="text-base sm:text-lg text-white/70 max-w-md mx-auto mb-8">
                Inscription gratuite et sans engagement. Lancez-vous en 5 minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/inscription" className="group inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 sm:py-5 bg-white text-gray-900 font-black rounded-2xl hover:bg-gray-100 transition-all shadow-xl text-[15px] sm:text-base active:scale-[0.97]">
                  Créer ma billetterie
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-gray-100 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-black text-gray-900 tracking-tight">Binq</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#fonctionnalites" className="hover:text-gray-900 transition">Fonctionnalités</a>
              <a href="#pourqui" className="hover:text-gray-900 transition">Pour qui ?</a>
              <a href="#tarifs" className="hover:text-gray-900 transition">Tarifs</a>
            </div>
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Binq. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
