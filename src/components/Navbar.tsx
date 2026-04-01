"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, LogIn, ArrowRight } from "lucide-react";

const navLinks = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#tarifs", label: "Tarifs" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-neutral-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-neutral-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-xs">B</span>
            </div>
            <span className="font-semibold text-neutral-900 tracking-tight">Binq</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/connexion"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors font-medium rounded-lg hover:bg-neutral-50"
            >
              <LogIn className="w-3.5 h-3.5" />
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="flex items-center gap-1.5 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Inscription
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-neutral-100 mt-2 pt-3">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2.5 rounded-lg text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 font-medium transition-colors text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-neutral-100" />
              <Link
                href="/connexion"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 font-medium text-sm"
                onClick={() => setIsOpen(false)}
              >
                <LogIn className="w-4 h-4" />
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="flex items-center justify-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium mt-1"
                onClick={() => setIsOpen(false)}
              >
                Inscription
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
