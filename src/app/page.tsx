"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Clock3,
  HelpCircle,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Star,
  Store,
  Truck,
  X,
} from "lucide-react";

const savingStores = [
  { name: "Marché Central", time: "25 min", initials: "MC", color: "bg-[#f2fbef] text-[#14852f]" },
  { name: "Superette Express", time: "30 min", initials: "SE", color: "bg-[#fff4d8] text-[#9a6500]" },
  { name: "Pharma Plus", time: "20 min", initials: "PP", color: "bg-[#eaf3ff] text-[#1b5d9b]" },
  { name: "Chez Awa", time: "35 min", initials: "CA", color: "bg-[#ffece4] text-[#9b3f19]" },
  { name: "Boulangerie K", time: "18 min", initials: "BK", color: "bg-[#fff0bd] text-[#8a6500]" },
  { name: "Bio Local", time: "40 min", initials: "BL", color: "bg-[#e8f7ef] text-[#177245]" },
];

const allStores = [
  { name: "Marché Central", type: "Courses", delivery: "Livraison en 25 min", pickup: "Retrait disponible", rating: "4.9", initials: "MC", color: "bg-green-50 text-green-700" },
  { name: "Superette Express", type: "Épicerie", delivery: "Livraison en 30 min", pickup: "Ouvert maintenant", rating: "4.8", initials: "SE", color: "bg-amber-50 text-amber-700" },
  { name: "Pharma Plus", type: "Pharmacie", delivery: "Livraison en 20 min", pickup: "Conseil disponible", rating: "4.7", initials: "PP", color: "bg-sky-50 text-sky-700" },
  { name: "Chez Awa", type: "Restaurant", delivery: "Livraison en 35 min", pickup: "Repas chauds", rating: "4.8", initials: "CA", color: "bg-orange-50 text-orange-700" },
  { name: "Boulangerie K", type: "Boulangerie", delivery: "Livraison en 18 min", pickup: "Pain du jour", rating: "4.6", initials: "BK", color: "bg-yellow-50 text-yellow-700" },
  { name: "Bio Local", type: "Produits frais", delivery: "Livraison en 40 min", pickup: "Fruits & légumes", rating: "4.9", initials: "BL", color: "bg-emerald-50 text-emerald-700" },
  { name: "Beauty Shop", type: "Beauté", delivery: "Livraison en 45 min", pickup: "Articles disponibles", rating: "4.5", initials: "BS", color: "bg-pink-50 text-pink-700" },
  { name: "Maison Service", type: "Essentiels", delivery: "Livraison en 50 min", pickup: "Produits maison", rating: "4.6", initials: "MS", color: "bg-violet-50 text-violet-700" },
];

const departments = [
  "Fruits et légumes",
  "Produits frais",
  "Épicerie",
  "Boissons",
  "Repas prêts",
  "Pharmacie",
  "Beauté",
  "Maison",
  "Boulangerie",
  "Produits locaux",
  "Bébé",
  "Snacks",
];

const steps = [
  {
    icon: ShoppingBasket,
    title: "Choisissez ce qu’il vous faut",
    text: "Commandez dans vos commerces locaux depuis Binq, sur le web ou dans l’app mobile.",
  },
  {
    icon: Store,
    title: "Le commerce prépare avec soin",
    text: "Le vendeur reçoit la commande, vérifie les articles et met à jour le statut en temps réel.",
  },
  {
    icon: Truck,
    title: "Recevez le jour même",
    text: "Le livreur récupère la commande et suit l’adresse GPS du client jusqu’à la livraison.",
  },
];

const faqs = [
  "Comment fonctionne la livraison Binq ?",
  "Combien coûte la livraison ?",
  "Puis-je suivre mon livreur en temps réel ?",
  "Que se passe-t-il si un produit est indisponible ?",
  "Comment devenir commerçant ou livreur ?",
];

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white text-[#111811]">
      <div className="bg-[#14852f] px-4 py-2 text-center text-xs font-black text-white sm:text-sm">
        Livraison locale rapide · Commerces, restaurants, pharmacies et boutiques sur Binq
      </div>

      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14852f] text-white">
              <ShoppingBasket className="h-5 w-5" />
            </span>
            <span className="text-2xl font-black tracking-[-0.05em] text-[#14852f]">Binq</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-bold text-neutral-700 lg:flex">
            <a href="#stores-save" className="hover:text-[#14852f]">Commerces</a>
            <a href="#departments" className="hover:text-[#14852f]">Rayons</a>
            <a href="#how" className="hover:text-[#14852f]">Livraison</a>
            <a href="#partners" className="hover:text-[#14852f]">Partenaires</a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/connexion" className="rounded-lg px-4 py-2 text-sm font-black hover:bg-neutral-100">
              Connexion
            </Link>
            <Link href="/inscription" className="rounded-lg bg-[#14852f] px-5 py-2.5 text-sm font-black text-white hover:bg-[#0f7027]">
              S’inscrire
            </Link>
          </div>

          <button
            aria-label="Ouvrir le menu"
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-xl p-2 hover:bg-neutral-100 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-black/10 bg-white px-4 py-3 lg:hidden">
            <div className="grid gap-1">
              {[
                ["Commerces", "#stores-save"],
                ["Rayons", "#departments"],
                ["Livraison", "#how"],
                ["Partenaires", "#partners"],
              ].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm font-bold hover:bg-neutral-50">
                  {label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href="/connexion" className="rounded-xl bg-neutral-100 px-4 py-3 text-center text-sm font-black">Connexion</Link>
                <Link href="/inscription" className="rounded-xl bg-[#14852f] px-4 py-3 text-center text-sm font-black text-white">S’inscrire</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <section className="bg-[#f7f5ed] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mx-auto max-w-4xl text-[2.65rem] font-black leading-[0.98] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
            Commandez vos courses en livraison aujourd’hui
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-neutral-700 sm:mt-5 sm:text-lg">
            Les commerces proches de vous, réunis sur Binq. Ajoutez vos articles, payez en sécurité et suivez votre livreur.
          </p>

          <div className="mx-auto mt-7 max-w-2xl rounded-2xl bg-white p-2 shadow-xl shadow-black/5 ring-1 ring-black/10 sm:rounded-3xl sm:p-2.5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-14 flex-1 items-center gap-3 rounded-xl bg-[#f7f7f2] px-4 ring-1 ring-black/5 sm:rounded-2xl">
                <MapPin className="h-5 w-5 shrink-0 text-[#14852f]" />
                <input
                  aria-label="Adresse de livraison"
                  placeholder="Entrez votre adresse"
                  className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-neutral-400 sm:text-base"
                />
              </label>
              <Link href="/explorer" className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#14852f] px-6 text-sm font-black text-white hover:bg-[#0f7027] sm:rounded-2xl">
                Trouver les commerces <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-black text-neutral-600 sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 ring-1 ring-black/10"><Clock3 className="h-4 w-4 text-[#14852f]" /> Livraison dès 15 min</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 ring-1 ring-black/10"><ShieldCheck className="h-4 w-4 text-[#14852f]" /> Paiement sécurisé</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 ring-1 ring-black/10"><Truck className="h-4 w-4 text-[#14852f]" /> Suivi GPS</span>
          </div>
        </div>
      </section>

      <section id="stores-save" className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">Commerces pour économiser</h2>
              <p className="mt-1 text-sm font-semibold text-neutral-500">Délais estimés selon votre zone.</p>
            </div>
            <Link href="/explorer" className="hidden text-sm font-black text-[#14852f] sm:inline-flex">Voir tout</Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {savingStores.map((store) => (
              <Link key={store.name} href="/explorer" className="rounded-2xl border border-black/10 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black ${store.color}`}>
                  {store.initials}
                </div>
                <h3 className="mt-3 line-clamp-2 min-h-[40px] text-sm font-black leading-5">{store.name}</h3>
                <p className="mt-1 text-xs font-bold text-neutral-500">{store.time}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="all-stores" className="border-y border-black/10 bg-[#fbfaf5] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">Tous les commerces près de vous</h2>
              <p className="mt-1 text-sm font-semibold text-neutral-500">Courses, repas, pharmacie, beauté et essentiels.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['Tous', 'Courses', 'Restaurants', 'Pharmacie', 'Boutiques'].map((filter) => (
                <button key={filter} className="shrink-0 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-black text-neutral-700 shadow-sm first:bg-[#14852f] first:text-white">
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {allStores.map((store) => (
              <Link key={store.name} href="/explorer" className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex gap-3">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black ${store.color}`}>
                    {store.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate font-black">{store.name}</h3>
                      <span className="inline-flex items-center gap-1 text-xs font-black text-neutral-600"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> {store.rating}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-neutral-500">{store.type}</p>
                    <p className="mt-2 text-sm font-black text-[#14852f]">{store.delivery}</p>
                    <p className="mt-1 text-xs font-semibold text-neutral-400">{store.pickup}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-black tracking-[-0.05em] sm:text-5xl">Livraison locale fiable</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base font-semibold leading-7 text-neutral-600">
            Une expérience claire pour le client, le commerçant et le livreur.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title} className="rounded-3xl border border-black/10 bg-white p-6 text-left shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2fbef] text-[#14852f]">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-black tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f5ed] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-black tracking-[-0.05em] sm:text-5xl">Une marketplace locale pour grandir</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['1 000+', 'produits'],
              ['120+', 'commerces'],
              ['3', 'applications'],
              ['10%', 'commission Binq'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/10">
                <p className="text-2xl font-black text-[#14852f] sm:text-3xl">{value}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-neutral-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="departments" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">Rayons populaires</h2>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {departments.map((department) => (
              <Link key={department} href="/explorer" className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-bold shadow-sm transition hover:border-[#14852f] hover:text-[#14852f]">
                {department}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="partners" className="border-y border-black/10 bg-[#111811] px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.05em] sm:text-5xl">Gagnez avec Binq</h2>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-white/65">
              Les commerçants vendent en ligne. Les livreurs suivent les adresses clients. Binq automatise les commandes, wallets et commissions.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/inscription" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#111811]">
                Devenir commerçant <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/livraisons" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">
                Devenir livreur
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Store, label: 'Boutiques' },
              { icon: Truck, label: 'Livreurs' },
              { icon: BriefcaseBusiness, label: 'Wallets' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <item.icon className="h-6 w-6 text-green-300" />
                <p className="mt-4 font-black">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-white/55">Espace dédié et suivi clair.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-black tracking-[-0.05em] sm:text-5xl">Questions fréquentes</h2>
          <div className="mt-8 divide-y divide-black/10 rounded-2xl border border-black/10 bg-white">
            {faqs.map((faq) => (
              <button key={faq} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-black sm:text-base">
                <span className="inline-flex items-center gap-3"><HelpCircle className="h-5 w-5 shrink-0 text-[#14852f]" /> {faq}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f5ed] px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <CheckCircle2 className="mx-auto h-10 w-10 text-[#14852f]" />
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Prêt à commander ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-base font-semibold leading-7 text-neutral-600">
            Entrez votre adresse et trouvez les commerces qui livrent près de vous.
          </p>
          <Link href="/explorer" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#14852f] px-6 py-4 text-sm font-black text-white">
            Commencer <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14852f] text-white">
                <ShoppingBasket className="h-5 w-5" />
              </span>
              <span className="text-2xl font-black tracking-[-0.05em] text-[#14852f]">Binq</span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-neutral-500">Marketplace locale pour commander, vendre et livrer.</p>
          </div>
          {[
            ['Binq', ['Commander', 'Commerces', 'Rayons']],
            ['Partenaires', ['Commerçant', 'Livreur', 'Wallet']],
            ['Aide', ['Support', 'Confidentialité', 'Conditions']],
          ].map(([title, links]) => (
            <div key={title as string}>
              <h3 className="font-black">{title as string}</h3>
              <ul className="mt-3 space-y-2 text-sm font-semibold text-neutral-500">
                {(links as string[]).map((link) => (
                  <li key={link}><a href="#" className="hover:text-[#14852f]">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-black/10 pt-6 text-xs font-bold text-neutral-400">
          © {new Date().getFullYear()} Binq. Tous droits réservés.
        </div>
      </footer>
    </main>
  );
}
