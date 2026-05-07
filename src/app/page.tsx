"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Menu,
  Navigation,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
  X,
} from "lucide-react";

const departments = [
  {
    title: "Fruits & légumes",
    image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=900&q=85",
    href: "/explorer",
  },
  {
    title: "Épicerie",
    image: "https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=900&q=85",
    href: "/explorer",
  },
  {
    title: "Repas prêts",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85",
    href: "/explorer",
  },
  {
    title: "Pharmacie",
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=85",
    href: "/explorer",
  },
];

const nearbyStores = [
  {
    name: "Supermarché Central",
    meta: "Courses · 1,2 km",
    time: "25-35 min",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1000&q=85",
  },
  {
    name: "Marché Frais du Quartier",
    meta: "Produits frais · 800 m",
    time: "20-30 min",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1000&q=85",
  },
  {
    name: "Restaurant Chez Awa",
    meta: "Cuisine locale · 2,1 km",
    time: "30-40 min",
    rating: "4.7",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=85",
  },
];

const shopperSteps = [
  "Votre commande est acceptée par le commerce",
  "Les articles sont préparés et vérifiés",
  "Le livreur récupère votre commande",
  "Livraison suivie jusqu’à votre adresse",
];

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#fbfaf5] text-[#111811]">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#fbfaf5]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#178a2f] text-white shadow-sm">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="text-2xl font-black tracking-[-0.04em]">Binq</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold text-neutral-700 lg:flex">
            <a href="#rayons" className="hover:text-[#178a2f]">Rayons</a>
            <a href="#commerces" className="hover:text-[#178a2f]">Commerces</a>
            <a href="#experience" className="hover:text-[#178a2f]">Expérience</a>
            <a href="#partenaires" className="hover:text-[#178a2f]">Partenaires</a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/connexion" className="rounded-full px-5 py-3 text-sm font-black text-neutral-800 hover:bg-black/5">
              Connexion
            </Link>
            <Link href="/inscription" className="rounded-full bg-[#178a2f] px-6 py-3 text-sm font-black text-white shadow-lg shadow-green-900/15 hover:bg-[#0f7224]">
              S’inscrire
            </Link>
          </div>

          <button
            aria-label="Ouvrir le menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-full p-3 hover:bg-black/5 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="mx-4 mb-4 rounded-3xl border border-black/10 bg-white p-3 shadow-xl lg:hidden">
            {[
              ["Rayons", "#rayons"],
              ["Commerces", "#commerces"],
              ["Expérience", "#experience"],
              ["Partenaires", "#partenaires"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-bold hover:bg-neutral-50">
                {label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link href="/connexion" className="rounded-2xl bg-neutral-100 px-4 py-3 text-center text-sm font-black">Connexion</Link>
              <Link href="/inscription" className="rounded-2xl bg-[#178a2f] px-4 py-3 text-center text-sm font-black text-white">Compte</Link>
            </div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden border-b border-black/10 bg-[#fbfaf5]">
        <div className="absolute inset-x-0 top-0 h-64 bg-[#e9f4df] lg:inset-y-0 lg:left-auto lg:h-auto lg:w-[42%]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:min-h-[760px] lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-900/15 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#178a2f] shadow-sm">
              <MapPin className="h-4 w-4" /> Livraison locale le jour même
            </div>
            <h1 className="text-5xl font-black leading-[0.92] tracking-[-0.075em] text-[#101810] sm:text-7xl lg:text-[5.8rem]">
              Faites vos courses sans perdre votre journée.
            </h1>
            <p className="mt-7 max-w-xl text-lg font-semibold leading-8 text-neutral-700">
              Commandez chez les commerces proches de vous, payez en ligne et suivez votre livreur en temps réel. Binq rassemble clients, commerçants et livreurs dans une seule expérience simple.
            </p>

            <div className="mt-9 rounded-[2rem] border border-black/10 bg-white p-2 shadow-2xl shadow-green-950/10">
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex flex-1 items-center gap-3 rounded-[1.55rem] bg-neutral-50 px-5 py-4 ring-1 ring-black/5">
                  <Search className="h-5 w-5 text-neutral-400" />
                  <input
                    aria-label="Adresse de livraison"
                    placeholder="Votre adresse de livraison"
                    className="w-full bg-transparent text-base font-bold outline-none placeholder:text-neutral-400"
                  />
                </label>
                <Link href="/explorer" className="inline-flex items-center justify-center gap-2 rounded-[1.55rem] bg-[#178a2f] px-7 py-4 text-sm font-black text-white hover:bg-[#0f7224]">
                  Trouver des commerces <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-7 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["+120", "commerces"],
                ["15-45", "minutes"],
                ["4.8/5", "note moyenne"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                  <p className="text-2xl font-black tracking-tight text-[#178a2f]">{value}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-black/10 bg-white p-3 shadow-2xl shadow-green-950/15 sm:p-4 lg:rounded-[2.75rem]">
            <div className="overflow-hidden rounded-[1.75rem] lg:rounded-[2.25rem]">
              <div className="relative aspect-[4/3] min-h-[320px] lg:aspect-[16/11]">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=90"
                  alt="Rayon de produits frais dans un commerce local"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] bg-white/95 p-4 shadow-xl backdrop-blur sm:inset-x-6 sm:bottom-6 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-[#178a2f]">Commande en cours</p>
                      <p className="mt-1 text-lg font-black text-[#111811] sm:text-xl">Supermarché Central prépare votre panier</p>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-[#e9f4df] px-4 py-3 text-[#178a2f]">
                      <Truck className="h-5 w-5" />
                      <span className="text-sm font-black">18 min</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black text-neutral-600">
                    <div className="rounded-xl bg-neutral-50 px-2 py-2">9 articles</div>
                    <div className="rounded-xl bg-neutral-50 px-2 py-2">Payé</div>
                    <div className="rounded-xl bg-neutral-50 px-2 py-2">Suivi GPS</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3 sm:mt-4">
              {[
                {
                  label: "Commerce",
                  image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=500&q=85",
                },
                {
                  label: "Préparation",
                  image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=500&q=85",
                },
                {
                  label: "Livraison",
                  image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=500&q=85",
                },
              ].map((item) => (
                <div key={item.label} className="overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/5">
                  <img src={item.image} alt={item.label} className="aspect-[4/3] w-full object-cover" />
                  <p className="bg-white px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-neutral-600 sm:text-xs">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="rayons" className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#178a2f]">Rayons populaires</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.055em] sm:text-6xl">Tout ce dont vous avez besoin, livré depuis votre quartier.</h2>
            </div>
            <Link href="/explorer" className="inline-flex items-center gap-2 text-sm font-black text-[#178a2f]">
              Tout explorer <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {departments.map((department) => (
              <Link key={department.title} href={department.href} className="group overflow-hidden rounded-[1.75rem] bg-neutral-100 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-950/10">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={department.image} alt={department.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <div className="flex items-center justify-between bg-white p-5">
                  <h3 className="text-lg font-black tracking-tight">{department.title}</h3>
                  <ArrowRight className="h-5 w-5 text-[#178a2f]" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="commerces" className="bg-[#f4f1e8] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#178a2f]">Commerces proches</p>
            <h2 className="mx-auto mt-3 max-w-4xl text-4xl font-black tracking-[-0.055em] sm:text-6xl">Une vitrine moderne pour les vendeurs locaux.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-neutral-600">
              Les clients voient les délais, les notes, les produits disponibles et peuvent commander sans appeler ni se déplacer.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {nearbyStores.map((store) => (
              <Link key={store.name} href="/explorer" className="group overflow-hidden rounded-[2.2rem] border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-950/10">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={store.image} alt={store.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#178a2f] shadow">Ouvert</div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">{store.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-neutral-500">{store.meta}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f1e8] px-3 py-1.5 text-sm font-black">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {store.rating}
                    </span>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-5 text-sm font-black">
                    <span className="inline-flex items-center gap-2 text-neutral-500"><Clock3 className="h-4 w-4" /> {store.time}</span>
                    <span className="inline-flex items-center gap-2 text-[#178a2f]">Commander <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="experience" className="bg-white py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
          <div className="overflow-hidden rounded-[2.25rem] shadow-2xl shadow-green-950/10 lg:rounded-[2.5rem]">
            <img
              src="https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1300&q=90"
              alt="Livraison de sacs de courses"
              className="aspect-[4/3] w-full object-cover lg:aspect-[5/6]"
            />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#178a2f]">Expérience complète</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-6xl">Chaque commande reste visible du début à la fin.</h2>
            <p className="mt-5 text-base font-semibold leading-8 text-neutral-600">
              Binq doit fonctionner comme une vraie plateforme opérationnelle : commande confirmée, préparation en boutique, assignation livreur, suivi GPS et wallet pour les revenus.
            </p>

            <div className="mt-8 space-y-4">
              {shopperSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-[1.6rem] border border-black/10 bg-[#fbfaf5] p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#178a2f] text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <p className="font-black text-neutral-800">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-[1.7rem] border border-black/10 bg-white p-5 shadow-sm">
                <Navigation className="mb-4 h-6 w-6 text-[#178a2f]" />
                <p className="font-black">Adresse GPS Mapbox</p>
                <p className="mt-1 text-sm font-semibold text-neutral-500">Position client précise pour le livreur.</p>
              </div>
              <div className="rounded-[1.7rem] border border-black/10 bg-white p-5 shadow-sm">
                <ShieldCheck className="mb-4 h-6 w-6 text-[#178a2f]" />
                <p className="font-black">Paiement sécurisé</p>
                <p className="mt-1 text-sm font-semibold text-neutral-500">Commande et settlement automatisés.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="partenaires" className="bg-[#111811] py-16 text-white sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-green-300">Commerçants & livreurs</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-6xl">Une activité locale plus rentable et mieux organisée.</h2>
            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-white/65">
              Les commerçants reçoivent des commandes propres à préparer. Les livreurs voient les livraisons assignées avec l’adresse client. Binq garde sa commission et redistribue les wallets.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/inscription" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-[#111811] hover:bg-green-50">
                Inscrire mon commerce <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/livraisons" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white hover:bg-white/15">
                Devenir livreur
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Store, title: "Boutique digitale", text: "Catalogue, produits, prix et photos réalistes." },
              { icon: CheckCircle2, title: "Commandes organisées", text: "Statuts simples pour préparer sans erreur." },
              { icon: Truck, title: "Livraison assignée", text: "Un livreur suit la position client." },
              { icon: ShieldCheck, title: "Wallet & commission", text: "Revenus commerçant, gains livreur et frais Binq." },
            ].map((item) => (
              <div key={item.title} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#178a2f] text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/60">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf5] py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#178a2f]">Binq commerce local</p>
          <h2 className="mx-auto mt-3 max-w-4xl text-4xl font-black tracking-[-0.055em] sm:text-6xl">Une page d’accueil plus réaliste, plus claire, plus commerce.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-8 text-neutral-600">
            L’expérience met en avant de vraies photos, des commerces réels, la livraison et les trois rôles essentiels : client, commerçant et livreur.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/explorer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#178a2f] px-8 py-4 text-sm font-black text-white hover:bg-[#0f7224]">
              Commander maintenant <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/inscription" className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-8 py-4 text-sm font-black hover:bg-neutral-50">
              Rejoindre Binq
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <div>
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#178a2f] text-white">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <span className="text-xl font-black tracking-tight">Binq</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-neutral-500">Courses, commerces locaux et livraison suivie.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-sm font-bold text-neutral-500">
            <Link href="/explorer" className="hover:text-[#178a2f]">Commander</Link>
            <Link href="/connexion" className="hover:text-[#178a2f]">Connexion</Link>
            <Link href="/inscription" className="hover:text-[#178a2f]">Partenaires</Link>
          </div>
          <p className="text-xs font-bold text-neutral-400">© {new Date().getFullYear()} Binq. Tous droits réservés.</p>
        </div>
      </footer>
    </main>
  );
}
