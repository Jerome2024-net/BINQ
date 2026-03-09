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
  Wallet,
  SendHorizonal,
  ArrowDownToLine,
  History,
  HandCoins,
  User,
  X,
  ChevronDown,
  Star,
} from "lucide-react";

interface Notification {
  id: string;
  titre: string;
  message: string;
  lu: boolean;
  created_at: string;
}

const bottomTabs = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/deposer", label: "Déposer", icon: ArrowDownToLine },
  { href: "/envoyer", label: "Envoyer", icon: SendHorizonal },
  { href: "/demander", label: "Demander", icon: HandCoins },
  { href: "/portefeuille", label: "Historique", icon: History },
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
      <div className="min-h-screen bg-white font-sans antialiased text-gray-900">

        {/* ── Top Header Bar ── */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-2xl border-b border-gray-100">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14 max-w-2xl mx-auto">
            {/* Left: Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-black text-base tracking-tight">Binq</span>
            </Link>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {/* Notification */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} className="relative p-2.5 rounded-xl hover:bg-gray-100/50 transition-colors">
                  <Bell className="w-[18px] h-[18px] text-gray-400" />
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
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Aucune notification</p>
                        </div>
                      ) : (
                        <div className="p-1.5 space-y-0.5">
                          {notifications.map((notif) => (
                            <div key={notif.id} className={`px-4 py-2.5 rounded-xl transition-colors ${notif.lu ? "opacity-50" : "bg-emerald-50"}`}>
                              <div className="flex justify-between items-start gap-3">
                                <span className={`text-sm font-bold ${notif.lu ? "text-gray-500" : "text-emerald-600"}`}>{notif.titre}</span>
                                {!notif.lu && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />}
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                              <span className="text-[10px] text-gray-400 mt-0.5 block">{formatTimeAgo(notif.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} className="p-1.5 rounded-xl hover:bg-gray-100/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <span className="text-white text-[10px] font-black uppercase">{initials}</span>
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200/60 rounded-2xl shadow-xl p-1.5 z-50">
                    <div className="px-3 py-2.5 mb-1">
                      <p className="text-sm font-bold">{user?.prenom} {user?.nom}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link href="/profil" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100/50 hover:text-gray-900 transition-colors">
                      <User className="w-4 h-4" />
                      Mon Profil
                    </Link>
                    <Link href="/parametres" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100/50 hover:text-gray-900 transition-colors">
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
        <main className="pb-24 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto pt-4 sm:pt-6">
            {children}
          </div>
        </main>

        {/* ── Bottom Tab Bar (Mobile Money style) ── */}
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-gray-200/50 safe-area-pb">
          <div className="max-w-2xl mx-auto flex items-center justify-around h-16 px-2">
            {bottomTabs.map((tab) => {
              const isActive = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center gap-0.5 w-14 sm:w-16 py-1 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-emerald-600"
                      : "text-gray-400 hover:text-gray-500"
                  }`}
                >
                  <div className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition-colors ${isActive ? "bg-emerald-50" : ""}`}>
                    <tab.icon className={`w-[18px] h-[18px] sm:w-5 sm:h-5 ${isActive ? "text-emerald-600" : ""}`} />
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-semibold ${isActive ? "text-emerald-600" : ""}`}>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </AuthGuard>
  );
}
