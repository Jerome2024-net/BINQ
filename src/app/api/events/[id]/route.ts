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

// GET /api/events/[id] — Détail d'un événement (public si publié, ou propriétaire)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getServiceClient();
    const { id } = params;

    const { data: event, error } = await supabase
      .from("events")
      .select(`
        *,
        ticket_types(*)
      `)
      .eq("id", id)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    // Si pas publié, vérifier que c'est le propriétaire
    if (!event.is_published || !event.is_active) {
      const user = await getAuthenticatedUser();
      if (!user || user.id !== event.user_id) {
        return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
      }
    }

    // Trier les ticket_types par ordre
    if (event.ticket_types) {
      event.ticket_types.sort((a: any, b: any) => a.ordre - b.ordre);
    }

    return NextResponse.json(event);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/events/[id] — Modifier un événement
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const { id } = params;
    const body = await req.json();

    // Vérifier propriété
    const { data: existing } = await supabase
      .from("events")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    const fields = ["nom", "description", "date_debut", "heure_debut", "date_fin", "heure_fin", "lieu", "adresse", "ville", "cover_url", "is_active", "is_published"];
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f];
    }

    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", id)
      .select("*, ticket_types(*)")
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/events/[id] — Supprimer un événement
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const { id } = params;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
