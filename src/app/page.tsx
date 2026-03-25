"use client";

import Link from "next/link";
import {
  Zap,
  ArrowRight,
  ChevronRight,
  Smartphone,
  QrCode,
  CircleDollarSign,
  Star,
  ScanLine,
  Ticket,
  Calendar,
  Globe,
  BarChart3,
  Shield,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
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

          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: "Fonctionnalités", href: "#fonctionnalites" },
              { label: "Comment ça marche", href: "#comment" },
              { label: "Tarifs", href: "#tarifs" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">{l.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/connexion" className="text-[11px] sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors px-2 sm:px-4 py-2">
              Connexion
            </Link>
            <Link href="/inscription" className="text-[11px] sm:text-sm font-bold bg-emerald-500 text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/25">
              Commencer
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[60vw] h-[60vw] bg-emerald-100/60 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-100/40 rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-xs font-bold mb-6 sm:mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            La billetterie #1 en Afrique de l&apos;Ouest
          </div>

          <h1 className="text-[2.5rem] sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-5 sm:mb-7">
            Vendez vos billets.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400">Scannez à l&apos;entrée.</span>
          </h1>

          <p className="text-base sm:text-xl text-gray-500 max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Créez votre événement, vendez des billets en ligne et contrôlez les entrées avec un simple scan QR.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-14 sm:mb-20">
            <Link href="/inscription" className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/25 text-[15px]">
              <Zap className="w-5 h-5" />
              Créer mon événement — Gratuit
            </Link>
          </div>

          {/* ── Mock Phone ── */}
          <div className="relative max-w-[280px] mx-auto">
            <div className="relative bg-gradient-to-b from-[#111] to-[#0a0a0a] rounded-[2.5rem] border border-white/10 p-5 pt-7 pb-7 shadow-2xl shadow-black/20 text-white">
              {/* Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full" />
              <div className="flex items-center justify-between mb-4 px-1 pt-3">
                <span className="text-[10px] text-gray-400 font-semibold">9:41</span>
                <div className="flex gap-1">
                  <div className="w-4 h-2 rounded-sm bg-white/15" />
                  <div className="w-3 h-2 rounded-sm bg-white/15" />
                  <div className="w-6 h-2.5 rounded-sm bg-emerald-500/50" />
                </div>
              </div>

              {/* QR */}
              <div className="text-center mb-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Votre billet</p>
                <div className="w-32 h-32 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                  <QrCode className="w-20 h-20 text-gray-900" />
                </div>
                <p className="text-[11px] font-bold text-emerald-400 mt-2.5">Afro Night — VIP · 5 000 FCFA</p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: ScanLine, label: "Scanner", color: "from-emerald-500 to-emerald-600" },
                  { icon: Calendar, label: "Événement", color: "from-cyan-500 to-cyan-600" },
                  { icon: Ticket, label: "Billets", color: "from-violet-500 to-violet-600" },
                ].map((btn, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${btn.color} flex items-center justify-center shadow-lg`}>
                      <btn.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[9px] font-medium text-gray-500">{btn.label}</span>
                  </div>
                ))}
              </div>

              {/* Tickets */}
              <div className="space-y-1.5">
                {[
                  { name: "Afro Night — VIP", price: "5 000 F", badge: "Validé", bc: "bg-emerald-500/15 text-emerald-400" },
                  { name: "Concert Dakar", price: "3 000 F", badge: "Scanné", bc: "bg-cyan-500/15 text-cyan-400" },
                  { name: "Festival Abidjan", price: "10 000 F", badge: "Validé", bc: "bg-emerald-500/15 text-emerald-400" },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/[0.04]">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Ticket className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-white/80 truncate">{t.name}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${t.bc}`}>{t.badge}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Glow */}
            <div className="absolute -inset-6 bg-gradient-to-b from-emerald-200/30 to-cyan-200/20 rounded-[3rem] blur-3xl -z-10" />
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section id="fonctionnalites" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Fonctionnalités</p>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4">
              Tout ce qu&apos;il faut.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Rien de plus.</span>
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-lg mx-auto">
              De la création à l&apos;entrée, chaque étape est simple et efficace.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Calendar, title: "Événement en 2 min", desc: "Nom, date, lieu, cover et types de billets. Publiez en quelques clics.", color: "bg-emerald-500" },
              { icon: QrCode, title: "QR unique par billet", desc: "Chaque billet génère un QR infalsifiable. Zéro fraude, zéro doublon.", color: "bg-cyan-500" },
              { icon: Smartphone, title: "Mobile Money & Carte", desc: "Orange Money, Wave, MTN, carte bancaire… vos participants choisissent.", color: "bg-violet-500" },
              { icon: ScanLine, title: "Scan à l'entrée", desc: "Scannez les QR en temps réel. Voyez le taux de remplissage en direct.", color: "bg-orange-500" },
              { icon: Shield, title: "Anti-fraude intégré", desc: "Chaque billet est unique, signé et vérifié. Impossible à dupliquer.", color: "bg-rose-500" },
              { icon: BarChart3, title: "Dashboard temps réel", desc: "Ventes, revenus, entrées scannées — tout dans un tableau de bord clair.", color: "bg-amber-500" },
            ].map((f, i) => (
              <div key={i} className="group rounded-2xl bg-white border border-gray-200/60 p-5 sm:p-6 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-100/80 transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[15px] sm:text-base font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="comment" className="py-16 sm:py-24 bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Comment ça marche</p>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3">
              3 étapes. C&apos;est tout.
            </h2>
            <p className="text-gray-500 text-base sm:text-lg">De zéro à votre premier événement en 5 minutes.</p>
          </div>

          <div className="space-y-4">
            {[
              { step: "01", title: "Créez votre événement", desc: "Nom, date, lieu, cover et billets. Votre page est en ligne en 2 minutes.", color: "bg-emerald-500", icon: Calendar },
              { step: "02", title: "Partagez & vendez", desc: "Envoyez le lien à votre audience. Vos participants achètent en un clic.", color: "bg-cyan-500", icon: Ticket },
              { step: "03", title: "Scannez à l'entrée", desc: "Ouvrez le scanner intégré, validez chaque QR code. Rapide et fiable.", color: "bg-violet-500", icon: ScanLine },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 sm:gap-5 p-5 sm:p-6 rounded-2xl bg-white border border-gray-200/60 hover:shadow-md transition-all group">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.color} text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-lg`}>
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase">Étape {item.step}</span>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
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
                  <p className="text-xs text-gray-400 mt-0.5">FCFA (billet + 10%)</p>
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
                Prêt à lancer votre événement ?
              </h2>
              <p className="text-base sm:text-lg text-white/70 max-w-md mx-auto mb-8">
                Rejoignez les organisateurs qui font confiance à Binq. C&apos;est gratuit.
              </p>
              <Link href="/inscription" className="group inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 sm:py-5 bg-white text-gray-900 font-black rounded-2xl hover:bg-gray-100 transition-all shadow-xl text-[15px] sm:text-base">
                Créer mon événement
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
              </Link>
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
