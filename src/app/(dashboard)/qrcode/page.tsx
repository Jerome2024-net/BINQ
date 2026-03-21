"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QRCodeRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/ma-boutique"); }, [router]);
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
