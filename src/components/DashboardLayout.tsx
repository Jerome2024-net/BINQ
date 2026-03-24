"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import {
  Settings,
  Bell,
  LogOut,
  User,
  X,
  Star,
  ShoppingBag,
  Store,
  Package,
  Wallet,
  Calendar,
  Ticket,
  TrendingUp,
} from "lucide-react";

interface Notification {
  id: string;
  titre: string;
  message: string;
  lu: boolean;
  created_at: string;
}

const bottomTabs = [
  { href: "/dashboard", label: "Accueil", icon: ShoppingBag },
  { href: "/evenements", label: "\u00c9v\u00e9nements", icon: Calendar },
  { href: "/portefeuille", label: "Wallet", icon: Wallet },
  { href: "/ventes", label: "Ventes", icon: TrendingUp },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef<number | null>(null);

  const playNotifSound = useCallback(() => {
    try {
      const ctx = new window.AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
      setTimeout(() => ctx.close(), 500);
    } catch { /* ignore */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const newUnread = data.unreadCount || 0;
      if (prevUnreadRef.current !== null && newUnread > prevUnreadRef.current) {
        playNotifSound();
      }
      prevUnreadRef.current = newUnread;
      setNotifications(data.notifications || []);
      setUnreadCount(newUnread);
    } catch { /* ignore */ }
  }, [playNotifSound]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const formatTimeAgo = (dateStr: string) => {
    const min = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (min < 1) return "À l'instant";
    if (min < 60) return `Il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Il y a ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `Il y a ${d}j`;
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const initials = `${user?.prenom?.[0] || ""}${user?.nom?.[0] || ""}`;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white font-sans antialiased text-gray-900 lg:flex">

        {/* ── Desktop Sidebar (lg+) ── */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:border-r lg:border-gray-100 bg-white">
          {/* Sidebar Header */}
          <div className="flex items-center gap-2.5 px-6 h-16 border-b border-gray-100">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Star className="w-4.5 h-4.5 text-white fill-white" />
            </div>
            <span className="font-black text-lg tracking-tight">Binq</span>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {bottomTabs.map((tab) => {
              const isActive = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${isActive ? "bg-emerald-100" : ""}`}>
                    <tab.icon className={`w-[18px] h-[18px] ${isActive ? "text-emerald-600" : "text-gray-400"}`} />
                  </div>
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer — Profile */}
          <div className="px-3 py-4 border-t border-gray-100">
            <Link href="/profil" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-black uppercase">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.prenom} {user?.nom}</p>
                <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
              </div>
            </Link>
            <button onClick={handleLogout} className="mt-1 flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm text-gray-400 hover:bg-red-50 hover:text-red-500 transition w-full text-left">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <div className="flex-1 lg:ml-64 xl:ml-72">

        {/* ── Top Header Bar ── */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-2xl border-b border-gray-100">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto">
            {/* Left: Logo (mobile only) */}
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-black text-base tracking-tight">Binq</span>
            </Link>

            {/* Left: Page breadcrumb (desktop) */}
            <div className="hidden lg:block">
              <h2 className="text-sm font-bold text-gray-900">
                {bottomTabs.find(t => t.href === pathname || (t.href !== "/dashboard" && pathname.startsWith(t.href)))?.label || "Dashboard"}
              </h2>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {/* Notification */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} className="relative p-2.5 rounded-xl hover:bg-gray-100/50 transition-colors">
                  <Bell className="w-[18px] h-[18px] text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200/60 rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/50">
                      <h3 className="text-sm font-bold">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs font-semibold text-emerald-600 hover:text-emerald-600 transition-colors">
                          Tout marquer lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-700">Aucune notification</p>
                        </div>
                      ) : (
                        <div className="p-1.5 space-y-0.5">
                          {notifications.map((notif) => (
                            <div key={notif.id} className={`px-4 py-2.5 rounded-xl transition-colors ${notif.lu ? "opacity-50" : "bg-emerald-50"}`}>
                              <div className="flex justify-between items-start gap-3">
                                <span className={`text-sm font-bold ${notif.lu ? "text-gray-700" : "text-emerald-600"}`}>{notif.titre}</span>
                                {!notif.lu && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />}
                              </div>
                              <p className="text-[11px] text-gray-700 mt-0.5 leading-relaxed">{notif.message}</p>
                              <span className="text-[10px] text-gray-600 mt-0.5 block">{formatTimeAgo(notif.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile (mobile/tablet only) */}
              <div className="relative lg:hidden" ref={profileRef}>
                <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} className="p-1.5 rounded-xl hover:bg-gray-100/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <span className="text-white text-[10px] font-black uppercase">{initials}</span>
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200/60 rounded-2xl shadow-xl p-1.5 z-50">
                    <div className="px-3 py-2.5 mb-1">
                      <p className="text-sm font-bold">{user?.prenom} {user?.nom}</p>
                      <p className="text-[11px] text-gray-700 truncate">{user?.email}</p>
                    </div>
                    <Link href="/profil" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-100/50 hover:text-gray-900 transition-colors">
                      <User className="w-4 h-4" />
                      Mon Profil
                    </Link>
                    <Link href="/parametres" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-100/50 hover:text-gray-900 transition-colors">
                      <Settings className="w-4 h-4" />
                      Param&egrave;tres
                    </Link>
                    <div className="h-px bg-gray-100/50 my-1" />
                    <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors w-full text-left">
                      <LogOut className="w-4 h-4" />
                      D&eacute;connexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="pb-24 lg:pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto pt-4 sm:pt-6">
            {children}
          </div>
        </main>

        {/* ── Bottom Tab Bar (mobile/tablet only) ── */}
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-gray-200/50 safe-area-pb lg:hidden">
          <div className="max-w-2xl mx-auto flex items-center justify-around h-16 px-2">
            {bottomTabs.map((tab) => {
              const isActive = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href));

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center gap-0.5 w-16 sm:w-18 py-1 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-emerald-600"
                      : "text-gray-600 hover:text-gray-700"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-emerald-50" : ""}`}>
                    <tab.icon className={`w-5 h-5 ${isActive ? "text-emerald-600" : ""}`} />
                  </div>
                  <span className={`text-[10px] font-semibold ${isActive ? "text-emerald-600" : ""}`}>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        </div>
      </div>
    </AuthGuard>
  );
}
