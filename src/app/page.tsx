"use client";

import Link from "next/link";
import {
  Bitcoin,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Clock,
  BarChart3,
  ArrowRight,
  Lock,
  Zap,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ══════════════════════════════════════════
          HEADER
          ══════════════════════════════════════════ */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Bitcoin className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">Binq</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/connexion"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="text-sm font-semibold bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          HERO
          ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/50 to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-amber-300/20 to-orange-200/10 rounded-full blur-3xl -translate-y-1/2" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold mb-6">
            <Bitcoin className="w-3.5 h-3.5" />
            Plateforme d&apos;achat et vente de Bitcoin
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-5">
            Achetez et vendez du{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              Bitcoin
            </span>
            <br />
            en toute simplicité
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Achetez du BTC par carte bancaire en quelques secondes.
            Prix en temps réel, frais transparents, paiement sécurisé via Stripe.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/inscription"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20"
            >
              <TrendingUp className="w-5 h-5" />
              Acheter du Bitcoin
            </Link>
            <Link
              href="/connexion"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Se connecter
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Paiement Stripe
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Lock className="w-4 h-4 text-blue-500" />
              Données chiffrées
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Zap className="w-4 h-4 text-amber-500" />
              Instantané
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Pourquoi choisir Binq ?
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              La façon la plus simple d&apos;acheter et vendre du Bitcoin en Europe.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: CreditCard,
                title: "Achat par carte bancaire",
                desc: "Visa ou Mastercard, achetez du Bitcoin en quelques clics. Paiement 100% sécurisé via Stripe.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                icon: TrendingUp,
                title: "Prix en temps réel",
                desc: "Cours Bitcoin actualisé en direct. Vous achetez au meilleur prix du marché avec une transparence totale.",
                color: "bg-green-50 text-green-600",
              },
              {
                icon: ShieldCheck,
                title: "Sécurité maximale",
                desc: "Infrastructure Stripe PCI-DSS, données chiffrées, authentification multi-facteurs.",
                color: "bg-purple-50 text-purple-600",
              },
              {
                icon: Zap,
                title: "Transactions instantanées",
                desc: "Votre Bitcoin est crédité immédiatement après confirmation du paiement. Pas d'attente.",
                color: "bg-amber-50 text-amber-600",
              },
              {
                icon: BarChart3,
                title: "Suivi de portefeuille",
                desc: "Suivez la valeur de votre portefeuille Bitcoin en euros en temps réel avec historique complet.",
                color: "bg-indigo-50 text-indigo-600",
              },
              {
                icon: Clock,
                title: "Frais transparents",
                desc: "1.5% de frais par transaction. Pas de frais cachés, pas d'abonnement. Vous savez ce que vous payez.",
                color: "bg-pink-50 text-pink-600",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Comment ça marche ?
            </h2>
            <p className="text-gray-500 mt-3">3 étapes pour acheter votre premier Bitcoin</p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Créez votre compte",
                desc: "Inscription gratuite en 30 secondes avec email et mot de passe.",
                color: "bg-blue-600",
              },
              {
                step: "2",
                title: "Choisissez votre montant",
                desc: "Entrez le montant en euros que vous souhaitez investir en Bitcoin. À partir de 1 €.",
                color: "bg-amber-500",
              },
              {
                step: "3",
                title: "Payez par carte bancaire",
                desc: "Réglez par Visa ou Mastercard via Stripe. Votre Bitcoin est crédité instantanément.",
                color: "bg-green-600",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className={`w-10 h-10 rounded-full ${item.color} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                  {item.step}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-gray-50/50">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Tarification simple
            </h2>
            <p className="text-gray-500 mt-3">Pas d&apos;abonnement. Payez uniquement quand vous tradez.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <div className="text-center mb-6">
              <p className="text-4xl font-extrabold text-gray-900">1.5%</p>
              <p className="text-sm text-gray-500 mt-1">par transaction</p>
            </div>

            <div className="space-y-3 mb-8">
              {[
                "Achat de Bitcoin par carte bancaire",
                "Vente de Bitcoin",
                "Prix en temps réel",
                "Portefeuille Bitcoin sécurisé",
                "Historique complet des transactions",
                "Pas de limite d'achat",
                "Pas de frais cachés",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/inscription"
              className="block w-full text-center py-3.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Créer mon compte gratuitement
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl" />

            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
                <Bitcoin className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Prêt à investir dans le Bitcoin ?
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Rejoignez Binq et achetez votre premier Bitcoin en moins de 2 minutes.
              </p>
              <Link
                href="/inscription"
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20"
              >
                <TrendingUp className="w-5 h-5" />
                Acheter du Bitcoin maintenant
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Bitcoin className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-gray-900">Binq</span>
              <span className="text-xs text-gray-400">— Achat & Vente de Bitcoin</span>
            </div>
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Binq. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
