import Link from "next/link";
import { Mail, Headphones } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-neutral-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-xs">B</span>
              </div>
              <span className="font-semibold text-neutral-900 tracking-tight">Binq</span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">
              The modern ticketing platform for events of any size.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-neutral-900 text-sm font-semibold mb-4">Product</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/#fonctionnalites", label: "Features" },
                { href: "/#tarifs", label: "Pricing" },
                { href: "/dashboard", label: "Dashboard" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-neutral-400 hover:text-neutral-900 transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-neutral-900 text-sm font-semibold mb-4">Resources</h3>
            <ul className="space-y-2.5">
              {[
                { href: "#", label: "Help Center" },
                { href: "#", label: "Getting Started" },
                { href: "#", label: "FAQ" },
                { href: "#", label: "Blog" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-neutral-400 hover:text-neutral-900 transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-neutral-900 text-sm font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-neutral-400">
                <Mail className="w-4 h-4 text-neutral-300" />
                <a href="mailto:support@binq.io" className="hover:text-neutral-900 transition-colors">
                  support@binq.io
                </a>
              </li>
              <li className="flex items-center gap-2 text-neutral-400">
                <Headphones className="w-4 h-4 text-neutral-300" />
                <span>Support 7/7</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-100 mt-8 sm:mt-10 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-300 text-xs">
            &copy; {new Date().getFullYear()} Binq. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-neutral-300 hover:text-neutral-900 text-xs transition-colors">
              Legal
            </Link>
            <Link href="#" className="text-neutral-300 hover:text-neutral-900 text-xs transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-neutral-300 hover:text-neutral-900 text-xs transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
