import Link from "next/link";
import { Star } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Binq
              </span>
            </div>
            <p className="text-gray-500 max-w-sm text-[15px] leading-relaxed">
              La plateforme digitale pour gérer vos tontines en toute
              transparence. Simplifiez vos cotisations et restez connectés.
            </p>
          </div>

          {/* Liens */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "Accueil" },
                { href: "/dashboard", label: "Dashboard" },
                { href: "/explorer", label: "Explorer" },
                { href: "/tontines", label: "Mes Tontines" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-gray-300 transition-colors text-[14px]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Contact</h3>
            <ul className="space-y-2.5 text-gray-500 text-[14px]">
              <li>support@binq.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800/60 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-[13px]">
            © 2026 Binq. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
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
