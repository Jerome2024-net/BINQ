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
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">

      {/* ── HEADER ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/50">
              <Bitcoin className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">Binq</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/connexion" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors px-3 py-2">
              Connexion
            </Link>
            <Link href="/inscription" className="text-sm font-bold bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all flex items-center gap-1.5 shadow-sm">
              Commencer <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-28 sm:pt-40 pb-16 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/60 via-white to-white pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-br from-amber-200/30 to-orange-100/20 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold mb-6 sm:mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Plateforme Bitcoin nouvelle génération
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6 sm:mb-8 text-gray-900">
            Achetez du Bitcoin.{" "}<br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
              Sans compromis.
            </span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-gray-500 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4">
            Investissez dans le Bitcoin instantanément par carte bancaire.
            Une interface épurée, une sécurité absolue.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
            <Link href="/inscription" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10">
              <TrendingUp className="w-5 h-5" />
              Acheter du Bitcoin
            </Link>
            <Link href="/connexion" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gray-50 text-gray-700 font-semibold rounded-2xl border border-gray-200 hover:bg-gray-100 transition-all">
              Se connecter
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 sm:mt-20 pt-8 sm:pt-10 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto px-4">
            {[
              { label: "Paiement", value: "Stripe™", icon: ShieldCheck },
              { label: "Frais uniques", value: "1.5%", icon: Zap },
              { label: "Exécution", value: "Instantanée", icon: Clock },
              { label: "Chiffrement", value: "AES-256", icon: Lock },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-1.5 py-3">
                <stat.icon className="w-5 h-5 text-amber-500" />
                <p className="text-gray-900 font-bold text-sm">{stat.value}</p>
                <p className="text-[11px] text-gray-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 sm:py-24 bg-gray-50/70 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-12 sm:mb-16 text-center">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-3 sm:mb-4">
              L&apos;excellence à chaque étape.
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto px-4">
              Nous avons repensé l&apos;achat de Bitcoin pour vous offrir l&apos;expérience la plus fluide du marché.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="sm:col-span-2 group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-10 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5 sm:mb-6">
                <CreditCard className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Paiement par carte bancaire</h3>
              <p className="text-gray-500 leading-relaxed text-sm sm:text-base max-w-md">
                Visa ou Mastercard via l&apos;infrastructure Stripe. Bitcoin crédité en quelques secondes.
              </p>
            </div>

            <div className="group rounded-2xl sm:rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-10 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5 sm:mb-6">
                <BarChart3 className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Prix en temps réel</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                Cotations à la seconde. Aucune marge cachée, prix réel du marché.
              </p>
            </div>

            <div className="group rounded-2xl sm:rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-10 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5 sm:mb-6">
                <Globe className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Transparence totale</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                1.5% de frais affichés clairement. Pas d&apos;abonnement ni frais cachés.
              </p>
            </div>

            <div className="sm:col-span-2 lg:col-span-1 group rounded-2xl sm:rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-10 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5 sm:mb-6">
                <ShieldCheck className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Sécurité maximale</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                Chiffrement AES-256 et infrastructure PCI-DSS Niveau 1.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-3">
              Conçu pour la simplicité.
            </h2>
            <p className="text-gray-500 text-base sm:text-lg">3 étapes vers votre premier Bitcoin.</p>
          </div>

          <div className="space-y-6 sm:space-y-10">
            {[
              { step: "01", title: "Créez votre compte en 30s", desc: "Inscription sécurisée et minimaliste pour commencer immédiatement.", color: "bg-amber-500" },
              { step: "02", title: "Saisissez votre montant", desc: "Investissez à partir de 1€. Calculez vos Bitcoins en temps réel.", color: "bg-orange-500" },
              { step: "03", title: "Validez votre paiement", desc: "Entrez votre carte, recevez vos Bitcoins instantanément.", color: "bg-amber-600" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 sm:gap-6 group">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.color} text-white flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {item.step}
                </div>
                <div className="pt-1 sm:pt-2">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm sm:text-base">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-2xl sm:rounded-[2rem] bg-gray-900 p-8 sm:p-16 lg:p-20 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/15 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-600/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

            <div className="relative z-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl shadow-amber-500/30">
                <Bitcoin className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4 sm:mb-6">
                Passez au niveau supérieur.
              </h2>
              <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto mb-8 sm:mb-10 px-4">
                Rejoignez Binq et prenez le contrôle de vos investissements Bitcoin.
              </p>
              <Link href="/inscription" className="group inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-5 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all shadow-xl">
                Créer mon compte gratuitement
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-8 sm:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-amber-500" />
              </div>
              <span className="font-bold text-gray-900 tracking-tight">Binq</span>
            </div>
            <p className="text-xs text-gray-400 font-medium text-center sm:text-right">
              © {new Date().getFullYear()} Binq. Tous droits réservés. L&apos;investissement en crypto-actifs comporte des risques.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
