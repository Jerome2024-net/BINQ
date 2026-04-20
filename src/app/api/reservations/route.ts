import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/api-auth";

function supabaseService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/reservations?boutique_id=... — réservations d'une boutique (owner)
export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseService();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const boutiqueId = req.nextUrl.searchParams.get("boutique_id");
    if (!boutiqueId) return NextResponse.json({ error: "boutique_id requis" }, { status: 400 });

    // Vérifier ownership
    const { data: boutique } = await supabase
      .from("boutiques")
      .select("id")
      .eq("id", boutiqueId)
      .eq("user_id", user.id)
      .single();

    if (!boutique) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const dateFilter = req.nextUrl.searchParams.get("date");
    let query = supabase
      .from("reservations")
      .select("*")
      .eq("boutique_id", boutiqueId)
      .order("date_reservation", { ascending: true })
      .order("heure_reservation", { ascending: true });

    if (dateFilter) {
      query = query.eq("date_reservation", dateFilter);
    }

    const { data: reservations, error } = await query;
    if (error) throw error;

    return NextResponse.json({ reservations: reservations || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/reservations — créer une réservation (public)
export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseService();
    const body = await req.json();
    const { boutique_id, client_nom, client_telephone, client_email, nombre_personnes, date_reservation, heure_reservation, notes, client_user_id } = body;

    if (!boutique_id || !client_nom || !client_telephone || !date_reservation || !heure_reservation) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Vérifier que la boutique existe
    const { data: boutique } = await supabase
      .from("boutiques")
      .select("id, nom")
      .eq("id", boutique_id)
      .eq("is_active", true)
      .single();

    if (!boutique) return NextResponse.json({ error: "Restaurant non trouvé" }, { status: 404 });

    // Vérifier que la date est dans le futur
    const reservDate = new Date(`${date_reservation}T${heure_reservation}`);
    if (reservDate < new Date()) {
      return NextResponse.json({ error: "La date de réservation doit être dans le futur" }, { status: 400 });
    }

    const { data: reservation, error } = await supabase
      .from("reservations")
      .insert({
        boutique_id,
        client_nom,
        client_telephone,
        client_email: client_email || null,
        client_user_id: client_user_id || null,
        nombre_personnes: parseInt(nombre_personnes) || 1,
        date_reservation,
        heure_reservation,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Notifier le restaurateur
    try {
      const { data: boutiqueOwner } = await supabase
        .from("boutiques")
        .select("user_id")
        .eq("id", boutique_id)
        .single();

      if (boutiqueOwner) {
        await supabase.from("notifications").insert({
          user_id: boutiqueOwner.user_id,
          titre: "Nouvelle réservation",
          message: `${client_nom} a réservé pour ${nombre_personnes} personne(s) le ${new Date(date_reservation).toLocaleDateString("fr-FR")} à ${heure_reservation}.`,
          type: "reservation",
        });
      }
    } catch { /* ignore */ }

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/reservations — mettre à jour le statut (owner)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = supabaseService();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { id, statut } = body;

    if (!id || !statut) return NextResponse.json({ error: "id et statut requis" }, { status: 400 });
    if (!["en_attente", "confirmee", "annulee", "terminee"].includes(statut)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    // Vérifier ownership
    const { data: reservation } = await supabase
      .from("reservations")
      .select("id, boutique:boutiques!inner(user_id), client_nom, client_telephone")
      .eq("id", id)
      .single();

    if (!reservation || (reservation as any).boutique?.user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("reservations")
      .update({ statut, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ reservation: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
