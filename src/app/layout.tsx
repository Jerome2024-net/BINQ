import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import NavigationProgress from "@/components/NavigationProgress";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Binq - Billetterie & Événements",
  description:
    "Chaque produit devient un terminal de paiement. Creez votre boutique, partagez vos QR, encaissez par carte et mobile money.",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%233b82f6'/><stop offset='100%25' stop-color='%232563eb'/></linearGradient></defs><rect width='100' height='100' rx='22' fill='url(%23g)'/><polygon points='50,15 58.5,38.2 83,38.2 63.2,53.5 71.5,77 50,62 28.5,77 36.8,53.5 17,38.2 41.5,38.2' fill='white'/></svg>",
    apple: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%233b82f6'/><stop offset='100%25' stop-color='%232563eb'/></linearGradient></defs><rect width='100' height='100' rx='22' fill='url(%23g)'/><polygon points='50,15 58.5,38.2 83,38.2 63.2,53.5 71.5,77 50,62 28.5,77 36.8,53.5 17,38.2 41.5,38.2' fill='white'/></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <Providers>
          <NavigationProgress />
          {children}
        </Providers>
      </body>
    </html>
  );
}
