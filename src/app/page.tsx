"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock,
  MapPin,
  Menu,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Star,
  Store,
  Truck,
  X,
} from "lucide-react";

const categories = [
  { label: "Courses", emoji: "🥑", color: "bg-emerald-50" },
  { label: "Restaurants", emoji: "🍔", color: "bg-orange-50" },
  { label: "Pharmacie", emoji: "💊", color: "bg-sky-50" },
  { label: "Boulangerie", emoji: "🥖", color: "bg-amber-50" },
  { label: "Beauté", emoji: "✨", color: "bg-pink-50" },
  { label: "Boutiques", emoji: "🛍️", color: "bg-violet-50" },
];

const stores = [
  {
    name: "Marché Frais",
    type: "Supermarché",
    time: "25-35 min",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Chez Awa",
    type: "Restaurant africain",
    time: "20-30 min",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Pharma Express",
    type: "Pharmacie",
    time: "15-25 min",
    rating: "4.7",
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=80",
  },
];

const products = [
  { name: "Avocats frais", price: "1 500 FCFA", image: "🥑" },
  { name: "Pain du jour", price: "500 FCFA", image: "🥖" },
  { name: "Pack eau", price: "2 000 FCFA", image: "💧" },
  { name: "Poulet braisé", price: "4 500 FCFA", image: "🍗" },
];

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7f2] text-[#172017]">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0aad0a] text-white shadow-lg shadow-green-700/20">
              <ShoppingBasket className="h-5 w-5" />
            </div>
            <span className="text-xl font-black tracking-tight">Binq</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-bold text-neutral-700 md:flex">
            <a href="#courses" className="hover:text-[#0aad0a]">Courses</a>
            <a href="#commerces" className="hover:text-[#0aad0a]">Commerces</a>
            <a href="#livraison" className="hover:text-[#0aad0a]">Livraison</a>
            <a href="#partenaires" className="hover:text-[#0aad0a]">Partenaires</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/connexion" className="rounded-full px-4 py-2 text-sm font-bold text-neutral-800 hover:bg-neutral-100">
              Connexion
            </Link>
            <Link href="/inscription" className="rounded-full bg-[#0aad0a] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-green-700/20 hover:bg-[#079707]">
              Créer un compte
            </Link>
          </div>

          <button
            aria-label="Menu mobile"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-full p-2 text-neutral-800 hover:bg-neutral-100 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="mx-4 mb-4 rounded-3xl border border-black/5 bg-white p-3 shadow-2xl md:hidden">
            {[
              { href: "#courses", label: "Courses" },
              { href: "#commerces", label: "Commerces" },
              { href: "#livraison", label: "Livraison" },
              { href: "#partenaires", label: "Partenaires" },
            ].map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-bold text-neutral-700 hover:bg-neutral-50">
                {item.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link href="/connexion" className="rounded-2xl bg-neutral-100 px-4 py-3 text-center text-sm font-bold">Connexion</Link>
              <Link href="/inscription" className="rounded-2xl bg-[#0aad0a] px-4 py-3 text-center text-sm font-black text-white">Compte</Link>
            </div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden bg-[#fff36d]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(255,255,255,0.7),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(10,173,10,0.28),transparent_28%)]" />
        <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-20">
          <div className="pt-6 text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#087b08] shadow-sm">
              <Sparkles className="h-4 w-4" /> Courses et livraison locale
            </div>
            <h1 className="mx-auto max-w-4xl text-[3.4rem] font-black leading-[0.88] tracking-[-0.075em] text-[#172017] sm:text-7xl lg:mx-0 lg:text-[5.6rem]">
              Vos courses livrées le jour même.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#3d493d] lg:mx-0">
              Faites vos achats chez les supermarchés, restaurants, pharmacies et boutiques proches de vous. Binq connecte clients, commerçants et livreurs en temps réel.
            </p>

            <div className="mx-auto mt-8 max-w-2xl rounded-[2rem] bg-white p-2.5 shadow-2xl shadow-green-950/10 lg:mx-0">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-[1.45rem] bg-[#f6f7f2] px-5 py-4 text-left ring-1 ring-black/5">
                  <MapPin className="h-5 w-5 shrink-0 text-[#0aad0a]" />
                  <input
                    aria-label="Adresse de livraison"
                    placeholder="Entrez votre adresse"
                    className="w-full bg-transparent text-base font-bold text-neutral-900 outline-none placeholder:text-neutral-400"
                  />
                </div>
                <Link href="/explorer" className="inline-flex items-center justify-center gap-2 rounded-[1.45rem] bg-[#0aad0a] px-7 py-4 text-sm font-black text-white transition hover:bg-[#079707] active:scale-[0.98]">
                  Voir les commerces <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-bold text-[#445044] lg:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2"><Clock className="h-4 w-4 text-[#0aad0a]" /> Dès 15 minutes</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2"><ShieldCheck className="h-4 w-4 text-[#0aad0a]" /> Paiement sécurisé</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2"><Truck className="h-4 w-4 text-[#0aad0a]" /> Suivi livreur</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute -left-8 top-12 hidden rounded-[2rem] bg-white p-4 shadow-2xl shadow-green-950/10 sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">🛒</div>
                <div>
                  <p className="text-xs font-bold text-neutral-400">Panier</p>
                  <p className="font-black">4 articles ajoutés</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-3 bottom-16 hidden rounded-[2rem] bg-white p-4 shadow-2xl shadow-green-950/10 sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-50 text-2xl">🛵</div>
                <div>
                  <p className="text-xs font-bold text-neutral-400">Livreur</p>
                  <p className="font-black">Arrive dans 8 min</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2.5rem] bg-white p-4 shadow-[0_30px_80px_rgba(32,80,32,0.18)] ring-1 ring-black/5">
              <div className="overflow-hidden rounded-[2rem] bg-[#f6f7f2]">
                <div className="relative h-56 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1100&q=80')] bg-cover bg-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <p className="text-sm font-bold opacity-90">Ouvert maintenant</p>
                    <h2 className="text-3xl font-black tracking-tight">Marché Frais</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  {products.map((product) => (
                    <div key={product.name} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                      <div className="mb-3 flex h-20 items-center justify-center rounded-2xl bg-[#f7f7f2] text-4xl">{product.image}</div>
                      <p className="truncate text-sm font-black">{product.name}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-neutral-500">{product.price}</span>
                        <button aria-label={`Ajouter ${product.name}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0aad0a] text-white">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="courses" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-[#0aad0a]">Tout commander</p>
              <h2 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">Courses, repas et essentiels</h2>
            </div>
            <Link href="/explorer" className="inline-flex items-center gap-2 text-sm font-black text-[#0aad0a]">
              Explorer toutes les catégories <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link key={category.label} href="/explorer" className={`${category.color} group rounded-[2rem] p-5 ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl`}>
                <div className="mb-6 text-4xl transition group-hover:scale-110">{category.emoji}</div>
                <p className="text-lg font-black tracking-tight">{category.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="commerces" className="bg-[#f7f7f2] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-[#0aad0a]">Autour de vous</p>
            <h2 className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">Des commerces locaux en quelques clics</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-neutral-600">
              Binq met en avant les vendeurs proches, leurs produits disponibles et les délais de livraison estimés.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {stores.map((store) => (
              <Link key={store.name} href="/explorer" className="group overflow-hidden rounded-[2.2rem] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-950/10">
                <div className="relative h-52 overflow-hidden">
                  <img src={store.image} alt={store.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-black text-[#0aad0a] shadow-sm">Ouvert</div>
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black tracking-tight">{store.name}</h3>
                      <p className="text-sm font-semibold text-neutral-500">{store.type}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f7f2] px-2.5 py-1 text-xs font-black">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> {store.rating}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm font-bold text-neutral-500">
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {store.time}</span>
                    <span className="inline-flex items-center gap-1.5 text-[#0aad0a]">Commander <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="livraison" className="bg-white py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-[#0aad0a]">Suivi temps réel</p>
            <h2 className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">Du rayon jusqu&apos;à votre porte</h2>
            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-neutral-600">
              Le client voit sa commande avancer, le commerçant reçoit une liste claire à préparer et le livreur suit l&apos;adresse GPS du client avec Mapbox.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { icon: Search, title: "Le client choisit ses articles", desc: "Adresse, boutique, panier et paiement sécurisé." },
                { icon: PackageCheck, title: "Le commerçant prépare", desc: "Commande reçue, stock vérifié et statut mis à jour." },
                { icon: Truck, title: "Le livreur dépose", desc: "Itinéraire, position client et confirmation de livraison." },
              ].map((step) => (
                <div key={step.title} className="flex gap-4 rounded-[1.7rem] bg-[#f7f7f2] p-4 ring-1 ring-black/5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0aad0a] text-white">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black">{step.title}</h3>
                    <p className="text-sm font-semibold leading-6 text-neutral-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2.5rem] bg-[#172017] p-4 text-white shadow-2xl shadow-green-950/20">
            <div className="rounded-[2rem] bg-[#213021] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white/50">Commande #BQ-2048</p>
                  <h3 className="text-2xl font-black">En livraison</h3>
                </div>
                <span className="rounded-full bg-[#0aad0a] px-3 py-1 text-xs font-black">Live</span>
              </div>
              <div className="relative h-80 overflow-hidden rounded-[1.6rem] bg-[#d9ead3]">
                <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "linear-gradient(90deg, rgba(0,0,0,.08) 1px, transparent 1px), linear-gradient(rgba(0,0,0,.08) 1px, transparent 1px)", backgroundSize: "34px 34px" }} />
                <div className="absolute left-12 top-12 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0aad0a] shadow-xl"><Store className="h-6 w-6" /></div>
                <div className="absolute bottom-14 right-12 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0aad0a] shadow-xl"><MapPin className="h-6 w-6" /></div>
                <div className="absolute left-[44%] top-[48%] flex h-14 w-14 items-center justify-center rounded-full bg-[#0aad0a] text-white shadow-2xl"><Truck className="h-7 w-7" /></div>
                <div className="absolute left-24 top-28 h-28 w-48 rotate-[28deg] rounded-full border-4 border-dashed border-[#0aad0a]/60" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/50">Distance</p><p className="font-black">2.4 km</p></div>
                <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/50">Arrivée</p><p className="font-black">8 min</p></div>
                <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/50">Frais</p><p className="font-black">1 000</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="partenaires" className="bg-[#0aad0a] py-16 text-white sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-white/70">Pour commerçants et livreurs</p>
            <h2 className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">Vendez plus. Livrez mieux.</h2>
            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-white/80">
              Binq donne aux commerces une vitrine mobile, des paiements en ligne, l&apos;assignation livreur et un wallet pour suivre les revenus.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/inscription" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#0aad0a] hover:bg-green-50">
                Devenir commerçant <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/livraisons" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-black text-white hover:bg-white/20">
                Devenir livreur
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Store, title: "Boutique en ligne", desc: "Produits, photos, prix et disponibilités." },
              { icon: BadgeCheck, title: "Commandes claires", desc: "Statuts, préparation et historique." },
              { icon: Truck, title: "Livreurs assignés", desc: "Adresse client et suivi Mapbox." },
              { icon: ShieldCheck, title: "Wallet intégré", desc: "Gains commerçant, gains livreur et frais Binq." },
            ].map((item) => (
              <div key={item.title} className="rounded-[2rem] bg-white/12 p-6 ring-1 ring-white/15 backdrop-blur">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0aad0a]">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/75">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fff36d] py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#0aad0a] shadow-xl shadow-green-950/10">
            <ShoppingBasket className="h-8 w-8" />
          </div>
          <h2 className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">Prêt à commander local ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-8 text-[#3d493d]">
            Entrez votre adresse, trouvez les commerces proches et recevez vos produits avec un livreur Binq.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/explorer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0aad0a] px-8 py-4 text-sm font-black text-white shadow-xl shadow-green-950/10 hover:bg-[#079707]">
              Commencer maintenant <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/inscription" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-[#172017] hover:bg-green-50">
              Inscrire mon commerce
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <div>
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0aad0a] text-white"><ShoppingBasket className="h-4 w-4" /></div>
              <span className="text-lg font-black">Binq</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-neutral-500">Commerce local, paiement sécurisé et livraison suivie.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm font-bold text-neutral-500">
            <Link href="/explorer" className="hover:text-[#0aad0a]">Commander</Link>
            <Link href="/connexion" className="hover:text-[#0aad0a]">Connexion</Link>
            <Link href="/inscription" className="hover:text-[#0aad0a]">Partenaires</Link>
          </div>
          <p className="text-xs font-semibold text-neutral-400">© {new Date().getFullYear()} Binq. Tous droits réservés.</p>
        </div>
      </footer>
    </main>
  );
}
