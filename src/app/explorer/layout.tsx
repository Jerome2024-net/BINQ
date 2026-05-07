import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Binq Clients — Explorer produits et boutiques | Binq",
  description:
    "Explorez les produits, restaurants, boutiques et services disponibles sur Binq Clients avec paiement sécurisé et livraison locale.",
  openGraph: {
    title: "Binq Clients — Explorer produits et boutiques | Binq",
    description:
      "Explorez les produits, restaurants, boutiques et services disponibles sur Binq Clients.",
    type: "website",
    url: "/explorer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Binq Clients — Explorer produits et boutiques | Binq",
    description:
      "Explorez les produits, restaurants, boutiques et services disponibles sur Binq Clients.",
  },
};

export default function ExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
