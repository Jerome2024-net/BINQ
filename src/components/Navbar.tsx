"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  LogIn,
  UserPlus,
  ArrowRight,
} from "lucide-react";

const navLinks = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#tarifs", label: "Tarifs" },
  // { href: "/explorer", label: "Explorer" }, // Removed as page doesn't exist
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white/70 backdrop-blur-2xl border-b border-gray-100/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/ChatGPT_Image_24_f%C3%A9vr._2026_18_41_17_iwqq1o" alt="Binq" className="h-9 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-xl text-[14px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
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
            className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
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
