"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  HelpCircle,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Truck,
  X,
} from "lucide-react";

const commerceTypes = [
  {
    title: "Courses du quotidien",
    text: "Produits frais, épicerie, boissons et essentiels.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85",
  },
  {
    title: "Repas et restaurants",
    text: "Plats préparés, snacks, boissons et menus locaux.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=85",
  },
  {
    title: "Pharmacies et santé",
    text: "Produits de santé, bien-être et articles essentiels.",
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1000&q=85",
  },
  {
    title: "Boutiques locales",
    text: "Mode, beauté, maison et produits de proximité.",
    image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1000&q=85",
  },
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
            <a href="#commerces" className="hover:text-[#14852f]">Commerces</a>
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
                ["Commerces", "#commerces"],
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

      <section id="commerces" className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">Commandez dans les commerces de proximité</h2>
              <p className="mt-1 max-w-2xl text-sm font-semibold text-neutral-500">La page doit présenter des types de commerces avec des images réelles, sans afficher de partenaires tant qu’ils ne sont pas signés.</p>
            </div>
            <Link href="/explorer" className="inline-flex text-sm font-black text-[#14852f]">Explorer</Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {commerceTypes.map((commerce) => (
              <Link key={commerce.title} href="/explorer" className="group overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
                <img src={commerce.image} alt={commerce.title} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="p-5">
                  <h3 className="text-lg font-black tracking-tight">{commerce.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">{commerce.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-[#fbfaf5] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-4xl">Une expérience visuelle centrée sur les usages</h2>
            <p className="mt-3 text-base font-semibold leading-7 text-neutral-600">
              Avant d’afficher de vrais commerçants, Binq met en avant les parcours : choisir des produits, confirmer l’adresse, payer et suivre la livraison.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { icon: ShoppingBasket, title: "Panier clair", text: "Articles, total et frais visibles avant paiement." },
                { icon: MapPin, title: "Adresse précise", text: "Localisation GPS nécessaire pour le livreur." },
                { icon: Truck, title: "Suivi livraison", text: "Statut de commande simple pour le client." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/10">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f2fbef] text-[#14852f]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black">{item.title}</h3>
                    <p className="mt-1 text-sm font-semibold leading-5 text-neutral-500">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/10">
              <img src="https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=900&q=85" alt="Panier de produits frais" className="aspect-[4/5] w-full object-cover" />
            </div>
            <div className="grid gap-4">
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/10">
                <img src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=900&q=85" alt="Livraison locale" className="aspect-[4/3] w-full object-cover" />
              </div>
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/10">
                <img src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=900&q=85" alt="Rayons de commerce local" className="aspect-[4/3] w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="departments" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">Rayons populaires</h2>
              <p className="mt-1 text-sm font-semibold text-neutral-500">Des rayons génériques, sans faux noms de partenaires.</p>
            </div>
            <Link href="/explorer" className="text-sm font-black text-[#14852f]">Voir tout</Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {departments.map((department) => (
              <Link key={department} href="/explorer" className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-bold shadow-sm transition hover:border-[#14852f] hover:text-[#14852f]">
                {department}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-black/10 bg-[#fbfaf5] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
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

      <section id="partners" className="border-y border-black/10 bg-[#111811] px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.05em] sm:text-5xl">Gagnez avec Binq</h2>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-white/65">
              Les commerçants vendent en ligne. Les livreurs suivent les adresses clients. Binq organise les commandes, les paiements et la livraison.
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
              { icon: ShieldCheck, label: 'Paiements' },
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
