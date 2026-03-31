"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  Shield,
  QrCode,
  Building2,
  Users,
  BarChart3,
  Smartphone,
  Check,
  Star,
  Zap,
} from "lucide-react";

export default function BinqAccessPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ═══════ NAVBAR ═══════ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-black text-lg tracking-tight">Binq</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
            <Link href="/inscription" className="text-sm font-bold bg-emerald-500 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-1.5">
              Commencer
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="pt-20 sm:pt-32 pb-16 sm:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-8">
            <Zap className="w-4 h-4" />
            Disponible maintenant
          </div>

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 mx-auto mb-8">
            <Fingerprint className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] mb-6">
            Binq <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-400">Access</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Le terminal de vérification sur mesure pour sécuriser et gérer les accès de votre entreprise.
          </p>
          <Link href="/inscription" className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-gray-800 transition-colors text-sm sm:text-base shadow-lg shadow-gray-900/20">
            Créer mon compte
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ═══════ PROPOSITION DE VALEUR ═══════ */}
      <section className="py-16 sm:py-24 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Pourquoi choisir Binq Access</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900">Contrôlez chaque entrée, en temps réel.</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Sécurité renforcée",
                desc: "Vérification instantanée par QR code ou badge. Aucun accès non autorisé.",
              },
              {
                icon: Building2,
                title: "Adapté aux entreprises",
                desc: "Configuration sur mesure selon vos locaux, équipes et niveaux d'accès.",
              },
              {
                icon: QrCode,
                title: "Scan instantané",
                desc: "Vérification en moins d'une seconde. Aucune file d'attente.",
              },
              {
                icon: Users,
                title: "Gestion des visiteurs",
                desc: "Enregistrez, suivez et gérez tous les visiteurs et employés.",
              },
              {
                icon: BarChart3,
                title: "Tableau de bord temps réel",
                desc: "Visualisez qui est présent, les heures d'entrée/sortie et les statistiques.",
              },
              {
                icon: Smartphone,
                title: "Multi-appareils",
                desc: "Fonctionne sur tablette, téléphone ou terminal dédié.",
              },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-200 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                  <f.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ COMMENT ÇA MARCHE ═══════ */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Fonctionnement</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900">Simple à mettre en place.</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Configurez", desc: "Définissez vos zones, niveaux d'accès et horaires autorisés." },
              { step: "2", title: "Distribuez", desc: "Attribuez des QR codes ou badges à vos employés et visiteurs." },
              { step: "3", title: "Contrôlez", desc: "Scannez à l'entrée. Tout est tracé en temps réel sur votre tableau de bord." },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white text-lg font-black flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CAS D'USAGE ═══════ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Cas d&apos;usage</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900">Pour qui ?</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: "Bureaux & Coworkings", items: ["Contrôle d'accès par badge/QR", "Gestion des horaires", "Suivi des présences"] },
              { title: "Événements privés", items: ["Liste d'invités digitale", "Scan rapide à l'entrée", "Statistiques de fréquentation"] },
              { title: "Salles de sport & Clubs", items: ["Vérification d'abonnement", "Détection des expirations", "Historique des visites"] },
              { title: "Résidences & Immeubles", items: ["Accès sécurisé résidents", "Gestion des visiteurs", "Registre automatique"] },
            ].map((c, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-200 hover:border-emerald-200 transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{c.title}</h3>
                <ul className="space-y-2.5">
                  {c.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Prêt à sécuriser vos accès ?
          </h2>
          <p className="text-gray-500 mb-8 max-w-xl mx-auto">
            Créez votre compte gratuitement et configurez votre premier point de contrôle en quelques minutes.
          </p>
          <Link
            href="/inscription"
            className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-gray-800 transition-colors text-sm sm:text-base shadow-lg shadow-gray-900/20"
          >
            Créer mon compte — Gratuit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Binq. Tous droits réservés.</p>
          <Link href="/" className="hover:text-gray-600 transition-colors">Retour à l&apos;accueil</Link>
        </div>
      </footer>
    </div>
  );
}
