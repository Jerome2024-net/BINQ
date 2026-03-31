"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  LogIn,
  UserPlus,
  ArrowRight,
  ChevronDown,
  Fingerprint,
} from "lucide-react";

const navLinks = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#tarifs", label: "Tarifs" },
];

const solutions: { href: string; label: string; desc: string; icon: any }[] = [
  // { href: "/binq-access", label: "Binq Access", desc: "Contrôle d'accès entreprises", icon: Fingerprint },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [solOpen, setSolOpen] = useState(false);
  const solRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (solRef.current && !solRef.current.contains(e.target as Node)) setSolOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="bg-white/70 backdrop-blur-2xl border-b border-gray-100/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/82D516A1-AEEB-4D11-B7F0-C0DB72341613_gz12tn" alt="Binq" className="h-14 w-auto md:hidden" />
            <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/82D516A1-AEEB-4D11-B7F0-C0DB72341613_gz12tn" alt="Binq" className="h-14 w-auto hidden md:block" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-xl text-[14px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}

            {/* Solutions dropdown */}
            <div ref={solRef} className="relative">
              <button
                onClick={() => setSolOpen(!solOpen)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[14px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
              >
                Solutions
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${solOpen ? "rotate-180" : ""}`} />
              </button>
              {solOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 p-2 animate-fade-up z-50">
                  {solutions.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      onClick={() => setSolOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <s.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">{s.label}</p>
                        <p className="text-xs text-gray-500">{s.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/connexion"
              className="flex items-center gap-2 px-4 py-2 text-[14px] text-gray-600 hover:text-gray-900 transition-all font-medium rounded-xl hover:bg-gray-50"
            >
              <LogIn className="w-4 h-4" />
              Connexion
            </Link>
            <Link href="/inscription" className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-xl text-[14px] font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-md shadow-primary-500/20 hover:shadow-lg">
              Inscription
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4 animate-fade-up">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {/* Solutions mobile */}
              <button
                onClick={() => setSolOpen(!solOpen)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors w-full text-left"
              >
                Solutions
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${solOpen ? "rotate-180" : ""}`} />
              </button>
              {solOpen && (
                <div className="ml-4 flex flex-col gap-1">
                  {solutions.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors"
                      onClick={() => { setIsOpen(false); setSolOpen(false); }}
                    >
                      <s.icon className="w-5 h-5 text-emerald-500" />
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
              <hr className="my-2 border-gray-100" />
              <Link
                href="/connexion"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                onClick={() => setIsOpen(false)}
              >
                <LogIn className="w-5 h-5" />
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="btn-primary text-center mt-1"
                onClick={() => setIsOpen(false)}
              >
                Inscription
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
