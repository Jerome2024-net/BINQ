import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Shield,
  Users,
  TrendingUp,
  CreditCard,
  Clock,
  CheckCircle2,
  ArrowRight,
  CircleDollarSign,
  Zap,
  Globe,
  Lock,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary-400/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-accent-500/10 rounded-full blur-[80px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-accent-400" />
              <span className="text-[13px] font-medium text-gray-300">
                La plateforme de tontine digitale #1
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-[68px] font-bold leading-[1.08] mb-6 tracking-tight">
              Gérez vos tontines{" "}
              <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">en ligne</span>
              , simplement.
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Créez des groupes, suivez les cotisations et gérez les tours de bénéfice. Tout ça depuis votre téléphone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/inscription"
                className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-semibold text-[15px] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Commencer gratuitement
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
                <span className="text-[13px]">Inscription gratuite</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-500" />
                <span className="text-[13px]">Sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-500" />
                <span className="text-[13px]">Mobile-first</span>
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
              Tout ce qu&apos;il faut pour votre tontine
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Des outils puissants et simples pour gérer chaque aspect de votre
              tontine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {[
              {
                icon: Users,
                title: "Gestion des Membres",
                description:
                  "Invitez des membres, gérez les rôles et suivez la participation en temps réel.",
                gradient: "from-blue-500 to-blue-600",
                bg: "bg-blue-50",
              },
              {
                icon: CircleDollarSign,
                title: "Suivi des Cotisations",
                description:
                  "Visualisez qui a payé, les montants en attente et l'historique des paiements.",
                gradient: "from-primary-500 to-primary-600",
                bg: "bg-primary-50",
              },
              {
                icon: Clock,
                title: "Tours Automatiques",
                description:
                  "Planifiez les tours avec un calendrier clair et des rappels automatiques.",
                gradient: "from-violet-500 to-violet-600",
                bg: "bg-violet-50",
              },
              {
                icon: Shield,
                title: "Sécurité Renforcée",
                description:
                  "Données et transactions protégées par un chiffrement de niveau bancaire.",
                gradient: "from-rose-500 to-rose-600",
                bg: "bg-rose-50",
              },
              {
                icon: CreditCard,
                title: "Paiements Sécurisés",
                description:
                  "Payez vos cotisations par carte bancaire ou Stripe directement depuis l'app.",
                gradient: "from-amber-500 to-orange-600",
                bg: "bg-amber-50",
              },
              {
                icon: TrendingUp,
                title: "Tableaux de Bord",
                description:
                  "Statistiques claires sur l'évolution et la santé financière du groupe.",
                gradient: "from-emerald-500 to-teal-600",
                bg: "bg-emerald-50",
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
              Démarrez en 3 étapes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200" />
            
            {[
              {
                step: "01",
                icon: Users,
                title: "Créez votre groupe",
                description:
                  "Inscrivez-vous et créez votre tontine en quelques clics. Définissez le montant et la fréquence.",
              },
              {
                step: "02",
                icon: CircleDollarSign,
                title: "Cotisez ensemble",
                description:
                  "Chaque membre paie sa cotisation par carte ou virement. Suivez en temps réel.",
              },
              {
                step: "03",
                icon: CircleDollarSign,
                title: "Recevez votre tour",
                description:
                  "À chaque tour, un membre reçoit la cagnotte. Calendrier transparent et accessible.",
              },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-glow relative z-10">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-2 block">Étape {step.step}</span>
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
                Confiance & Sécurité
              </span>
              <h2 className="text-3xl md:text-[42px] font-bold text-gray-900 mt-3 mb-6 tracking-tight leading-tight">
                La transparence au cœur de notre plateforme
              </h2>
              <div className="space-y-5">
                {[
                  {
                    icon: Lock,
                    title: "Données chiffrées",
                    desc: "Toutes vos informations sont protégées par un chiffrement AES-256.",
                  },
                  {
                    icon: Globe,
                    title: "Accessible partout",
                    desc: "Gérez votre tontine depuis n'importe quel appareil, à tout moment.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Historique complet",
                    desc: "Chaque transaction est enregistrée et traçable pour une totale transparence.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                      <item.icon className="w-5 h-5 text-primary-600" />
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

            {/* Visual card */}
            <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Vos données en sécurité</h3>
              <p className="text-gray-500 mb-6 text-[15px]">Chaque transaction est chiffrée, traçable et vérifiable en temps réel.</p>
              <div className="w-full space-y-2.5">
                {[
                  "Paiement sécurisé via Stripe",
                  "Dépôts et retraits en EUR / USD",
                  "Historique complet des opérations",
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
              Pas de frais cachés. Participez gratuitement, souscrivez un abonnement uniquement pour organiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Participant */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 hover:border-gray-300 transition-colors">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Participant</h3>
              <p className="text-gray-500 text-[15px] mb-6">Rejoignez des tontines et épargnez ensemble</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">Gratuit</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Rejoindre des tontines illimitées",
                  "Payer ses cotisations en ligne",
                  "Dépôts et retraits gratuits",
                  "1% de frais sur chaque cotisation",
                  "Historique complet des transactions",
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600 text-[15px]">
                    <CheckCircle2 className="w-4 h-4 text-accent-500 flex-shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/inscription"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Commencer
              </Link>
            </div>

            {/* Organisateur */}
            <div className="bg-gray-950 rounded-3xl p-8 relative shadow-2xl">
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-accent-500 to-accent-600 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-glow-accent">
                Recommandé
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Organisateur</h3>
              <p className="text-gray-400 text-[15px] mb-4">Créez et gérez vos propres tontines</p>

              {/* Essai gratuit */}
              <div className="bg-accent-500/10 border border-accent-500/20 rounded-xl p-3 mb-4">
                <p className="text-accent-400 font-semibold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Essai gratuit 90 jours
                </p>
                <p className="text-gray-500 text-xs mt-0.5">Sans engagement ni carte bancaire</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">180</span>
                <span className="text-lg text-gray-400"> €/an</span>
                <span className="text-[13px] text-gray-500 ml-1">après l&apos;essai</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Tout du plan Participant",
                  "Créer des tontines illimitées",
                  "Gérer les membres et les tours",
                  "Tableau de bord organisateur",
                  "Support prioritaire",
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300 text-[15px]">
                    <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/inscription"
                className="block w-full text-center bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all hover:bg-gray-100 shadow-lg"
              >
                Commencer l&apos;essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-primary-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-accent-500/10 rounded-full blur-[80px]" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
            Prêt à digitaliser votre tontine ?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Rejoignez des milliers d&apos;utilisateurs qui font confiance à Binq
            pour gérer leurs épargnes collectives.
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
