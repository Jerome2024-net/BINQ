import Link from "next/link";
import { Star, Mail, Shield, Headphones } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Binq
              </span>
            </div>
            <p className="text-gray-500 text-[14px] leading-relaxed mb-6">
              La fintech digitale pour gérer votre argent simplement et en toute sécurité.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Shield className="w-3.5 h-3.5" />
                <span>Paiements sécurisés</span>
              </div>
            </div>
          </div>

          {/* Produit */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Produit</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/#fonctionnalites", label: "Fonctionnalités" },
                { href: "/#tarifs", label: "Tarifs" },
                { href: "/dashboard", label: "Dashboard" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-gray-300 transition-colors text-[14px]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Ressources</h3>
            <ul className="space-y-2.5">
              {[
                { href: "#", label: "Centre d'aide" },
                { href: "#", label: "Guide de démarrage" },
                { href: "#", label: "FAQ" },
                { href: "#", label: "Blog" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-gray-500 hover:text-gray-300 transition-colors text-[14px]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white text-sm font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-gray-500 text-[14px]">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-600" />
                <a href="mailto:support@binq.io" className="hover:text-gray-300 transition-colors">
                  support@binq.io
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-gray-600" />
                <span>Support 7j/7</span>
              </li>
            </ul>
            <div className="mt-6 bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[13px] text-gray-400 font-medium mb-1">Newsletter</p>
              <p className="text-[12px] text-gray-600 mb-3">Restez informé des nouveautés</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="flex-1 min-w-0 px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-primary-500/50"
                />
                <button className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap">
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800/60 mt-8 sm:mt-10 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-[13px]">
            © 2026 Binq. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-gray-600 hover:text-gray-400 text-[13px] transition-colors">
              Mentions légales
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-400 text-[13px] transition-colors">
              Confidentialité
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-400 text-[13px] transition-colors">
              CGU
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
