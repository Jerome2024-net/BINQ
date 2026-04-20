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
  Home,
  Calendar,
  Wallet,
  TrendingUp,
  Plus,
  QrCode,
  UtensilsCrossed,
} from "lucide-react";

interface Notification {
  id: string;
  titre: string;
  message: string;
  lu: boolean;
  created_at: string;
}

const bottomTabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/evenements", label: "Events", icon: Calendar },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/portefeuille", label: "Wallet", icon: Wallet },
  { href: "/ventes", label: "Analytics", icon: TrendingUp },
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
      <div className="min-h-screen bg-white font-sans antialiased text-neutral-900 lg:flex">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:flex lg:flex-col lg:w-[220px] lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:border-r lg:border-neutral-200 bg-white">
          {/* Logo */}
          <div className="flex items-center gap-2 px-5 h-14 border-b border-neutral-200">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
              <QrCode className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-[15px] text-neutral-900">Binq</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            {bottomTabs.map((tab) => {
              const isActive = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isActive ? "text-neutral-900" : "text-neutral-400"}`} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {/* Profile */}
          <div className="px-3 py-3 border-t border-neutral-200">
            <Link href="/profil" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-50 transition group">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                <span className="text-neutral-600 text-[10px] font-semibold uppercase">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-neutral-900 truncate">{user?.prenom} {user?.nom}</p>
                <p className="text-[11px] text-neutral-400 truncate">{user?.email}</p>
              </div>
            </Link>
            <button onClick={handleLogout} className="mt-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-neutral-400 hover:bg-red-50 hover:text-red-500 transition w-full text-left">
              <LogOut className="w-3.5 h-3.5" />
              Se déconnecter
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 lg:ml-[220px]">

        {/* ── Top Bar ── */}
        <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 max-w-5xl mx-auto">
            {/* Left: Logo (mobile) */}
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
                <QrCode className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-[15px]">Binq</span>
            </Link>

            {/* Left: breadcrumb (desktop) */}
            <div className="hidden lg:block">
              <h2 className="text-[13px] font-medium text-neutral-500">
                {bottomTabs.find(t => t.href === pathname || (t.href !== "/dashboard" && pathname.startsWith(t.href)))?.label || "Dashboard"}
              </h2>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1">
              {/* Notification */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors">
                  <Bell className="w-[18px] h-[18px] text-neutral-500" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-neutral-200 rounded-xl shadow-hard overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="w-5 h-5 text-neutral-300 mx-auto mb-2" />
                          <p className="text-sm text-neutral-400">No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-100">
                          {notifications.map((notif) => (
                            <div key={notif.id} className={`px-4 py-3 ${notif.lu ? "opacity-50" : ""}`}>
                              <div className="flex justify-between items-start gap-3">
                                <span className="text-sm font-medium text-neutral-900">{notif.titre}</span>
                                {!notif.lu && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                              </div>
                              <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{notif.message}</p>
                              <span className="text-[11px] text-neutral-400 mt-0.5 block">{formatTimeAgo(notif.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile (mobile) */}
              <div className="relative lg:hidden" ref={profileRef}>
                <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} className="p-1 rounded-lg hover:bg-neutral-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-neutral-600 text-[10px] font-semibold uppercase">{initials}</span>
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-xl shadow-hard p-1 z-50">
                    <div className="px-3 py-2.5 mb-1">
                      <p className="text-sm font-medium">{user?.prenom} {user?.nom}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{user?.email}</p>
                    </div>
                    <Link href="/profil" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
                      <User className="w-4 h-4" />
                      Mon Profil
                    </Link>
                    <Link href="/parametres" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
                      <Settings className="w-4 h-4" />
                      Param&egrave;tres
                    </Link>
                    <div className="h-px bg-neutral-100 my-1" />
                    <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
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
        <main className="pb-20 lg:pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto pt-6">
            {children}
          </div>
        </main>

        {/* ── Bottom Tabs (mobile) ── */}
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-neutral-200 safe-area-pb lg:hidden">
          <div className="max-w-md mx-auto flex items-center justify-around h-14 px-2">
            {bottomTabs.map((tab) => {
              const isActive = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition-colors duration-150 ${
                    isActive ? "text-neutral-900" : "text-neutral-400"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
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
