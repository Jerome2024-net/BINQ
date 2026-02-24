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
      <div className="min-h-screen flex items-center justify-center bg-surface-50 bg-gradient-mesh">
        <div className="text-center">
          <div className="flex items-center justify-center animate-pulse mx-auto mb-3">
            <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/ChatGPT_Image_24_f%C3%A9vr._2026_15_44_47_sgwgvi" alt="Binq" className="h-14 w-auto" />
          </div>
          <p className="text-gray-400 text-sm font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
