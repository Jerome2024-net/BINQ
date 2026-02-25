import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import NavigationProgress from "@/components/NavigationProgress";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Binq - Votre Wallet Complet",
  description:
    "Envoyez, recevez, déposez et retirez votre argent en toute sécurité. Portefeuille multi-devises, transferts P2P, liens de paiement et coffres.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%234f8fff'/><stop offset='100%25' stop-color='%232563eb'/></linearGradient></defs><polygon points='50,5 63,35 95,38 71,60 78,92 50,76 22,92 29,60 5,38 37,35' fill='url(%23g)'/></svg>",
    apple: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%234f8fff'/><stop offset='100%25' stop-color='%232563eb'/></linearGradient></defs><polygon points='50,5 63,35 95,38 71,60 78,92 50,76 22,92 29,60 5,38 37,35' fill='url(%23g)'/></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          <NavigationProgress />
          {children}
        </Providers>
      </body>
    </html>
  );
}
