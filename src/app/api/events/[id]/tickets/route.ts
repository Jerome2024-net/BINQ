import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/api-auth";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/events/[id]/tickets — Liste des billets d'un événement (organisateur)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const { id } = params;

    // Vérifier que l'événement appartient à l'utilisateur
    const { data: event } = await supabase
      .from("events")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const statut = searchParams.get("statut");

    let query = supabase
      .from("tickets")
      .select("*, ticket_types(nom, prix)")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (statut) query = query.eq("statut", statut);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
