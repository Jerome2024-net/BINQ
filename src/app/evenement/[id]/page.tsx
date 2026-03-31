import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import EventPageClient from "./EventPageClient";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const supabase = getServiceClient();
    const { data: event } = await supabase
      .from("events")
      .select("nom, description, lieu, ville, date_debut, heure_debut, cover_url, logo_url")
      .eq("id", params.id)
      .eq("is_published", true)
      .eq("is_active", true)
      .single();

    if (!event) {
      return { title: "Événement — Binq" };
    }

    const dateStr = new Date(event.date_debut + "T00:00:00").toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const lieu = [event.lieu, event.ville].filter(Boolean).join(", ");
    const description = event.description
      ? event.description.slice(0, 155) + (event.description.length > 155 ? "..." : "")
      : `${dateStr} — ${lieu}`;

    const images = event.cover_url ? [event.cover_url] : event.logo_url ? [event.logo_url] : [];

    return {
      title: `${event.nom} — Binq`,
      description,
      openGraph: {
        title: event.nom,
        description: `📅 ${dateStr}${event.heure_debut ? ` à ${event.heure_debut.slice(0, 5)}` : ""}\n📍 ${lieu}`,
        images,
        type: "website",
        siteName: "Binq",
      },
      twitter: {
        card: images.length > 0 ? "summary_large_image" : "summary",
        title: event.nom,
        description,
        images,
      },
    };
  } catch {
    return { title: "Événement — Binq" };
  }
}

export default function EvenementPage() {
  return <EventPageClient />;
}
