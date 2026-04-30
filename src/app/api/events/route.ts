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

// GET /api/events — Liste des événements de l'organisateur
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const { searchParams } = new URL(req.url);
    const boutique_id = searchParams.get("boutique_id");

    let query = supabase
      .from("events")
      .select("*, ticket_types(*)")
      .eq("user_id", user.id)
      .order("date_debut", { ascending: true });

    if (boutique_id) query = query.eq("boutique_id", boutique_id);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/events — Créer un événement
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const body = await req.json();

    const { nom, description, date_debut, heure_debut, date_fin, heure_fin, lieu, adresse, ville, boutique_id, devise, ticket_types, categorie_id, is_published } = body;

    if (!nom?.trim() || !date_debut || !lieu?.trim() || !boutique_id) {
      return NextResponse.json({ error: "Nom, date, lieu et boutique requis" }, { status: 400 });
    }

    // Vérifier que la boutique appartient à l'utilisateur
    const { data: boutique } = await supabase
      .from("boutiques")
      .select("id")
      .eq("id", boutique_id)
      .eq("user_id", user.id)
      .single();

    if (!boutique) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    // Créer l'événement
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        boutique_id,
        user_id: user.id,
        nom: nom.trim(),
        description: description?.trim() || null,
        date_debut,
        heure_debut: heure_debut || null,
        date_fin: date_fin || null,
        heure_fin: heure_fin || null,
        lieu: lieu.trim(),
        adresse: adresse?.trim() || null,
        ville: ville?.trim() || null,
        devise: devise || "XOF",
        categorie_id: categorie_id || null,
        is_published: is_published === false ? false : true,
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // Créer les types de billets
    if (ticket_types && ticket_types.length > 0) {
      const types = ticket_types.map((t: any, i: number) => ({
        event_id: event.id,
        nom: t.nom?.trim() || "Standard",
        description: t.description?.trim() || null,
        prix: parseFloat(t.prix) || 0,
        devise: devise || "XOF",
        quantite_total: parseInt(t.quantite_total) || 100,
        max_par_personne: parseInt(t.max_par_personne) || 5,
        ordre: i,
      }));

      const { error: typesError } = await supabase.from("ticket_types").insert(types);
      if (typesError) throw typesError;
    }

    // Recharger avec les ticket_types
    const { data: full } = await supabase
      .from("events")
      .select("*, ticket_types(*)")
      .eq("id", event.id)
      .single();

    return NextResponse.json(full, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
