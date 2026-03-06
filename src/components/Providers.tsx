"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { PaymentProvider } from "@/contexts/PaymentContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <FinanceProvider>
          <PaymentProvider>
            {children}
          </PaymentProvider>
        </FinanceProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
