"use client";

import Link from "next/link";
import {
  Zap,
  ArrowRight,
  Smartphone,
  QrCode,
  CircleDollarSign,
  Star,
  ScanLine,
  Ticket,
  Calendar,
  BarChart3,
  Shield,
  Sparkles,
  Wallet,
  Users,
  PieChart,
  Activity,
  ArrowUpRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans antialiased text-gray-900 selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      
      {/* ═══════ HEADER ═══════ */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/50">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">Binq</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Fonctionnalités", href: "#fonctionnalites" },
              { label: "Pour les organisateurs", href: "#organisateur" },
              { label: "Tarifs", href: "#tarifs" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="text-[15px] font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/connexion" className="hidden sm:block text-[15px] font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Se connecter
            </Link>
            <Link href="/inscription" className="text-[14px] font-bold bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-500 hover:shadow-emerald-500/25 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95">
              Créer mon événement
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-300/20 rounded-full blur-[120px] mix-blend-multiply" />
          <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-teal-300/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            
            {/* Left Copy */}
            <div className="flex-1 text-center lg:text-left pt-6 lg:pt-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200/50 text-emerald-800 text-xs sm:text-sm font-bold mb-6 sm:mb-8 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                La plateforme conçue pour les organisateurs
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6 sm:mb-8">
                Gérez vos événements comme un <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">professionnel.</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 mb-8 sm:mb-10 leading-relaxed font-medium">
                Créez votre billetterie, suivez vos ventes en temps réel et validez les entrées depuis votre smartphone. Gardez le contrôle total sur votre événement.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/inscription" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 text-[16px] group">
                  <Zap className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  Créer mon événement
                </Link>
                <a href="#organisateur" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-[16px]">
                  Découvrir les outils
                </a>
              </div>
              
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500" /> 100% Sécurisé</div>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <div className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Sans abonnement</div>
              </div>
            </div>

            {/* Right Visual (Mockups) */}
            <div className="flex-1 w-full relative max-w-[440px] mx-auto lg:max-w-none">
              <div className="relative h-[560px] w-full flex justify-center items-center">
                
                {/* Floating Stats Card 1 */}
                <div className="absolute top-10 -left-6 sm:left-4 z-20 bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 animate-[bounce_6s_ease-in-out_infinite]">
                  <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Ventes du jour</p>
                    <p className="text-xl font-black text-slate-900">450 000 F</p>
                  </div>
                </div>

                {/* Floating Validation Card 2 */}
                <div className="absolute bottom-20 -right-4 sm:right-0 z-20 bg-slate-900 p-4 rounded-2xl shadow-2xl shadow-slate-900/30 border border-slate-800 flex items-center gap-3 animate-[bounce_7s_ease-in-out_infinite_reverse]">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                    <ScanLine className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-slate-300">Billet VIP - <span className="font-bold text-white">Validé</span></p>
                    <p className="text-xs text-emerald-400 mt-0.5">Il y a à l&apos;instant</p>
                  </div>
                </div>

                {/* Central Phone Mockup */}
                <div className="relative z-10 w-[280px] bg-white rounded-[3rem] border-[8px] border-slate-900 p-2 shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-3xl z-30" />
                  <div className="bg-slate-50 h-[530px] rounded-[2.2rem] overflow-hidden relative border border-slate-100 flex flex-col">
                    <div className="bg-emerald-600 px-5 pt-10 pb-6 text-white text-center rounded-b-3xl shadow-sm relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-b-3xl" />
                      <p className="text-xs font-semibold text-emerald-100 uppercase tracking-widest mb-1 relative z-10">Total Revenus</p>
                      <h3 className="text-3xl font-black relative z-10">2.4M FCFA</h3>
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800 text-sm">Dernières ventes</h4>
                        <Link href="/" className="text-xs font-bold text-emerald-600">Voir tout</Link>
                      </div>
                      <div className="space-y-3">
                        {[
                          { nom: "Pass VIP", prix: "25 000 F", date: "À l'instant", color: "text-amber-600", bg: "bg-amber-100" },
                          { nom: "Pass Standard", prix: "10 000 F", date: "Il y a 2 min", color: "text-slate-600", bg: "bg-slate-200" },
                          { nom: "Pass Standard", prix: "10 000 F", date: "Il y a 5 min", color: "text-slate-600", bg: "bg-slate-200" },
                          { nom: "Pass Étudiant", prix: "5 000 F", date: "Il y a 10 min", color: "text-cyan-600", bg: "bg-cyan-100" },
                        ].map((v, i) => (
                          <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full ${v.bg} flex items-center justify-center`}>
                                <Ticket className={`w-4 h-4 ${v.color}`} />
                              </div>
                              <div>
                                <p className="text-[13px] font-bold text-slate-800">{v.nom}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{v.date}</p>
                              </div>
                            </div>
                            <span className="text-[13px] font-black text-slate-900">{v.prix}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════ STATS B2B ═══════ */}
      <section className="border-y border-slate-200/60 bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Les outils préférés des créateurs d&apos;événements</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            <div className="text-center border-r border-slate-100 last:border-0 md:border-r">
              <div className="flex justify-center mb-2"><BarChart3 className="w-6 h-6 text-emerald-500" /></div>
              <h4 className="font-extrabold text-slate-900 text-lg">Dashboard Pro</h4>
              <p className="text-xs text-slate-500 mt-1">Vos métriques en direct</p>
            </div>
            <div className="text-center md:border-r border-slate-100">
              <div className="flex justify-center mb-2"><Smartphone className="w-6 h-6 text-emerald-500" /></div>
              <h4 className="font-extrabold text-slate-900 text-lg">Scanner Mobile</h4>
              <p className="text-xs text-slate-500 mt-1">Application de contrôle intégrée</p>
            </div>
            <div className="text-center border-r border-slate-100 md:border-r">
              <div className="flex justify-center mb-2"><Shield className="w-6 h-6 text-emerald-500" /></div>
              <h4 className="font-extrabold text-slate-900 text-lg">Anti-Fraude</h4>
              <p className="text-xs text-slate-500 mt-1">QR uniques & signés</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2"><Wallet className="w-6 h-6 text-emerald-500" /></div>
              <h4 className="font-extrabold text-slate-900 text-lg">Paiements Locaux</h4>
              <p className="text-xs text-slate-500 mt-1">Mobile Money & Cartes</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ POUR LES ORGANISATEURS (BENTO GRID) ═══════ */}
      <section id="organisateur" className="py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-600 font-bold tracking-widest uppercase text-sm mb-3 block">Conçu pour performer</span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-6">
              Ne laissez plus de place<br />à l&apos;improvisation.
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              Binq met à votre disposition un arsenal complet pour organiser, vendre et analyser, sans aucune compétence technique requise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Bento 1: Grand Dashboard */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <PieChart className="w-32 h-32 text-emerald-500" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="mb-12">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                    <BarChart3 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">Suivez vos ventes en temps réel</h3>
                  <p className="text-slate-600 font-medium max-w-md leading-relaxed">
                    Un tableau de bord puissant conçu pour les organisateurs. Analysez quelles campagnes fonctionnent, surveillez vos revenus heure par heure, et exportez vos données en un clic.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Moy. Conversion</p>
                    <p className="text-lg font-black text-slate-900">+34%</p>
                  </div>
                  <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Rapports</p>
                    <p className="text-lg font-black text-slate-900">Illimités</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 2: Scanner Mobile */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl overflow-hidden relative group">
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-[40px] group-hover:bg-emerald-500/30 transition-colors" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                  <ScanLine className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black mb-3">Scanner ultra-rapide</h3>
                <p className="text-slate-300 font-medium leading-relaxed mb-8">
                  Transformez n&apos;importe quel smartphone en borne de contrôle certifiée.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                    <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center"><Zap className="w-3 h-3 text-emerald-400" /></div>
                    Moins de 1 seconde par scan
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                    <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center"><Users className="w-3 h-3 text-emerald-400" /></div>
                    Connexions multiples
                  </li>
                </ul>
              </div>
            </div>

            {/* Bento 3: Billetterie */}
            <div className="bg-emerald-600 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-800/40 to-transparent" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-3">Votre page événement en 2 min</h3>
                  <p className="text-emerald-50 font-medium leading-relaxed mb-6">
                    Créez des pages de vente élégantes, optimisées pour la conversion avec votre propre branding.
                  </p>
                </div>
                <Link href="/inscription" className="inline-flex items-center gap-2 text-sm font-bold text-white hover:gap-3 transition-all">
                  Voir un exemple <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Bento 4: Paiements */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all">
              <div className="flex flex-col md:flex-row gap-8 items-center h-full">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                    <CircleDollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">Encaissez simplement, partout</h3>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Cartes bancaires, Orange Money, Wave, MTN... Laissez vos participants payer avec l&apos;outil qu&apos;ils préfèrent. Vous concentrez-vous sur l&apos;événement, on s&apos;occupe du reste.
                  </p>
                </div>
                <div className="w-full md:w-2/5 grid grid-cols-2 gap-3">
                  {['Wave', 'Orange', 'MTN', 'Moov', 'Visa', 'Mastercard'].map((pm) => (
                    <div key={pm} className="bg-slate-50 border border-slate-100 rounded-xl py-3 text-center font-black text-slate-700 text-sm">
                      {pm}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="comment" className="py-20 bg-slate-900 text-white rounded-t-[3rem] sm:rounded-t-[4rem]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              L&apos;organisateur est roi.
            </h2>
            <p className="text-slate-400 text-lg font-medium">Un processus optimisé de la publication à la clôture.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0" />

            {[
              { step: "1", title: "Configuration", desc: "Créez votre page, définissez vos types de billets (VIP, Standard, Early Bird) et fixez vos prix.", icon: Zap },
              { step: "2", title: "Vente & Suivi", desc: "Partagez votre lien. Suivez le trafic et les achats en temps réel sur votre dashboard organisateur.", icon: BarChart3 },
              { step: "3", title: "Accueil fluide", desc: "À l'entrée, scannez les billets avec notre PWA sans délai. Évitez les files d'attente.", icon: ScanLine },
            ].map((item, i) => (
              <div key={i} className="relative pt-6 z-10 text-center">
                <div className="mx-auto w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 shadow-xl shadow-black/50 relative group">
                  <div className="absolute -inset-2 bg-emerald-500/20 rounded-[1.2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-black shadow-lg">
                    {item.step}
                  </div>
                  <item.icon className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TARIFS ═══════ */}
      <section id="tarifs" className="py-20 sm:py-32 bg-[#fafafa]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-emerald-600 font-bold tracking-widest uppercase text-sm mb-3 block">Modèle économique</span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Gratuit pour vous.<br />Toujours.
            </h2>
            <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
              Nous voulons que les organisateurs réussissent. C&apos;est pourquoi Binq ne vous facture rien. Les frais de service sont payés par l&apos;acheteur.
            </p>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200/70 p-6 sm:p-10 shadow-2xl shadow-slate-200/50 max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-bl-full -z-10" />
            
            <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Votre rentabilité</p>
                <p className="text-5xl font-black text-emerald-600">100%</p>
                <p className="text-slate-600 font-medium mt-2">Du prix du billet est pour vous.</p>
              </div>
              <div className="hidden sm:block w-px h-24 bg-slate-200" />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Exemple</p>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-slate-600 font-medium">Billet VIP</span>
                    <span className="font-bold text-slate-900">5 000 F</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-4">
                    <span className="text-slate-500">Frais (acheteur)</span>
                    <span className="text-slate-500">+ 500 F</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                    <span className="font-bold text-emerald-600">Vous recevez</span>
                    <span className="font-black text-xl text-emerald-600">5 000 F</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h4 className="font-bold text-lg">Prêt à maximiser vos gains ?</h4>
                <p className="text-slate-400 text-sm mt-1">Créez votre événement dès maintenant.</p>
              </div>
              <Link href="/inscription" className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all w-full sm:w-auto justify-center">
                Commencer
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ CTA FINAL ═══════ */}
      <section className="pb-24 pt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[3rem] p-10 sm:p-20 text-center relative overflow-hidden shadow-2xl shadow-emerald-500/20 text-white">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1]" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6">
                Passez au niveau supérieur.
              </h2>
              <p className="text-lg text-emerald-50 font-medium max-w-xl mx-auto mb-10">
                Rejoignez les organisateurs exigeants qui ont choisi Binq pour professionnaliser leurs événements.
              </p>
              <Link href="/inscription" className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-slate-900 font-extrabold rounded-2xl hover:scale-105 transition-transform text-lg shadow-xl">
                Créer mon premier événement
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-black text-xl tracking-tight text-slate-900">Binq</span>
            </div>
            <div className="flex items-center gap-8 text-sm font-medium text-slate-500">
              <a href="#fonctionnalites" className="hover:text-emerald-600 transition">Fonctionnalités</a>
              <a href="#organisateur" className="hover:text-emerald-600 transition">Organisateurs</a>
              <a href="#tarifs" className="hover:text-emerald-600 transition">Tarifs</a>
            </div>
            <p className="text-sm font-medium text-slate-400">
              &copy; {new Date().getFullYear()} Binq. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
