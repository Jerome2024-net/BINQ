"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/connexion");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </div>
        </div>
        <div className="w-12 h-12 mb-5 opacity-20">
          <div className="w-full h-full border-2 border-emerald-400/40 rounded-lg relative">
            <div className="absolute top-1 left-1 w-3 h-3 border-2 border-emerald-400/60 rounded-sm" />
            <div className="absolute top-1 right-1 w-3 h-3 border-2 border-emerald-400/60 rounded-sm" />
            <div className="absolute bottom-1 left-1 w-3 h-3 border-2 border-emerald-400/60 rounded-sm" />
            <div className="absolute bottom-3 right-3 w-1.5 h-1.5 bg-emerald-400/40 rounded-sm animate-pulse" />
          </div>
        </div>
        <p className="text-white/40 text-xs font-medium tracking-wider">BINQ</p>
        <p className="text-white/20 text-[10px] mt-1">Mobile Money · QR Code</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
