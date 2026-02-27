import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Shield,
  CheckCircle2,
  ArrowRight,
  Lock,
  Sparkles,
  Wallet,
  Zap,
  CreditCard,
  PiggyBank,
  Bitcoin,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary-400/10 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 md:py-40 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-accent-400" />
              <span className="text-[13px] font-medium text-gray-300">
                Intelligent Wallet
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-[68px] font-bold leading-[1.08] mb-6 tracking-tight">
              Contrôlez votre argent.{" "}
              <span className="bg-gradient-to-r from-primary-400 to-primary-400 bg-clip-text text-transparent">
                Simplement
              </span>
              .
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Un portefeuille sécurisé pour envoyer, recevoir, épargner et investir en Bitcoin — le tout en temps réel.
            </p>
            <Link
              href="/inscription"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-2xl font-semibold text-[15px] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Ouvrir un compte gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-500" />
                <span className="text-[13px]">Inscription en 30 secondes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-500" />
                <span className="text-[13px]">Sécurisé par Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-500" />
                <span className="text-[13px]">0 € / mois</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages — benefit-oriented */}
      <section className="py-16 sm:py-24 bg-surface-50" id="fonctionnalites">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-label">Pourquoi Binq</span>
            <h2 className="text-3xl md:text-[42px] font-bold text-gray-900 mt-3 mb-4 tracking-tight">
              Un seul compte, zéro limite
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">
              Tout ce dont vous avez besoin pour maîtriser votre argent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Wallet,
                title: "Un wallet puissant",
                description:
                  "Déposez, retirez et suivez votre solde en temps réel. EUR et USD supportés.",
                bg: "bg-primary-50",
                color: "text-primary-600",
              },
              {
                icon: Zap,
                title: "Des transferts instantanés",
                description:
                  "Envoyez de l'argent à n'importe qui en quelques secondes, sans intermédiaire.",
                bg: "bg-primary-50",
                color: "text-primary-600",
              },
              {
                icon: CreditCard,
                title: "Des paiements simplifiés",
                description:
                  "Créez un lien, partagez-le. Le destinataire reçoit le paiement instantanément.",
                bg: "bg-emerald-50",
                color: "text-emerald-600",
              },
              {
                icon: PiggyBank,
                title: "Une épargne intelligente",
                description:
                  "Organisez votre argent dans des coffres dédiés. Objectif, libre ou programmé.",
                bg: "bg-amber-50",
                color: "text-amber-600",
              },
              {
                icon: Bitcoin,
                title: "Bitcoin intégré",
                description:
                  "Achetez et vendez du Bitcoin directement depuis votre portefeuille, au prix du marché en temps réel.",
                bg: "bg-amber-50",
                color: "text-amber-600",
              },
              {
                icon: Shield,
                title: "Sécurité maximale",
                description:
                  "Chiffrement bancaire, transactions sécurisées par Stripe. Votre argent est protégé.",
                bg: "bg-emerald-50",
                color: "text-emerald-600",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl border border-gray-100/80 p-7 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-[15px] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="section-label">Comment ça marche</span>
            <h2 className="text-3xl md:text-[42px] font-bold text-gray-900 mt-3 mb-4 tracking-tight">
              Prêt en 3&nbsp;étapes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200" />

            {[
              {
                step: "01",
                title: "Créez votre compte",
                description: "Sans papiers, sans attente. Juste un email.",
              },
              {
                step: "02",
                title: "Déposez de l'argent",
                description: "Par carte bancaire, en un clic.",
              },
              {
                step: "03",
                title: "Utilisez Binq",
                description: "Envoyez, recevez, épargnez. Tout est prêt.",
              },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-glow relative z-10">
                  <span className="text-white text-lg font-bold">{step.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-[15px] leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sécurité — compact */}
      <section className="py-16 sm:py-24 bg-surface-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-label">Sécurité</span>
            <h2 className="text-3xl md:text-[42px] font-bold text-gray-900 mt-3 mb-4 tracking-tight">
              Votre argent est entre de bonnes mains
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                title: "Transactions sécurisées",
                desc: "Chiffrement bancaire sur chaque opération.",
              },
              {
                icon: Shield,
                title: "Protection Stripe",
                desc: "Le standard de sécurité utilisé par les plus grandes fintechs.",
              },
              {
                icon: CheckCircle2,
                title: "Historique transparent",
                desc: "Chaque mouvement est traçable, en temps réel.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100/80 p-6 text-center"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-500 text-[15px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section className="py-16 sm:py-24 bg-white" id="tarifs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-label">Tarifs</span>
            <h2 className="text-3xl md:text-[42px] font-bold text-gray-900 mt-3 mb-4 tracking-tight">
              Gratuit. Point final.
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">
              Pas de forfait, pas de frais cachés. Vous payez uniquement 2&nbsp;% sur les dépôts par carte.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-gray-950 rounded-3xl p-6 sm:p-8 relative shadow-2xl">
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-accent-500 to-accent-600 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-glow-accent">
                100 % Gratuit
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Binq</h3>
              <p className="text-gray-400 text-[15px] mb-6">
                Votre compte digital complet
              </p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">0 €</span>
                <span className="text-lg text-gray-400"> /mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Wallet EUR & USD",
                  "Transferts instantanés illimités",
                  "Liens de paiement partageables",
                  "Jusqu'à 10 coffres",
                  "Achat & vente de Bitcoin",
                  "Dépôts & retraits par carte",
                  "Historique complet en temps réel",
                ].map((text, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-gray-300 text-[15px]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/inscription"
                className="block w-full text-center bg-white text-gray-900 px-6 py-3.5 rounded-xl font-semibold transition-all hover:bg-gray-100 shadow-lg"
              >
                Ouvrir mon compte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gray-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-primary-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-primary-500/10 rounded-full blur-[80px]" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
            Prenez le contrôle de votre argent.
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Créez votre compte Binq en 30 secondes. Gratuit, sécurisé, sans engagement.
          </p>
          <Link
            href="/inscription"
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-2xl font-semibold text-[15px] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Commencer maintenant
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
