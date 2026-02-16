"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import Avatar from "@/components/Avatar";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Star,
  Compass,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Plus,
  ChevronDown,
  User,
  Wallet,
  ArrowLeftRight,
  Search,
} from "lucide-react";

const sidebarLinks = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/portefeuille", label: "Portefeuille", icon: Wallet },
  { href: "/tontines", label: "Mes Tontines", icon: Users },
  { href: "/explorer", label: "Explorer", icon: Compass },
  { href: "/paiements", label: "Paiements", icon: CreditCard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface-50 bg-gradient-mesh">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-full w-[260px] bg-gray-950 z-50 transform transition-transform duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 flex flex-col`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06]">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow">
                <Star className="w-5 h-5 text-white fill-current" />
              </div>
              <span className="text-[17px] font-bold text-white tracking-tight">
                Binq
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-primary-600/20 text-primary-300"
                      : "text-gray-400 hover:bg-white/[0.06] hover:text-gray-200"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <link.icon className={`w-[18px] h-[18px] transition-colors ${isActive ? "text-primary-400" : "text-gray-500 group-hover:text-gray-400"}`} />
                  {link.label}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
                  )}
                </Link>
              );
            })}

            <div className="pt-3 mt-3 border-t border-white/[0.06]">
              <Link
                href="/tontines/creer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-accent-400 hover:bg-accent-500/10 transition-all duration-200 group"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="w-[18px] h-[18px] rounded-md bg-accent-500/20 flex items-center justify-center group-hover:bg-accent-500/30 transition-colors">
                  <Plus className="w-3 h-3" />
                </div>
                Créer une Tontine
              </Link>
            </div>
          </nav>

          {/* Bottom user area */}
          <div className="p-3 border-t border-white/[0.06]">
            <Link
              href="/dashboard/profil"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-gray-400 hover:bg-white/[0.06] hover:text-gray-200 font-medium transition-all"
            >
              <User className="w-[18px] h-[18px] text-gray-500" />
              Mon Profil
            </Link>
            <Link
              href="/dashboard/parametres"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-gray-400 hover:bg-white/[0.06] hover:text-gray-200 font-medium transition-all"
            >
              <Settings className="w-[18px] h-[18px] text-gray-500" />
              Paramètres
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-red-400 hover:bg-red-500/10 font-medium text-left transition-all"
            >
              <LogOut className="w-[18px] h-[18px]" />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:ml-[260px] min-h-screen flex flex-col">
          {/* Top bar */}
          <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 sm:px-6 h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
                    {sidebarLinks.find((l) => l.href === pathname)?.label || "Binq"}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <button className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors hidden sm:flex">
                  <Search className="w-[18px] h-[18px] text-gray-400" />
                </button>

                {/* Notifications */}
                <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                  <Bell className="w-[18px] h-[18px] text-gray-400" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                </button>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block" />

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Avatar user={user!} size="sm" />
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user?.prenom} {user?.nom[0]}.
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 top-14 w-60 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 py-1.5 z-20 animate-fade-up">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                          <Avatar user={user!} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.prenom} {user?.nom}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                          </div>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/dashboard/profil"
                            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            Mon profil
                          </Link>
                          <Link
                            href={`/membres/${user?.id}`}
                            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            Voir mon profil public
                          </Link>
                          <Link
                            href="/dashboard/parametres"
                            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            Paramètres
                          </Link>
                        </div>
                        <div className="border-t border-gray-100 py-1">
                          <button
                            onClick={() => { setProfileOpen(false); handleLogout(); }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Déconnexion
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Suspense fallback={
              <div className="space-y-6 animate-pulse">
                <div className="h-7 w-48 bg-gray-200 rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
                      <div className="h-4 w-20 bg-gray-100 rounded mb-3" />
                      <div className="h-8 w-28 bg-gray-200 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            }>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
