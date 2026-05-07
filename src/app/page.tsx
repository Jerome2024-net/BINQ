"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Truck,
  X,
} from "lucide-react";

const categories = [
  {
    title: "Courses",
    subtitle: "Supermarchés et marchés",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Restaurants",
    subtitle: "Repas prêts à livrer",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Pharmacie",
    subtitle: "Santé et essentiels",
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Boutiques",
    subtitle: "Produits locaux",
    image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=900&q=85",
  },
];

const stores = [
  {
    name: "Marché Central",
    type: "Courses · 1,2 km",
    time: "25-35 min",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Superette Express",
    type: "Épicerie · 900 m",
    time: "20-30 min",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Chez Awa",
    type: "Restaurant · 2,1 km",
    time: "30-40 min",
    rating: "4.7",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85",
  },
];

const steps = [
  {
    title: "Choisissez votre commerce",
    text: "Entrez votre adresse et découvrez les boutiques disponibles autour de vous.",
  },
  {
    title: "Remplissez votre panier",
    text: "Ajoutez vos produits, vérifiez les frais et payez en ligne en sécurité.",
  },
  {
    title: "Suivez la livraison",
    text: "Le commerçant prépare, le livreur récupère et vous suivez l’arrivée.",
  },
];

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#f8f6ef] text-[#111811]">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#14852f] text-white shadow-sm lg:h-10 lg:w-10">
              <ShoppingBag className="h-4.5 w-4.5 lg:h-5 lg:w-5" />
            </span>
            <span className="text-xl font-black tracking-[-0.04em] lg:text-2xl">Binq</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold text-neutral-700 lg:flex">
            <a href="#categories" className="transition hover:text-[#14852f]">Catégories</a>
            <a href="#commerces" className="transition hover:text-[#14852f]">Commerces</a>
            <a href="#fonctionnement" className="transition hover:text-[#14852f]">Comment ça marche</a>
            <a href="#partenaires" className="transition hover:text-[#14852f]">Partenaires</a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/connexion" className="rounded-full px-5 py-2.5 text-sm font-black hover:bg-neutral-100">
              Connexion
            </Link>
            <Link href="/inscription" className="rounded-full bg-[#14852f] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-[#0d6f25]">
              S’inscrire
            </Link>
          </div>

          <button
            aria-label="Menu"
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-full p-2.5 hover:bg-neutral-100 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="mx-4 mb-4 rounded-3xl border border-black/10 bg-white p-2 shadow-xl lg:hidden">
            {[
              ["Catégories", "#categories"],
              ["Commerces", "#commerces"],
              ["Comment ça marche", "#fonctionnement"],
              ["Partenaires", "#partenaires"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-bold hover:bg-neutral-50">
                {label}
              </a>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href="/connexion" className="rounded-2xl bg-neutral-100 px-4 py-3 text-center text-sm font-black">Connexion</Link>
              <Link href="/inscription" className="rounded-2xl bg-[#14852f] px-4 py-3 text-center text-sm font-black text-white">Compte</Link>
            </div>
          </div>
        )}
      </header>

      <section className="bg-[#e7f2dc]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-16">
          <div className="text-center lg:text-left">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#14852f] shadow-sm lg:mx-0">
              <MapPin className="h-3.5 w-3.5" /> Livraison locale
            </div>
            <h1 className="mx-auto max-w-3xl text-[2.75rem] font-black leading-[0.96] tracking-[-0.07em] sm:text-6xl lg:mx-0 lg:text-7xl xl:text-[5.35rem]">
              Vos courses livrées simplement.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-neutral-700 sm:text-lg lg:mx-0 lg:mt-6 lg:leading-8">
              Commandez chez les commerces proches, payez en ligne et suivez le livreur jusqu’à votre porte.
            </p>

            <div className="mx-auto mt-6 max-w-xl rounded-[1.75rem] bg-white p-2 shadow-xl shadow-green-950/10 lg:mx-0 lg:mt-8">
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex min-h-14 flex-1 items-center gap-3 rounded-[1.35rem] bg-[#f7f7f2] px-4 ring-1 ring-black/5">
                  <Search className="h-5 w-5 shrink-0 text-neutral-400" />
                  <input
                    aria-label="Adresse de livraison"
                    placeholder="Entrez votre adresse"
                    className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-neutral-400 sm:text-base"
                  />
                </label>
                <Link href="/explorer" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[1.35rem] bg-[#14852f] px-5 text-sm font-black text-white transition hover:bg-[#0d6f25]">
                  Explorer <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mx-auto mt-5 grid max-w-xl grid-cols-1 gap-2 text-left sm:grid-cols-3 lg:mx-0">
              {[
                ["15-45 min", "livraison estimée"],
                ["Paiement", "sécurisé"],
                ["GPS", "suivi livreur"],
              ].map(([value, label]) => (
                <div key={value} className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
                  <p className="text-base font-black text-[#14852f]">{value}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-2xl lg:max-w-none">
            <div className="overflow-hidden rounded-[2rem] bg-white p-2 shadow-2xl shadow-green-950/15 sm:rounded-[2.5rem] sm:p-3">
              <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=90"
                  alt="Produits frais disponibles à la commande"
                  className="aspect-[4/3] w-full object-cover sm:aspect-[16/11]"
                />
                <div className="absolute inset-x-3 bottom-3 rounded-[1.25rem] bg-white/95 p-3 shadow-lg backdrop-blur sm:inset-x-5 sm:bottom-5 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-[#14852f]">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#111811] sm:text-base">Commande en préparation</p>
                      <p className="text-xs font-bold text-neutral-500 sm:text-sm">Arrivée estimée dans 18 minutes</p>
                    </div>
                    <span className="hidden rounded-full bg-[#14852f] px-3 py-1 text-xs font-black text-white sm:inline-flex">Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#14852f]">Catégories</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Ce que vous pouvez commander</h2>
            </div>
            <Link href="/explorer" className="inline-flex items-center gap-2 text-sm font-black text-[#14852f]">
              Voir tout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link key={category.title} href="/explorer" className="group overflow-hidden rounded-[1.7rem] bg-white shadow-sm ring-1 ring-black/10 transition hover:-translate-y-1 hover:shadow-xl">
                <img src={category.image} alt={category.title} className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="p-4">
                  <h3 className="text-lg font-black tracking-tight">{category.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-neutral-500">{category.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="commerces" className="bg-[#f8f6ef] py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#14852f]">Commerces proches</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Des commerces locaux prêts à livrer</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-neutral-600 sm:text-base">
              Une présentation claire, des délais visibles et une commande suivie du paiement à la livraison.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {stores.map((store) => (
              <Link key={store.name} href="/explorer" className="group overflow-hidden rounded-[1.8rem] bg-white shadow-sm ring-1 ring-black/10 transition hover:-translate-y-1 hover:shadow-xl">
                <img src={store.image} alt={store.name} className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black tracking-tight">{store.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-neutral-500">{store.type}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f8f6ef] px-2.5 py-1 text-xs font-black">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> {store.rating}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4 text-sm font-black">
                    <span className="inline-flex items-center gap-1.5 text-neutral-500"><Clock3 className="h-4 w-4" /> {store.time}</span>
                    <span className="text-[#14852f]">Commander</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="fonctionnement" className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="order-2 lg:order-1">
            <img
              src="https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1400&q=90"
              alt="Sacs de livraison prêts à partir"
              className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-xl shadow-green-950/10"
            />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#14852f]">Fonctionnement</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Une commande claire pour le client, le commerçant et le livreur.</h2>
            <p className="mt-4 text-base font-semibold leading-7 text-neutral-600">
              Binq doit rester simple : adresse, panier, paiement, préparation, livraison suivie et wallet.
            </p>

            <div className="mt-6 space-y-3">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-[1.5rem] bg-[#f8f6ef] p-4 ring-1 ring-black/5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#14852f] text-sm font-black text-white">{index + 1}</span>
                  <div>
                    <h3 className="font-black">{step.title}</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-neutral-500">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="partenaires" className="bg-[#111811] py-12 text-white sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-300">Partenaires</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Commerçants et livreurs ont chacun leur espace.</h2>
              <p className="mt-4 text-base font-semibold leading-7 text-white/65">
                Les commerçants gèrent les commandes et les produits. Les livreurs suivent les adresses clients et valident les livraisons.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/inscription" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#111811]">
                  Devenir commerçant <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/livraisons" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white">
                  Devenir livreur
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Store, title: "Boutique", text: "Produits et commandes." },
                { icon: Truck, title: "Livraison", text: "Suivi GPS client." },
                { icon: ShieldCheck, title: "Wallet", text: "Gains et commission." },
              ].map((item) => (
                <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
                  <item.icon className="h-6 w-6 text-green-300" />
                  <h3 className="mt-4 font-black">{item.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-white/55">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#e7f2dc] py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <CheckCircle2 className="mx-auto h-10 w-10 text-[#14852f]" />
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Prêt à commander localement ?</h2>
          <p className="mt-3 text-base font-semibold leading-7 text-neutral-700">
            Trouvez les commerces proches de vous et recevez vos produits sans perdre de temps.
          </p>
          <Link href="/explorer" className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#14852f] px-7 py-4 text-sm font-black text-white shadow-lg shadow-green-900/15">
            Commencer <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <div>
            <div className="flex items-center justify-center gap-2.5 md:justify-start">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#14852f] text-white">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <span className="text-lg font-black tracking-tight">Binq</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-neutral-500">Courses, commerces locaux et livraison suivie.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-bold text-neutral-500">
            <Link href="/explorer" className="hover:text-[#14852f]">Commander</Link>
            <Link href="/connexion" className="hover:text-[#14852f]">Connexion</Link>
            <Link href="/inscription" className="hover:text-[#14852f]">Partenaires</Link>
          </div>
          <p className="text-xs font-bold text-neutral-400">© {new Date().getFullYear()} Binq.</p>
        </div>
      </footer>
    </main>
  );
}
