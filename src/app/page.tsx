"use client";

import Link from "next/link";
import {
  Wallet,
  SendHorizonal,
  ArrowDownToLine,
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  Users,
  ChevronRight,
  Smartphone,
  QrCode,
  Globe2,
  Sparkles,
  ArrowUpRight,
  CircleDollarSign,
  Star,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans antialiased text-white overflow-x-hidden">

      {/* ── HEADER ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tight">Binq</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/connexion" className="text-[11px] sm:text-sm font-semibold text-white/60 hover:text-white transition-colors px-2 sm:px-3 py-2">
              <span className="hidden sm:inline">Se connecter</span>
              <span className="sm:hidden">Connexion</span>
            </Link>
            <Link href="/inscription" className="text-[11px] sm:text-sm font-bold bg-emerald-500 text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-2xl hover:bg-emerald-400 transition-all flex items-center gap-1 sm:gap-1.5 shadow-lg shadow-emerald-500/25">
              <span className="hidden sm:inline">Ouvrir un compte</span>
              <span className="sm:hidden">S&apos;inscrire</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-30%] left-[-10%] w-[70vw] h-[70vw] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/4 right-1/4 w-[30vw] h-[30vw] bg-emerald-600/10 rounded-full blur-[80px]" />
          {/* Dot grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          {/* Badge */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              L&apos;app mobile money nouvelle g&eacute;n&eacute;ration
            </div>
          </div>

          {/* Headline */}
          <div className="text-center">
            <h1 className="text-[2.5rem] sm:text-6xl lg:text-[5rem] font-black tracking-tight leading-[1.05] mb-5 sm:mb-7">
              Votre{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400">mobile money.</span>
            </h1>

            <p className="text-base sm:text-xl text-white/50 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
              Envoyez, recevez et d&eacute;posez de l&apos;argent en un instant.
              Binq, votre portefeuille mobile.
            </p>

            {/* CTA */}
            <div className="flex flex-row sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 max-w-[340px] sm:max-w-none mx-auto mb-10 sm:mb-14">
              <Link href="/inscription" className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-2.5 px-3 sm:px-8 py-3 sm:py-4 bg-emerald-500 text-white font-bold rounded-xl sm:rounded-2xl hover:bg-emerald-400 transition-all shadow-lg sm:shadow-xl shadow-emerald-500/25 text-[13px] sm:text-base whitespace-nowrap">
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 hidden sm:block" />
                <span className="hidden sm:inline">Ouvrir mon compte gratuit</span>
                <span className="sm:hidden">S&apos;inscrire</span>
              </Link>
              <Link href="/connexion" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-8 py-3 sm:py-4 bg-white/[0.06] text-white/80 font-semibold rounded-xl sm:rounded-2xl border border-white/[0.08] hover:bg-white/[0.1] transition-all backdrop-blur-sm text-[13px] sm:text-base whitespace-nowrap">
                 <span className="hidden sm:inline">D&eacute;j&agrave; inscrit ? Connexion</span>
                 <span className="sm:hidden">Connexion</span>
              </Link>
            </div>
          </div>

          {/* ── Mock Phone UI ── */}
          <div className="relative max-w-xs mx-auto">
            <div className="relative bg-gradient-to-b from-[#111] to-[#0d0d0d] rounded-[2.5rem] border border-white/[0.08] p-6 pt-8 pb-8 shadow-2xl shadow-emerald-900/20">
              {/* Status bar mock */}
              <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
                <span className="text-[9px] sm:text-[10px] text-white/30 font-bold">9:41</span>
                <div className="flex gap-1">
                  <div className="w-4 h-2 rounded-sm bg-white/20" />
                  <div className="w-3 h-2 rounded-sm bg-white/20" />
                  <div className="w-6 h-2.5 rounded-sm bg-emerald-500/60" />
                </div>
              </div>

              {/* Balance */}
              <div className="text-center mb-4 sm:mb-6">
                <p className="text-[9px] sm:text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 sm:mb-2">Solde disponible</p>
                <p className="text-2xl sm:text-4xl font-black tracking-tight">819 672 <span className="text-sm sm:text-lg text-white/30">FCFA</span></p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {[
                  { icon: ArrowDownToLine, label: "D\u00e9poser", color: "from-emerald-500 to-emerald-600" },
                  { icon: SendHorizonal, label: "Envoyer", color: "from-cyan-500 to-cyan-600" },
                  { icon: QrCode, label: "Scanner", color: "from-violet-500 to-violet-600" },
                ].map((btn, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 sm:gap-1.5">
                    <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${btn.color} flex items-center justify-center shadow-lg`}>
                      <btn.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-white/40">{btn.label}</span>
                  </div>
                ))}
              </div>

              {/* Activity preview */}
              <div className="space-y-2">
                {[
                  { name: "Moussa K.", amount: "+50,00 \u20ac", time: "Il y a 2min", credit: true },
                  { name: "D\u00e9p\u00f4t carte", amount: "+100,00 \u20ac", time: "Hier", credit: true },
                  { name: "Fatou D.", amount: "-25,00 \u20ac", time: "Lundi", credit: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-white/[0.03]">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold ${item.credit ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.06] text-white/40"}`}>
                      {item.credit ? "+" : "-"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/80 truncate">{item.name}</p>
                      <p className="text-[10px] text-white/25">{item.time}</p>
                    </div>
                    <span className={`text-xs font-bold ${item.credit ? "text-emerald-400" : "text-white/50"}`}>{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Glow behind phone */}
            <div className="absolute -inset-4 bg-emerald-500/10 rounded-[2.5rem] sm:rounded-[3rem] blur-2xl -z-10" />
          </div>

          {/* Stats row */}
          <div className="mt-10 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 max-w-3xl mx-auto">
            {[
              { label: "Transactions", value: "Instantan\u00e9es", icon: Zap },
              { label: "D\u00e9p\u00f4ts", value: "1% de frais", icon: ArrowDownToLine },
              { label: "Transferts", value: "Gratuits", icon: SendHorizonal },
              { label: "S\u00e9curit\u00e9", value: "AES-256", icon: Lock },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <p className="text-white font-bold text-xs sm:text-sm">{stat.value}</p>
                <p className="text-[9px] sm:text-[10px] text-white/30 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="fonctionnalites" className="py-16 sm:py-24 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-emerald-400 text-xs font-bold mb-5">
              <CircleDollarSign className="w-3.5 h-3.5" />
              Fonctionnalit&eacute;s
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4">
              Tout pour votre argent.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">En mieux.</span>
            </h2>
            <p className="text-white/40 text-base sm:text-lg max-w-xl mx-auto">
              Une exp&eacute;rience mobile money compl&egrave;te, pens&eacute;e pour l&apos;Afrique et le monde.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: ArrowDownToLine,
                title: "D\u00e9p\u00f4t par carte",
                desc: "Visa, Mastercard. Votre argent est cr\u00e9dit\u00e9 en quelques secondes.",
                gradient: "from-emerald-500/20 to-emerald-500/5",
                iconColor: "text-emerald-400",
                border: "border-emerald-500/20",
              },
              {
                icon: SendHorizonal,
                title: "Envoi instantan\u00e9",
                desc: "Transf\u00e9rez \u00e0 n\u2019importe quel utilisateur Binq. Gratuit. Imm\u00e9diat.",
                gradient: "from-cyan-500/20 to-cyan-500/5",
                iconColor: "text-cyan-400",
                border: "border-cyan-500/20",
              },
              {
                icon: QrCode,
                title: "QR Code paiement",
                desc: "Scannez ou partagez votre code pour recevoir de l\u2019argent en un geste.",
                gradient: "from-violet-500/20 to-violet-500/5",
                iconColor: "text-violet-400",
                border: "border-violet-500/20",
              },
              {
                icon: Globe2,
                title: "Multi-devises",
                desc: "FCFA et EUR — g\u00e9rez vos devises dans un seul portefeuille.",
                gradient: "from-orange-500/20 to-orange-500/5",
                iconColor: "text-orange-400",
                border: "border-orange-500/20",
              },
              {
                icon: ShieldCheck,
                title: "Ultra s\u00e9curis\u00e9",
                desc: "Chiffrement bancaire, v\u00e9rification en 2 \u00e9tapes, PCI-DSS Niveau 1.",
                gradient: "from-emerald-500/20 to-emerald-500/5",
                iconColor: "text-emerald-400",
                border: "border-emerald-500/20",
              },
              {
                icon: Users,
                title: "Communaut\u00e9",
                desc: "Rejoignez des milliers d\u2019utilisateurs qui font confiance \u00e0 Binq.",
                gradient: "from-pink-500/20 to-pink-500/5",
                iconColor: "text-pink-400",
                border: "border-pink-500/20",
              },
            ].map((f, i) => (
              <div key={i} className={`group relative rounded-2xl sm:rounded-3xl bg-gradient-to-b ${f.gradient} border ${f.border} p-5 sm:p-7 hover:scale-[1.02] transition-all duration-300`}>
                <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/[0.06] flex items-center justify-center mb-3 sm:mb-4 ${f.iconColor}`}>
                  <f.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">{f.title}</h3>
                <p className="text-white/40 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
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
            <p className="text-white/40 text-base sm:text-lg">De z&eacute;ro &agrave; votre premier envoi en moins de 2 minutes.</p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {[
              { step: "01", title: "Cr\u00e9ez votre compte", desc: "Inscription en 30 secondes. Pas de paperasse.", color: "bg-emerald-500", icon: Smartphone },
              { step: "02", title: "Ajoutez de l\u2019argent", desc: "Par carte bancaire. Cr\u00e9dit\u00e9 instantan\u00e9ment sur votre portefeuille.", color: "bg-cyan-500", icon: ArrowDownToLine },
              { step: "03", title: "Envoyez \u00e0 qui vous voulez", desc: "Transfert gratuit et imm\u00e9diat vers n\u2019importe quel utilisateur Binq.", color: "bg-violet-500", icon: SendHorizonal },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 sm:gap-5 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all group">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${item.color} text-white flex items-center justify-center font-black text-sm sm:text-lg shrink-0 group-hover:scale-110 transition-transform shadow-lg`}>
                  {item.step}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
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
              Des tarifs <span className="text-emerald-400">imbattables</span>.
            </h2>
            <p className="text-white/40 text-base sm:text-lg">Transparent, simple, sans surprise.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto">
            <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-emerald-500/10 to-emerald-500/[0.02] border border-emerald-500/20 p-5 sm:p-7 text-center">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <ArrowDownToLine className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">D&eacute;p&ocirc;ts</h3>
              <p className="text-2xl sm:text-4xl font-black text-emerald-400 mb-1.5 sm:mb-2">1%</p>
              <p className="text-sm text-white/40">de frais par d&eacute;p&ocirc;t carte</p>
            </div>
            <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-cyan-500/10 to-cyan-500/[0.02] border border-cyan-500/20 p-5 sm:p-7 text-center">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <SendHorizonal className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">Transferts</h3>
              <p className="text-2xl sm:text-4xl font-black text-cyan-400 mb-1.5 sm:mb-2">0 FCFA</p>
              <p className="text-sm text-white/40">entre utilisateurs Binq</p>
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
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl">
                <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
                Pr&ecirc;t &agrave; commencer ?
              </h2>
              <p className="text-lg text-white/70 max-w-lg mx-auto mb-8">
                Ouvrez votre compte Binq gratuitement en 30 secondes. Rejoignez la r&eacute;volution mobile money.
              </p>
              <Link href="/inscription" className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-gray-900 font-black rounded-2xl hover:bg-gray-100 transition-all shadow-2xl text-base">
                Cr&eacute;er mon compte
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-bold text-white/80 tracking-tight">Binq</span>
            </div>
            <p className="text-[11px] text-white/25 font-medium text-center sm:text-right">
              &copy; {new Date().getFullYear()} Binq. Votre argent mobile. R&eacute;invent&eacute;.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
