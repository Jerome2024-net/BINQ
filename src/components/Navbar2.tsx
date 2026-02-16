"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Menu,
  X,
  Home,
  Users,
  CreditCard,
  LogIn,
  UserPlus,
  CircleDollarSign,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <CircleDollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Tontine<span className="text-primary-600">App</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all">
              <Home className="w-4 h-4" />
              Accueil
            </Link>
            {user && (
              <>
                <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link href="/tontines" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all">
                  <Users className="w-4 h-4" />
                  Mes Tontines
                </Link>
                <Link href="/paiements" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all">
                  <CreditCard className="w-4 h-4" />
                  Paiements
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.prenom[0]}{user.nom[0]}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.prenom}</span>
                </Link>
                <button onClick={async () => { await logout(); }} className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all font-medium text-sm">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/connexion" className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary-600 transition-all font-medium">
                  <LogIn className="w-4 h-4" />
                  Connexion
                </Link>
                <Link href="/inscription" className="btn-primary text-sm !py-2 !px-4">
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Inscription
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4">
            <div className="flex flex-col gap-2">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600" onClick={() => setIsOpen(false)}>
                <Home className="w-5 h-5" />
                Accueil
              </Link>
              {user && (
                <>
                  <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600" onClick={() => setIsOpen(false)}>
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </Link>
                  <Link href="/tontines" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600" onClick={() => setIsOpen(false)}>
                    <Users className="w-5 h-5" />
                    Mes Tontines
                  </Link>
                  <Link href="/paiements" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600" onClick={() => setIsOpen(false)}>
                    <CreditCard className="w-5 h-5" />
                    Paiements
                  </Link>
                </>
              )}
              <hr className="my-2" />
              {user ? (
                <button
                  onClick={async () => { await logout(); setIsOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Déconnexion ({user.prenom})
                </button>
              ) : (
                <>
                  <Link href="/connexion" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600" onClick={() => setIsOpen(false)}>
                    <LogIn className="w-5 h-5" />
                    Connexion
                  </Link>
                  <Link href="/inscription" className="btn-primary text-center" onClick={() => setIsOpen(false)}>
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
