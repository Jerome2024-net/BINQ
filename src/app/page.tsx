"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  ChevronRight,
  Smartphone,
  QrCode,
  Globe2,
  Sparkles,
  CircleDollarSign,
  Star,
  Store,
  CreditCard,
  Percent,
  ScanLine,
  ShoppingBag,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased text-gray-900 overflow-x-hidden">

      {/* ── HEADER ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tight">Binq</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/connexion" className="text-[11px] sm:text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors px-2 sm:px-3 py-2">
              <span className="hidden sm:inline">Se connecter</span>
              <span className="sm:hidden">Connexion</span>
            </Link>
            <Link href="/inscription" className="text-[11px] sm:text-sm font-bold bg-emerald-500 text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-2xl hover:bg-emerald-400 transition-all flex items-center gap-1 sm:gap-1.5 shadow-lg shadow-emerald-500/25">
              <span className="hidden sm:inline">Ouvrir ma boutique</span>
              <span className="sm:hidden">S&apos;inscrire</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-30%] left-[-10%] w-[70vw] h-[70vw] bg-emerald-50 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/4 right-1/4 w-[30vw] h-[30vw] bg-emerald-600/10 rounded-full blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/40 text-emerald-600 text-xs font-bold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Marketplace + Paiement QR Code
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-[2.5rem] sm:text-6xl lg:text-[5rem] font-black tracking-tight leading-[1.05] mb-5 sm:mb-7">
              Vendez.{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400">Encaissez.</span>
            </h1>

            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
              Cr&eacute;ez votre boutique, g&eacute;n&eacute;rez un QR Code, vos clients paient avec leurs moyens habituels. Simple et rapide.
            </p>

            <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 px-4 max-w-[340px] sm:max-w-none mx-auto mb-10 sm:mb-14">
              <Link href="/inscription" className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-2.5 px-3 sm:px-8 py-3 sm:py-4 bg-emerald-500 text-white font-bold rounded-xl sm:rounded-2xl hover:bg-emerald-400 transition-all shadow-lg sm:shadow-xl shadow-emerald-500/25 text-[13px] sm:text-base whitespace-nowrap">
                <Store className="w-4 h-4 sm:w-5 sm:h-5 hidden sm:block" />
                <span className="hidden sm:inline">Ouvrir ma boutique gratuit</span>
                <span className="sm:hidden">Ouvrir ma boutique</span>
              </Link>
              <Link href="/explorer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-8 py-3 sm:py-4 bg-gray-100/50 text-gray-600 font-semibold rounded-xl sm:rounded-2xl border border-gray-200/60 hover:bg-gray-100 transition-all backdrop-blur-sm text-[13px] sm:text-base whitespace-nowrap">
                <span className="hidden sm:inline">Explorer la marketplace</span>
                <span className="sm:hidden">Explorer</span>
              </Link>
            </div>
          </div>

          {/* ── Mock Phone UI ── */}
          <div className="relative max-w-xs mx-auto">
            <div className="relative bg-gradient-to-b from-[#111] to-[#0d0d0d] rounded-[2.5rem] border border-gray-200/60 p-6 pt-8 pb-8 shadow-xl shadow-emerald-500/20 text-white">
              <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
                <span className="text-[9px] sm:text-[10px] text-gray-300 font-bold">9:41</span>
                <div className="flex gap-1">
                  <div className="w-4 h-2 rounded-sm bg-white/20" />
                  <div className="w-3 h-2 rounded-sm bg-white/20" />
                  <div className="w-6 h-2.5 rounded-sm bg-emerald-500/60" />
                </div>
              </div>

              {/* QR Code central */}
              <div className="text-center mb-4 sm:mb-6">
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2">Scanner pour payer</p>
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-2xl mx-auto flex items-center justify-center">
                  <QrCode className="w-20 h-20 sm:w-24 sm:h-24 text-gray-900" />
                </div>
                <p className="text-xs font-bold text-emerald-400 mt-3">Caf&eacute; Dakar &mdash; 2 500 FCFA</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {[
                  { icon: ScanLine, label: "Scanner", color: "from-emerald-500 to-emerald-600" },
                  { icon: Store, label: "Boutique", color: "from-cyan-500 to-cyan-600" },
                  { icon: ShoppingBag, label: "Acheter", color: "from-violet-500 to-violet-600" },
                ].map((btn, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 sm:gap-1.5">
                    <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${btn.color} flex items-center justify-center shadow-lg`}>
                      <btn.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-gray-400">{btn.label}</span>
                  </div>
                ))}
              </div>

              {/* Recent orders */}
              <div className="space-y-2">
                {[
                  { name: "Robe Ankara", amount: "15 000 FCFA", time: "Il y a 2min", status: "Pay\u00e9e" },
                  { name: "Coiffure tresses", amount: "8 000 FCFA", time: "Hier", status: "Livr\u00e9e" },
                  { name: "Jus bissap x3", amount: "4 500 FCFA", time: "Lundi", status: "Pay\u00e9e" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gray-50/50">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-600">
                      <ShoppingBag className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/80 truncate">{item.name}</p>
                      <p className="text-[10px] text-white/25">{item.time}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -inset-4 bg-emerald-50 rounded-[2.5rem] sm:rounded-[3rem] blur-2xl -z-10" />
          </div>

          {/* Stats row */}
          <div className="mt-10 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 max-w-3xl mx-auto">
            {[
              { label: "Paiements", value: "Instantan\u00e9s", icon: Zap },
              { label: "Moyens accept\u00e9s", value: "Carte + Mobile", icon: CreditCard },
              { label: "Commission", value: "Transparente", icon: Percent },
              { label: "S\u00e9curit\u00e9", value: "PCI-DSS", icon: Lock },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl bg-gray-50/50 border border-gray-200/50 backdrop-blur-sm">
                <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                <p className="text-gray-900 font-bold text-xs sm:text-sm">{stat.value}</p>
                <p className="text-[9px] sm:text-[10px] text-gray-700 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="fonctionnalites" className="py-16 sm:py-24 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50/80 border border-gray-200/60 text-emerald-600 text-xs font-bold mb-5">
              <CircleDollarSign className="w-3.5 h-3.5" />
              Fonctionnalit&eacute;s
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4">
              Tout pour vendre.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Simplement.</span>
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto">
              Une marketplace compl&egrave;te avec paiement int&eacute;gr&eacute;.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Store,
                title: "Boutique en ligne",
                desc: "Cr\u00e9ez votre vitrine, ajoutez vos produits, partagez votre lien. C\u2019est gratuit.",
                gradient: "from-emerald-500/20 to-emerald-500/5",
                iconColor: "text-emerald-600",
                border: "border-emerald-200/40",
              },
              {
                icon: QrCode,
                title: "Paiement par QR Code",
                desc: "G\u00e9n\u00e9rez un QR, le client scanne et paie avec sa carte ou son mobile money.",
                gradient: "from-cyan-500/20 to-cyan-500/5",
                iconColor: "text-cyan-600",
                border: "border-cyan-500/20",
              },
              {
                icon: CreditCard,
                title: "Multi-moyens de paiement",
                desc: "Carte bancaire, Orange Money, Wave, MTN\u2026 vos clients paient comme ils veulent.",
                gradient: "from-violet-500/20 to-violet-500/5",
                iconColor: "text-violet-400",
                border: "border-violet-500/20",
              },
              {
                icon: Globe2,
                title: "Multi-devises",
                desc: "FCFA et EUR \u2014 vendez localement ou \u00e0 l\u2019international.",
                gradient: "from-orange-500/20 to-orange-500/5",
                iconColor: "text-orange-600",
                border: "border-orange-500/20",
              },
              {
                icon: ShieldCheck,
                title: "Paiement s\u00e9curis\u00e9",
                desc: "Chaque transaction est prot\u00e9g\u00e9e. Vos clients paient en toute confiance.",
                gradient: "from-emerald-500/20 to-emerald-500/5",
                iconColor: "text-emerald-600",
                border: "border-emerald-200/40",
              },
              {
                icon: Percent,
                title: "Commission transparente",
                desc: "Un seul frais par transaction. Pas d\u2019abonnement, pas de frais cach\u00e9s.",
                gradient: "from-pink-500/20 to-pink-500/5",
                iconColor: "text-pink-400",
                border: "border-pink-500/20",
              },
            ].map((f, i) => (
              <div key={i} className={`group relative rounded-2xl sm:rounded-3xl bg-gradient-to-b ${f.gradient} border ${f.border} p-5 sm:p-7 hover:scale-[1.02] transition-all duration-300`}>
                <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gray-100/50 flex items-center justify-center mb-3 sm:mb-4 ${f.iconColor}`}>
                  <f.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">{f.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-24 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3">
              3 &eacute;tapes. C&apos;est tout.
            </h2>
            <p className="text-gray-600 text-base sm:text-lg">De z&eacute;ro &agrave; votre premi&egrave;re vente en moins de 5 minutes.</p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {[
              { step: "01", title: "Cr\u00e9ez votre boutique", desc: "Inscription en 30 secondes. Ajoutez vos produits et c\u2019est parti.", color: "bg-emerald-500", icon: Store },
              { step: "02", title: "Partagez votre QR Code", desc: "Affichez-le en boutique, envoyez-le par WhatsApp ou int\u00e9grez-le en ligne.", color: "bg-cyan-500", icon: QrCode },
              { step: "03", title: "Encaissez instantan\u00e9ment", desc: "Le client scanne, paie avec sa carte ou son mobile money. Vous \u00eates notifi\u00e9.", color: "bg-violet-500", icon: Zap },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 sm:gap-5 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gray-50/50 border border-gray-200/50 hover:bg-gray-50/80 transition-all group">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${item.color} text-white flex items-center justify-center font-black text-sm sm:text-lg shrink-0 group-hover:scale-110 transition-transform shadow-lg`}>
                  {item.step}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="tarifs" className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-3">
              Des tarifs <span className="text-emerald-600">simples</span>.
            </h2>
            <p className="text-gray-600 text-base sm:text-lg">Pas d&apos;abonnement. Vous ne payez que quand vous encaissez.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto">
            <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-emerald-500/10 to-emerald-500/[0.02] border border-emerald-200/40 p-5 sm:p-7 text-center">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CreditCard className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">Par carte</h3>
              <p className="text-2xl sm:text-4xl font-black text-emerald-600 mb-1.5 sm:mb-2">2,9%</p>
              <p className="text-sm text-gray-600">+ 0,30 &euro; par transaction</p>
            </div>
            <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-cyan-500/10 to-cyan-500/[0.02] border border-cyan-500/20 p-5 sm:p-7 text-center">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Smartphone className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">Mobile money</h3>
              <p className="text-2xl sm:text-4xl font-black text-cyan-600 mb-1.5 sm:mb-2">3%</p>
              <p className="text-sm text-gray-600">par transaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-[2rem] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-cyan-500" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

            <div className="relative z-10 p-6 sm:p-16 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl">
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white" />
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
                Pr&ecirc;t &agrave; vendre ?
              </h2>
              <p className="text-lg text-white/80 max-w-lg mx-auto mb-8">
                Ouvrez votre boutique Binq gratuitement. Encaissez d&egrave;s aujourd&apos;hui par QR Code.
              </p>
              <Link href="/inscription" className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-gray-900 font-black rounded-2xl hover:bg-gray-100 transition-all shadow-xl text-base">
                Cr&eacute;er ma boutique
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200/50 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Star className="w-4 h-4 text-emerald-600 fill-emerald-400" />
              </div>
              <span className="font-bold text-gray-600 tracking-tight">Binq</span>
            </div>
            <p className="text-[11px] text-gray-600 font-medium text-center sm:text-right">
              &copy; {new Date().getFullYear()} Binq. Marketplace &amp; paiement QR.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
