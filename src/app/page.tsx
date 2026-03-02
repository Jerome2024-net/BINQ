"use client";

import Link from "next/link";
import {
  Bitcoin,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Zap,
  BarChart3,
  Clock,
  ArrowRight,
  Lock,
  Globe,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* ══════════════════════════════════════════
          HEADER (Dark Premium)
          ══════════════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all duration-300">
              <Bitcoin className="w-5 h-5 text-zinc-950" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Binq</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/connexion"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="relative group text-sm font-semibold inline-flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur opacity-40 group-hover:opacity-75 transition-opacity duration-300"></div>
              <div className="relative bg-zinc-50 text-zinc-950 px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-white transition-colors">
                Commencer
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          HERO (Dark High-End)
          ══════════════════════════════════════════ */}
      <section className="relative pt-40 pb-20 sm:pt-52 sm:pb-32 overflow-hidden">
        {/* Glowing Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-amber-400 text-xs font-medium mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            La plateforme Bitcoin nouvelle génération
          </div>

          <h1 className="text-5xl sm:text-7xl min:text-8xl font-black tracking-tight leading-[1.05] mb-8 text-white">
            Achetez du Bitcoin. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600">
              Sans compromis.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Investissez dans le Bitcoin instantanément par carte bancaire. 
            Une interface épurée, une sécurité absolue, et une transparence totale sur vos frais.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/inscription"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-zinc-950 font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]"
            >
              <TrendingUp className="w-5 h-5" />
              Acheter du Bitcoin
            </Link>
            <Link
              href="/connexion"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/5 text-white font-semibold rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
            >
              Se connecter
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 sm:mt-24 pt-10 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { label: "Paiement", value: "Stripe™", icon: ShieldCheck },
              { label: "Frais uniques", value: "1.5%", icon: Zap },
              { label: "Execution", value: "Instantanée", icon: Clock },
              { label: "Chiffrement", value: "AES-256", icon: Lock },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-2">
                <stat.icon className="w-5 h-5 text-zinc-500" />
                <div>
                  <div className="text-white font-bold">{stat.value}</div>
                  <div className="text-xs text-zinc-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES (Apple-like Cards)
          ══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 relative z-10 bg-[#0a0a0a] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16 md:mb-24 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              L&apos;excellence à chaque étape.
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl">
              Nous avons repensé l&apos;achat de Bitcoin pour vous offrir l&apos;expérience la plus fluide et sécurisée du marché.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 (Large) */}
            <div className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/5 p-8 sm:p-10 hover:border-amber-500/30 transition-colors duration-500 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center mb-6">
                  <CreditCard className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Paiement par carte bancaire</h3>
                <p className="text-zinc-400 leading-relaxed max-w-md">
                  Achetez par Visa ou Mastercard via l&apos;infrastructure Stripe la plus sécurisée au monde. Votre Bitcoin est crédité sur votre portefeuille en quelques secondes.
                </p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-zinc-900 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors duration-700" />
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/5 p-8 sm:p-10 hover:border-amber-500/30 transition-colors duration-500 backdrop-blur-sm">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Prix en temps réel</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  Des cotations actualisées à la seconde. Aucune marge cachée, vous achetez au véritable prix du marché.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/5 p-8 sm:p-10 hover:border-amber-500/30 transition-colors duration-500 backdrop-blur-sm">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Transparence totale</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  1.5% de frais de transaction, affichés clairement avant chaque confirmation. Pas d&apos;abonnement.
                </p>
              </div>
            </div>

            {/* Feature 4 (Large) */}
            <div className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/5 p-8 sm:p-10 hover:border-amber-500/30 transition-colors duration-500 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-tl from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Sécurité institutionnelle</h3>
                <p className="text-zinc-400 leading-relaxed max-w-md">
                  Vos portefeuilles sont protégés par chiffrement AES-256. Toute l&apos;infrastructure de paiement est certifiée PCI-DSS Niveau 1.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS (Minimal Path)
          ══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              Conçu pour la simplicité.
            </h2>
            <p className="text-zinc-400 text-lg">Trois étapes vers votre autonomie financière.</p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-[27px] top-6 bottom-6 w-px bg-gradient-to-b from-amber-500/50 via-zinc-800 to-transparent hidden sm:block" />

            <div className="space-y-12">
              {[
                {
                  step: "01",
                  title: "Créez votre compte en 30s",
                  desc: "Une inscription minimale sécurisée pour commencer immédiatement.",
                },
                {
                  step: "02",
                  title: "Saisissez votre montant",
                  desc: "Investissez à partir de 1€. Calculez vos Bitcoins en temps réel.",
                },
                {
                  step: "03",
                  title: "Validez votre paiement",
                  desc: "Entrez votre carte, recevez vos Bitcoins sur votre wallet instantanément.",
                },
              ].map((item, i) => (
                <div key={i} className="relative flex flex-col sm:flex-row items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 text-amber-500 flex items-center justify-center font-bold text-lg flex-shrink-0 relative z-10 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-zinc-950 transition-all duration-300 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]">
                    {item.step}
                  </div>
                  <div className="pt-2 sm:pt-3">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">{item.title}</h3>
                    <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA SECTION
          ══════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-[#111111] to-zinc-950 border border-white/10 p-10 sm:p-20 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-8 shadow-2xl shadow-amber-500/20">
                <Bitcoin className="w-8 h-8 text-zinc-950" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-6">
                Passez au niveau supérieur.
              </h2>
              <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10">
                Rejoignez Binq aujourd&apos;hui et prenez le contrôle de vos investissements Bitcoin sur la plateforme la plus élégante du marché.
              </p>
              <Link
                href="/inscription"
                className="group flex items-center justify-center gap-2 px-10 py-5 bg-white text-zinc-950 font-bold rounded-2xl hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)]"
              >
                Créer mon compte gratuitement
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-zinc-950 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-12 text-center md:text-left bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/10">
                <Bitcoin className="w-5 h-5 text-amber-500" />
              </div>
              <span className="font-bold text-white tracking-tight">Binq</span>
            </div>
            
            <div className="text-xs text-zinc-500 font-medium">
              © {new Date().getFullYear()} Binq. Tous droits réservés. L'investissement en crypto-actifs comporte des risques.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
