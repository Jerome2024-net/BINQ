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

      {/* ═══════ HEADER ═══════ */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-neutral-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-xs">B</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">Binq</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Features", href: "#fonctionnalites" },
              { label: "Use Cases", href: "#pourqui" },
              { label: "Pricing", href: "#tarifs" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-neutral-400 hover:text-neutral-900 transition-colors">{l.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/connexion" className="hidden sm:block text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              Log in
            </Link>
            <Link href="/inscription" className="hidden sm:flex items-center gap-1.5 text-sm font-medium bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-all">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
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
          <div className="md:hidden border-t border-neutral-100 pb-4 pt-3 px-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {[
                { label: "Features", href: "#fonctionnalites" },
                { label: "Use Cases", href: "#pourqui" },
                { label: "Pricing", href: "#tarifs" },
              ].map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-50 text-sm transition-colors">
                  {l.label}
                </a>
              ))}
              <hr className="my-2 border-neutral-100" />
              <Link href="/connexion" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-50 text-sm transition-colors">
                Log in
              </Link>
              <Link href="/inscription" onClick={() => setMobileOpen(false)} className="text-center font-medium bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-sm mt-1">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="pt-32 sm:pt-44 pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
            Delightful events<br />start here.
          </h1>
          <p className="text-base sm:text-lg text-neutral-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Create your ticketing in minutes, accept Mobile Money or card payments, and scan every entry with QR codes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Link href="/inscription" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-neutral-900 text-white font-medium rounded-lg hover:bg-neutral-800 transition-all text-sm active:scale-[0.98]">
              Create Event <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-xs text-neutral-300">Free to start &middot; No subscription &middot; No commitment</p>
        </div>
      </section>

      {/* ═══════ 3 PILLARS ═══════ */}
      <section id="fonctionnalites" className="py-16 sm:py-24 border-t border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 sm:mb-20">
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-4">
              Ticketing that stays simple.
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg max-w-xl mx-auto">
              Made for any event size. From 10 to 10,000 attendees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-0 border border-neutral-200 rounded-xl overflow-hidden">
            <div className="p-8 sm:p-10 border-b md:border-b-0 md:border-r border-neutral-200">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mb-5">
                <Calendar className="w-5 h-5 text-neutral-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Simple.</h3>
              <p className="text-neutral-400 text-sm mb-5 leading-relaxed">Launch your event in clicks. No technical skills needed.</p>
              <ul className="space-y-2.5">
                {["Create your event for free", "Customize with your brand", "Share and sell instantly", "Track sales in real time"].map((item, i) => (
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
              <p className="text-neutral-400 text-sm mb-5 leading-relaxed">Clear pricing, no surprises. Fees are paid by the buyer.</p>
              <ul className="space-y-2.5">
                {["0 cost for organizers", "No setup fees", "No subscription", "Free tickets = zero fees"].map((item, i) => (
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
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Reliable.</h3>
              <p className="text-neutral-400 text-sm mb-5 leading-relaxed">Every ticket is unique and tamper-proof. Zero fraud.</p>
              <ul className="space-y-2.5">
                {["Unique QR per ticket", "Cryptographic signature", "Built-in ultra-fast scanner", "Real-time access control"].map((item, i) => (
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
                  <p className="text-[9px] font-medium text-neutral-500 uppercase tracking-widest mb-2">Your ticket</p>
                  <div className="w-24 h-24 bg-white rounded-xl mx-auto flex items-center justify-center">
                    <QrCode className="w-14 h-14 text-neutral-900" />
                  </div>
                  <p className="text-[10px] font-medium text-neutral-400 mt-2">Afro Night — VIP</p>
                </div>
                <div className="space-y-1">
                  {[
                    { name: "Afro Night — VIP", badge: "Valid" },
                    { name: "Concert Dakar", badge: "Scanned" },
                    { name: "Festival Abidjan", badge: "Valid" },
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
                Your event starts with a scan.
              </h2>
              <p className="text-neutral-400 text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                80% of attendees buy from their phone. Binq offers a seamless booking experience optimized for mobile.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
                {[
                  { title: "Scan < 1 second", desc: "Instant validation at the door" },
                  { title: "Mobile Money", desc: "Orange, MTN, Visa, Mastercard" },
                  { title: "Tamper-proof QR", desc: "Unique cryptographic signature" },
                  { title: "Real-time", desc: "Live sales and entry tracking" },
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
              For every type of event.
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg max-w-xl mx-auto">
              A workshop for 10? A concert for 10,000? Binq adapts.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "Concerts & Shows", img: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=400&fit=crop&q=80" },
              { label: "Parties & Clubs", img: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&h=400&fit=crop&q=80" },
              { label: "Workshops", img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop&q=80" },
              { label: "Conferences", img: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop&q=80" },
              { label: "Dining", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&q=80" },
              { label: "Expos & Fairs", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop&q=80" },
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
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3">How it works</p>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-3">3 steps. That&apos;s it.</h2>
            <p className="text-neutral-400 text-base sm:text-lg">From zero to your first event in 5 minutes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Create your event", desc: "Name, date, venue, cover and ticket types. Publish in clicks.", icon: Calendar },
              { step: "2", title: "Share & sell", desc: "Send the link to your audience. They buy in one tap.", icon: Ticket },
              { step: "3", title: "Scan at the door", desc: "Open the scanner, validate each QR code. Fast and reliable.", icon: ScanLine },
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
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3">Pricing</p>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight">
              You set the price.<br />You receive 100%.
            </h2>
          </div>

          <div className="max-w-md mx-auto mb-10">
            <div className="rounded-xl border border-neutral-200 overflow-hidden">
              <div className="p-5 sm:p-7 text-center border-b border-neutral-100">
                <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">Example</p>
                <p className="text-sm text-neutral-500 mb-1">You sell a ticket for</p>
                <p className="text-3xl font-semibold text-neutral-900">5,000 <span className="text-lg">FCFA</span></p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-neutral-100">
                <div className="p-4 sm:p-6 text-center">
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider mb-2">Buyer pays</p>
                  <p className="text-xl font-semibold text-neutral-900">5,500</p>
                  <p className="text-xs text-neutral-400 mt-0.5">FCFA (ticket + fees)</p>
                </div>
                <div className="p-4 sm:p-6 text-center bg-neutral-50">
                  <p className="text-[11px] text-neutral-900 uppercase tracking-wider mb-2 font-medium">You receive</p>
                  <p className="text-xl font-semibold text-neutral-900">5,000</p>
                  <p className="text-xs text-neutral-400 mt-0.5">FCFA — 100% of price</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {[
              { icon: CircleDollarSign, title: "Zero cost for you", desc: "No subscription, no hidden fees." },
              { icon: Globe, title: "Mobile Money & Card", desc: "All local payment methods." },
              { icon: Ticket, title: "Free = zero fees", desc: "Free tickets cost nothing." },
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
              Ready to launch your event?
            </h2>
            <p className="text-base text-neutral-400 max-w-md mx-auto mb-8">
              Free to start. No commitment. Go live in 5 minutes.
            </p>
            <Link href="/inscription" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-neutral-900 font-medium rounded-lg hover:bg-neutral-100 transition-all text-sm active:scale-[0.98]">
              Create Event <ChevronRight className="w-4 h-4" />
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
              <a href="#fonctionnalites" className="hover:text-neutral-900 transition">Features</a>
              <a href="#pourqui" className="hover:text-neutral-900 transition">Use Cases</a>
              <a href="#tarifs" className="hover:text-neutral-900 transition">Pricing</a>
            </div>
            <p className="text-xs text-neutral-300">&copy; {new Date().getFullYear()} Binq. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
