import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/tickets/[code] — Détail d'un billet par QR code
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const supabase = getServiceClient();
    const { code } = params;

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(`
        *,
        ticket_types(nom, description, prix),
        events(id, nom, description, date_debut, heure_debut, date_fin, lieu, adresse, ville, logo_url, cover_url, devise)
      `)
      .eq("qr_code", code)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: "Billet non trouvé" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
