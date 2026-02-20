import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Shield,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Lock,
  Globe,
  Sparkles,
  PiggyBank,
  Wallet,
  Target,
  CalendarClock,
  BadgePercent,
  Banknote,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-400/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-accent-500/10 rounded-full blur-[80px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-accent-400" />
              <span className="text-[13px] font-medium text-gray-300">
                Votre épargne digitale, simple et sécurisée
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-[68px] font-bold leading-[1.08] mb-6 tracking-tight">
              Épargnez{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">intelligemment</span>
              , à votre rythme.
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Créez vos comptes épargne, déposez par carte ou portefeuille, et profitez d&apos;un bonus mensuel. En EUR ou USD, depuis votre téléphone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/inscription"
                className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-semibold text-[15px] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Commencer à épargner
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/connexion"
                className="bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-sm border border-white/[0.12] text-white px-8 py-4 rounded-2xl font-semibold text-[15px] transition-all duration-300 flex items-center justify-center gap-2"
              >
                Se connecter
              </Link>
            </div>
            <div className="mt-14 flex items-center justify-center gap-8 text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-500" />
                <span className="text-[13px]">100% gratuit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-500" />
                <span className="text-[13px]">Sécurisé par Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-500" />
                <span className="text-[13px]">Bonus 1%/an</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-surface-50" id="fonctionnalites">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-label">
              Fonctionnalités
            </span>
            <h2 className="text-3xl md:text-[42px] font-bold text-gray-900 mt-3 mb-4 tracking-tight">
              Tout pour épargner sereinement
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Des outils simples et puissants pour faire grandir votre épargne, à votre rythme.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {[
              {
                icon: PiggyBank,
                title: "Épargne Libre",
                description:
                  "Déposez et retirez quand vous voulez, sans contraintes. Votre argent reste disponible.",
                gradient: "from-indigo-500 to-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                icon: Target,
                title: "Épargne Objectif",
                description:
                  "Fixez un objectif et suivez votre progression avec une barre de progression visuelle.",
                gradient: "from-amber-500 to-orange-600",
                bg: "bg-amber-50",
              },
              {
                icon: CalendarClock,
                title: "Épargne Programmée",
                description:
                  "Automatisez vos dépôts quotidiens, hebdomadaires ou mensuels. L'épargne sans effort.",
                gradient: "from-purple-500 to-purple-600",
                bg: "bg-purple-50",
              },
              {
                icon: BadgePercent,
                title: "Bonus Mensuel",
                description:
                  "Gagnez un bonus de 1%/an calculé mensuellement sur votre solde. Votre épargne travaille pour vous.",
                gradient: "from-emerald-500 to-teal-600",
                bg: "bg-emerald-50",
              },
              {
                icon: CreditCard,
                title: "Dépôt par Carte",
                description:
                  "Enregistrez vos cartes bancaires et déposez en un clic, directement via Stripe.",
                gradient: "from-rose-500 to-rose-600",
                bg: "bg-rose-50",
              },
              {
                icon: Banknote,
                title: "Retrait Flexible",
                description:
                  "Retirez vers votre portefeuille Binq ou directement sur votre compte bancaire.",
                gradient: "from-blue-500 to-blue-600",
                bg: "bg-blue-50",
              },
            ].map((feature, i) => (
              <div key={i} className="group bg-white rounded-2xl border border-gray-100/80 p-6 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 ${feature.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 bg-gradient-to-br ${feature.gradient} bg-clip-text`} style={{color: 'inherit'}} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-[15px] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-label">
              Comment ça marche
            </span>
            <h2 className="text-3xl md:text-[42px] font-bold text-gray-900 mt-3 mb-4 tracking-tight">
              Commencez en 3 étapes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-indigo-200 via-indigo-300 to-indigo-200" />
            
            {[
              {
                step: "01",
                icon: Wallet,
                title: "Créez votre compte",
                description:
                  "Inscrivez-vous gratuitement et accédez à votre espace épargne en quelques secondes.",
              },
              {
                step: "02",
                icon: PiggyBank,
                title: "Ouvrez un compte épargne",
                description:
                  "Choisissez entre épargne libre, objectif ou programmée selon vos besoins.",
              },
              {
                step: "03",
                icon: TrendingUp,
                title: "Épargnez et gagnez",
                description:
                  "Déposez par carte ou portefeuille et profitez d'un bonus mensuel automatique.",
              },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-glow relative z-10">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 block">Étape {step.step}</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-[15px] leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-24 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="section-label">
                Confiance &amp; Sécurité
              </span>
              <h2 className="text-3xl md:text-[42px] font-bold text-gray-900 mt-3 mb-6 tracking-tight leading-tight">
                Votre argent en toute sécurité
              </h2>
              <div className="space-y-5">
                {[
                  {
                    icon: Lock,
                    title: "Paiements chiffrés",
                    desc: "Tous les dépôts et retraits passent par Stripe, le standard de sécurité bancaire.",
                  },
                  {
                    icon: Globe,
                    title: "Accessible partout",
                    desc: "Gérez votre épargne depuis n'importe quel appareil, à tout moment.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Transparence totale",
                    desc: "Chaque transaction est enregistrée avec un historique complet et traçable.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <item.icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-gray-500 text-[15px]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Votre épargne protégée</h3>
              <p className="text-gray-500 mb-6 text-[15px]">Chaque opération est sécurisée et vérifiable en temps réel.</p>
              <div className="w-full space-y-2.5">
                {[
                  "Paiements sécurisés via Stripe",
                  "Dépôts et retraits en EUR / USD",
                  "Bonus mensuel crédité automatiquement",
                  "Jusqu'à 10 comptes épargne",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 bg-accent-50 rounded-xl border border-accent-100/60">
                    <CheckCircle2 className="w-4 h-4 text-accent-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section className="py-24 bg-white" id="tarifs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-label">
              Tarifs
            </span>
            <h2 className="text-3xl md:text-[42px] font-bold text-gray-900 mt-3 mb-4 tracking-tight">
              Simple et transparent
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Pas de frais cachés. Créez votre compte et épargnez dès aujourd&apos;hui.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-gray-950 rounded-3xl p-8 relative shadow-2xl">
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-accent-500 to-accent-600 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-glow-accent">
                100% Gratuit
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Épargne Binq</h3>
              <p className="text-gray-400 text-[15px] mb-6">Tout ce dont vous avez besoin pour épargner</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">0 F</span>
                <span className="text-lg text-gray-400"> /mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Jusqu'à 10 comptes épargne",
                  "Épargne libre, objectif ou programmée",
                  "Dépôt par carte ou portefeuille",
                  "Retrait vers portefeuille ou banque",
                  "Bonus mensuel de 1%/an sur le solde",
                  "2% de frais sur les dépôts uniquement",
                  "Historique complet des transactions",
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300 text-[15px]">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/inscription"
                className="block w-full text-center bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all hover:bg-gray-100 shadow-lg"
              >
                Créer mon compte gratuitement
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px]" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
            Prêt à faire grandir votre épargne ?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Rejoignez Binq et commencez à épargner intelligemment dès aujourd&apos;hui. Gratuit, sécurisé, et avec un bonus mensuel.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/inscription"
              className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-semibold text-[15px] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Créer mon compte
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/connexion"
              className="bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] text-white px-8 py-4 rounded-2xl font-semibold text-[15px] transition-all flex items-center justify-center"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
