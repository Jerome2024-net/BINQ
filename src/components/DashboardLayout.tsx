"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import {
  LayoutDashboard,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Bitcoin,
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
  { href: "/portefeuille", label: "Portefeuille Bitcoin", icon: Bitcoin },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => setSidebarOpen(false), [pathname]);

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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500/30 selection:text-amber-200">
        
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar (Dark Premium) */}
        <aside
          className={`fixed top-0 left-0 h-full w-[280px] bg-zinc-950/50 backdrop-blur-xl border-r border-white/5 z-50 transform transition-transform duration-300 ease-out flex flex-col ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          {/* Logo Section */}
          <div className="flex items-center justify-between px-6 h-20 shrink-0 border-b border-white/5 bg-zinc-950/50">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all duration-300">
                <Bitcoin className="w-5 h-5 text-zinc-950" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white group-hover:text-amber-400 transition-colors">Binq</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-zinc-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 overflow-y-auto">
            <div className="mb-4 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
              Menu
            </div>
            <div className="space-y-1.5">
              {mainLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden ${
                      isActive
                        ? "text-amber-400 bg-amber-500/10 border border-amber-500/20 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
                    }`}
                  >
                    <div className={`relative z-10 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                      <link.icon className="w-5 h-5" />
                    </div>
                    <span className="relative z-10">{link.label}</span>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-white/5 bg-zinc-950/80 relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 w-full p-2.5 rounded-2xl hover:bg-white/5 transition-all duration-300 group border border-transparent hover:border-white/5"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-amber-500/30 transition-colors shadow-lg">
                <span className="text-zinc-300 font-bold uppercase text-sm">
                  {user?.prenom?.[0] || ""}{user?.nom?.[0] || ""}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-xs text-zinc-500 truncate">Membre Binq</p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute bottom-20 left-4 w-[248px] bg-zinc-900/90 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl">
                <Link href="/parametres" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                  <Settings className="w-4 h-4 text-zinc-400" />
                  Paramètres
                </Link>
                <div className="h-px bg-white/5 my-1" />
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full text-left">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:ml-[280px] flex flex-col min-h-screen relative">
          
          {/* Header */}
          <header className="sticky top-0 z-30 h-20 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Contextual Title based on route */}
              <h1 className="text-lg font-bold text-white hidden sm:block">
                {pathname === "/dashboard" ? "Tableau de bord" : pathname.startsWith("/portefeuille") ? "Portefeuille Bitcoin" : ""}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2.5 rounded-full bg-zinc-900 border border-white/10 hover:border-amber-500/30 transition-colors group"
                >
                  <Bell className="w-5 h-5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border-2 border-zinc-950"></span>
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-zinc-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                      <h3 className="text-sm font-bold text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors">
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-[350px] overflow-y-auto p-2">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-sm font-medium">
                          Aucune notification pour le moment.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {notifications.map((notif) => (
                            <div key={notif.id} className={`p-4 rounded-2xl flex flex-col gap-1.5 transition-all ${notif.lu ? "hover:bg-zinc-800/50 opacity-70" : "bg-amber-500/5 border border-amber-500/10"}`}>
                              <div className="flex justify-between items-start gap-4">
                                <span className={`text-sm font-bold ${notif.lu ? "text-zinc-300" : "text-amber-400"}`}>{notif.titre}</span>
                                {!notif.lu && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.6)] mt-1.5" />}
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed">{notif.message}</p>
                              <span className="text-[10px] text-zinc-500 font-medium">{formatTimeAgo(notif.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Background Effects & Container */}
          <main className="flex-1 p-4 sm:p-8 overflow-x-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />
            
            <div className="max-w-5xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
