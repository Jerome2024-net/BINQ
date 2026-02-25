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
    icon: "https://res.cloudinary.com/dn8ed1doa/image/upload/ChatGPT_Image_24_f%C3%A9vr._2026_18_41_17_iwqq1o",
    apple: "https://res.cloudinary.com/dn8ed1doa/image/upload/ChatGPT_Image_24_f%C3%A9vr._2026_18_41_17_iwqq1o",
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
