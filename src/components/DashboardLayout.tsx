"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import Avatar from "@/components/Avatar";
import {
  LayoutDashboard,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Plus,
  ChevronDown,
  User,
  Users,
  Wallet,
  Search,
  Lock,
  Sparkles,
} from "lucide-react";

const mainLinks = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/coffres", label: "Coffres", icon: Lock },
  { href: "/portefeuille", label: "Portefeuille", icon: Wallet },
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
          className={`fixed top-0 left-0 h-full w-[280px] bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 flex flex-col`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-6 h-[72px] border-b border-gray-100">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Sparkles className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                Binq
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <div className="mb-2 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Menu Principal
            </div>
            {mainLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <link.icon className={`w-[20px] h-[20px] transition-colors ${
                    isActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-500"
                  }`} />
                  {link.label}
                </Link>
              );
            })}



            <div className="my-4 mx-3 border-t border-gray-100" />

            <div className="mb-2 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Actions Rapides
            </div>
            <Link
              href="/dashboard/coffres"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="w-[20px] h-[20px] rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-primary-600 group-hover:border-primary-200 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </div>
              Nouveau Coffre
            </Link>
          </nav>

          {/* Bottom user area */}
          <div className="p-4 border-t border-gray-200 bg-gray-50/80">
            <div className="flex items-center gap-3 px-2 mb-3">
              <Avatar user={user!} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.prenom || ""} {user?.nom || ""}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || ""}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Link
                href="/dashboard/profil"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm font-medium transition-all"
              >
                <User className="w-[18px] h-[18px] text-gray-400" />
                Mon Profil
              </Link>
              <Link
                href="/dashboard/parametres"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm font-medium transition-all"
              >
                <Settings className="w-[18px] h-[18px] text-gray-400" />
                Paramètres
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-600 font-medium text-left transition-all"
              >
                <LogOut className="w-[18px] h-[18px]" />
                Déconnexion
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:ml-[280px] min-h-screen flex flex-col bg-gray-50/50">
          {/* Top bar */}
          <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-30 h-[72px]">
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
                    {mainLinks.find((l) => l.href === pathname)?.label || "Binq"}
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
