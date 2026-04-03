import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorer les événements à Cotonou | Binq",
  description:
    "Découvrez les événements les plus populaires à Cotonou. Concerts, soirées, conférences et plus encore. Ne manquez rien avec Binq.",
  openGraph: {
    title: "Explorer les événements à Cotonou | Binq",
    description:
      "Découvrez les événements les plus populaires à Cotonou. Concerts, soirées, conférences et plus encore.",
    type: "website",
    url: "/explorer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explorer les événements à Cotonou | Binq",
    description:
      "Découvrez les événements les plus populaires à Cotonou.",
  },
};

export default function ExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
