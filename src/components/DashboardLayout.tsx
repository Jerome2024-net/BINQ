"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
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
  Wallet,
  Search,
  Lock,
  ArrowLeftRight,
  CreditCard,
  Check,
  CheckCheck,
} from "lucide-react";

interface Notification {
  id: string;
  titre: string;
  message: string;
  lu: boolean;
  created_at: string;
}

const mainLinks = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/portefeuille", label: "Portefeuille", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/paiements", label: "Paiements", icon: CreditCard },
  { href: "/dashboard/coffres", label: "Coffres", icon: Lock },
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch { /* ignore */ }
  }, []);

  // Initial fetch + poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark all as read
  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Format relative time
  const formatTimeAgo = (dateStr: string) => {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Il y a ${days}j`;
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ─── Sidebar ─── */}
        <aside
          className={`fixed top-0 left-0 h-full w-[260px] bg-white border-r border-gray-200/80 z-50 transform transition-transform duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 flex flex-col`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-gray-100">
            <Link href="/" className="flex items-center">
              <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/24604813-8FD8-45AA-9C68-EBC3169541B9_ccpwbk" alt="Binq" className="h-10 w-auto lg:hidden" />
              <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/0BBAEE5D-B790-4A3E-9345-A4975C84546D_xfvmso" alt="Binq" className="h-10 w-auto hidden lg:block" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-5 overflow-y-auto">
            <div className="mb-2 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Menu
            </div>
            <div className="space-y-0.5">
              {mainLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group ${
                      isActive
                        ? "bg-primary-50 text-primary-700 border border-primary-100"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                    }`}
                  >
                    <link.icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                      isActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"
                    }`} />
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="my-5 mx-3 border-t border-gray-100" />

            <div className="mb-2 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Raccourcis
            </div>
            <Link
              href="/dashboard/coffres"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 group border border-transparent"
            >
              <div className="w-[18px] h-[18px] rounded flex items-center justify-center border border-gray-300 group-hover:border-primary-400 group-hover:bg-primary-50 transition-all">
                <Plus className="w-3 h-3 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>
              <span className="truncate">Nouveau Coffre</span>
            </Link>
          </nav>
        </aside>

        {/* ─── Main Content ─── */}
        <div className="lg:ml-[260px] min-h-screen flex flex-col">
          {/* Top bar */}
          <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 sm:px-6 h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-base sm:text-lg font-semibold text-gray-900">
                  {mainLinks.find((l) => l.href === pathname)?.label || "Binq"}
                </h1>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Search */}
                <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors hidden sm:flex">
                  <Search className="w-[18px] h-[18px] text-gray-400" />
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                    className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Bell className="w-[18px] h-[18px] text-gray-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 z-20 animate-fade-up overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Tout marquer lu
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center">
                            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Aucune notification</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${
                                n.lu ? "bg-white" : "bg-primary-50/40"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.lu ? "bg-transparent" : "bg-primary-500"}`} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13px] font-semibold text-gray-900">{n.titre}</p>
                                  <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                  <p className="text-[10px] text-gray-300 mt-1">
                                    {formatTimeAgo(n.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-7 bg-gray-200 mx-1 hidden sm:block" />

                {/* Profile */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Avatar user={user!} size="sm" />
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                      {user?.prenom} {user?.nom?.[0]}.
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 hidden sm:block transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 py-1 z-20 animate-fade-up">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                        <Avatar user={user!} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user?.prenom} {user?.nom}</p>
                          <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
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
                          Profil public
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
