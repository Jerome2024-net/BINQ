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
            <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/24604813-8FD8-45AA-9C68-EBC3169541B9_ccpwbk" alt="Binq" className="h-20 w-auto md:hidden" />
            <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/0BBAEE5D-B790-4A3E-9345-A4975C84546D_xfvmso" alt="Binq" className="h-20 w-auto hidden md:block" />
          </div>
          <p className="text-gray-400 text-sm font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
