"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Users,
  ScanLine,
  ClipboardList,
  Shield,
} from "lucide-react";

const tabs = [
  { href: "/access", label: "Dashboard", icon: LayoutDashboard },
  { href: "/access/espaces", label: "Espaces", icon: MapPin },
  { href: "/access/membres", label: "Membres", icon: Users },
  { href: "/access/scanner", label: "Scanner", icon: ScanLine },
  { href: "/access/historique", label: "Historique", icon: ClipboardList },
];

export default function AccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/access"
      ? pathname === "/access"
      : pathname.startsWith(href);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        <h1 className="text-[22px] font-black text-gray-900">Binq Access</h1>
      </div>

      {/* Horizontal tabs — scrollable on mobile */}
      <div className="flex gap-1 overflow-x-auto pb-3 mb-5 -mx-1 px-1 scrollbar-hide">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all ${
                active
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-[0.97]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
