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

// PUT /api/events/[id] — Modifier un événement (+ ticket_types)
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

    // Mettre à jour l'événement
    const updates: any = { updated_at: new Date().toISOString() };
    const fields = ["nom", "description", "date_debut", "heure_debut", "date_fin", "heure_fin", "lieu", "adresse", "ville", "logo_url", "cover_url", "is_active", "is_published"];
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f];
    }

    const { error: updateError } = await supabase
      .from("events")
      .update(updates)
      .eq("id", id);

    if (updateError) throw updateError;

    // Mettre à jour les ticket_types si fournis
    if (body.ticket_types && Array.isArray(body.ticket_types)) {
      for (const tt of body.ticket_types) {
        if (tt.id) {
          // Modifier un type existant
          const ttUpdates: any = {};
          if (tt.nom !== undefined) ttUpdates.nom = tt.nom;
          if (tt.prix !== undefined) ttUpdates.prix = parseFloat(tt.prix) || 0;
          if (tt.quantite_total !== undefined) ttUpdates.quantite_total = parseInt(tt.quantite_total) || 100;
          if (tt.is_active !== undefined) ttUpdates.is_active = tt.is_active;
          if (tt.description !== undefined) ttUpdates.description = tt.description;
          if (Object.keys(ttUpdates).length > 0) {
            await supabase.from("ticket_types").update(ttUpdates).eq("id", tt.id).eq("event_id", id);
          }
        } else if (tt.nom) {
          // Ajouter un nouveau type
          const { data: existingTypes } = await supabase
            .from("ticket_types")
            .select("ordre")
            .eq("event_id", id)
            .order("ordre", { ascending: false })
            .limit(1);
          const nextOrdre = (existingTypes?.[0]?.ordre || 0) + 1;
          await supabase.from("ticket_types").insert({
            event_id: id,
            nom: tt.nom,
            prix: parseFloat(tt.prix) || 0,
            quantite_total: parseInt(tt.quantite_total) || 100,
            devise: body.devise || "XOF",
            ordre: nextOrdre,
          });
        }
      }

      // Supprimer les types marqués pour suppression
      if (body.delete_ticket_type_ids && Array.isArray(body.delete_ticket_type_ids)) {
        for (const ttId of body.delete_ticket_type_ids) {
          // Ne supprimer que si aucun billet vendu
          const { count } = await supabase
            .from("tickets")
            .select("*", { count: "exact", head: true })
            .eq("ticket_type_id", ttId);
          if (!count || count === 0) {
            await supabase.from("ticket_types").delete().eq("id", ttId).eq("event_id", id);
          }
        }
      }
    }

    // Retourner l'événement mis à jour
    const { data, error: fetchError } = await supabase
      .from("events")
      .select("*, ticket_types(*)")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (data?.ticket_types) {
      data.ticket_types.sort((a: any, b: any) => a.ordre - b.ordre);
    }

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

    // Vérifier que l'utilisateur est le propriétaire
    const { data: event } = await supabase
      .from("events")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé ou non autorisé" }, { status: 404 });
    }

    // Supprimer dans l'ordre: tickets → ticket_types → scan_team → event
    await supabase.from("tickets").delete().eq("event_id", id);
    await supabase.from("ticket_types").delete().eq("event_id", id);
    await supabase.from("scan_team").delete().eq("event_id", id);

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
