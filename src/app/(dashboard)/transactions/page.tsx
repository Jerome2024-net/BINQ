"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TransactionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/commandes");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="text-sm text-gray-500">Redirection...</p>
    </div>
  );
}
