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
  Wallet,
  SendHorizonal,
  ArrowDownToLine,
  ChevronDown,
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
  { href: "/portefeuille", label: "Mon Portefeuille", icon: Wallet },
  { href: "/envoyer", label: "Envoyer", icon: SendHorizonal },
  { href: "/deposer", label: "Ajouter de l'argent", icon: ArrowDownToLine },
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
    if (min < 1) return "À l&apos;instant";
    if (min < 60) return `Il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Il y a ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `Il y a ${d}j`;
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50/50 font-sans antialiased">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={`fixed top-0 left-0 h-full w-[260px] bg-white border-r border-gray-200/80 z-50 transform transition-transform duration-300 ease-out flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
          {/* Logo */}
          <div className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/40">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">Binq</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 overflow-y-auto">
            <p className="mb-3 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menu</p>
            <div className="space-y-1">
              {mainLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 group ${
                      isActive
                        ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                    }`}
                  >
                    <link.icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? "text-amber-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Footer */}
          <div className="p-3 border-t border-gray-100 bg-white" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-gray-50 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white font-bold uppercase text-xs">
                  {user?.prenom?.[0] || ""}{user?.nom?.[0] || ""}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.prenom} {user?.nom}</p>
                <p className="text-[11px] text-gray-400 truncate">Membre Binq</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div className="absolute bottom-20 left-3 w-[236px] bg-white border border-gray-200 rounded-2xl shadow-xl p-1.5 z-50">
                <Link href="/parametres" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <Settings className="w-4 h-4 text-gray-400" />
                  Paramètres
                </Link>
                <div className="h-px bg-gray-100 my-1" />
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Area ── */}
        <div className="lg:ml-[260px] flex flex-col min-h-screen">

          {/* Header */}
          <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 hidden sm:block">
                {pathname === "/dashboard" ? "Tableau de bord" : pathname.startsWith("/portefeuille") ? "Mon Portefeuille" : pathname.startsWith("/envoyer") ? "Envoyer de l'argent" : pathname.startsWith("/deposer") ? "Ajouter de l'argent" : "Binq"}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                  <Bell className="w-[18px] h-[18px] text-gray-400" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border-2 border-white"></span>
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                          Tout marquer lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">Aucune notification</p>
                        </div>
                      ) : (
                        <div className="p-1.5 space-y-0.5">
                          {notifications.map((notif) => (
                            <div key={notif.id} className={`px-4 py-3 rounded-xl transition-colors ${notif.lu ? "hover:bg-gray-50 opacity-60" : "bg-amber-50/50 border border-amber-100/50"}`}>
                              <div className="flex justify-between items-start gap-3">
                                <span className={`text-sm font-bold ${notif.lu ? "text-gray-700" : "text-amber-700"}`}>{notif.titre}</span>
                                {!notif.lu && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />}
                              </div>
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                              <span className="text-[10px] text-gray-300 font-medium mt-1 block">{formatTimeAgo(notif.created_at)}</span>
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

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
