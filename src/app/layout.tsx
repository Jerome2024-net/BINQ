import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import NavigationProgress from "@/components/NavigationProgress";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Binq - Marketplace & Paiement QR",
  description:
    "Encaissez vos clients via QR Code. Paiements par carte et mobile money. Marketplace intégrée pour le commerce africain.",
  manifest: "/manifest.json",
  themeColor: "#0a0a0a",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%2334d399'/><stop offset='100%25' stop-color='%2310b981'/></linearGradient></defs><polygon points='50,6 61.8,38.2 96,38.2 68.1,58.8 79.4,91 50,70.4 20.6,91 31.9,58.8 4,38.2 38.2,38.2' fill='url(%23g)'/></svg>",
    apple: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%2334d399'/><stop offset='100%25' stop-color='%2310b981'/></linearGradient></defs><polygon points='50,6 61.8,38.2 96,38.2 68.1,58.8 79.4,91 50,70.4 20.6,91 31.9,58.8 4,38.2 38.2,38.2' fill='url(%23g)'/></svg>",
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
