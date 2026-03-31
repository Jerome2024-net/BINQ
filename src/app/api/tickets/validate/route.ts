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

// POST /api/tickets/validate — Scanner et valider un billet
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const { qr_code } = await req.json();

    if (!qr_code?.trim()) {
      return NextResponse.json({ error: "Code QR requis" }, { status: 400 });
    }

    // Trouver le billet
    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("*, ticket_types(nom, prix), events(id, nom, user_id, date_debut, lieu)")
      .eq("qr_code", qr_code.trim())
      .single();

    if (error || !ticket) {
      return NextResponse.json({ 
        valid: false, 
        error: "Billet non trouvé",
        status_code: "NOT_FOUND" 
      }, { status: 404 });
    }

    // Vérifier que l'utilisateur est l'organisateur ou membre de l'équipe de scan
    if (ticket.events?.user_id !== user.id) {
      const { data: teamMember } = await supabase
        .from("scan_team")
        .select("id")
        .eq("event_id", ticket.events?.id)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!teamMember) {
        return NextResponse.json({ 
          valid: false, 
          error: "Vous n'êtes pas autorisé à scanner pour cet événement",
          status_code: "UNAUTHORIZED" 
        }, { status: 403 });
      }
    }

    // Vérifier le statut
    if (ticket.statut === "used") {
      return NextResponse.json({
        valid: false,
        error: "Billet déjà utilisé",
        status_code: "ALREADY_USED",
        ticket: {
          reference: ticket.reference,
          buyer_name: ticket.buyer_name,
          buyer_phone: ticket.buyer_phone,
          type: ticket.ticket_types?.nom,
          event: ticket.events?.nom,
          scanned_at: ticket.scanned_at,
        },
      });
    }

    if (ticket.statut === "cancelled") {
      return NextResponse.json({
        valid: false,
        error: "Billet annulé",
        status_code: "CANCELLED",
        ticket: { reference: ticket.reference, buyer_name: ticket.buyer_name },
      });
    }

    if (ticket.statut === "expired") {
      return NextResponse.json({
        valid: false,
        error: "Billet expiré",
        status_code: "EXPIRED",
        ticket: { reference: ticket.reference, buyer_name: ticket.buyer_name },
      });
    }

    // Valider le billet
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        statut: "used",
        scanned_at: now,
        scanned_by: user.id,
      })
      .eq("id", ticket.id);

    if (updateError) throw updateError;

    // Compter les entrées pour cet événement
    const { count: entryCount } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("event_id", ticket.events?.id)
      .eq("statut", "used");

    const { count: totalSold } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("event_id", ticket.events?.id)
      .in("statut", ["valid", "used"]);

    return NextResponse.json({
      valid: true,
      status_code: "VALID",
      ticket: {
        id: ticket.id,
        reference: ticket.reference,
        buyer_name: ticket.buyer_name,
        buyer_phone: ticket.buyer_phone,
        type: ticket.ticket_types?.nom,
        event: ticket.events?.nom,
        prix: ticket.ticket_types?.prix,
        devise: ticket.devise,
        scanned_at: now,
        entry_number: entryCount || 1,
        total_sold: totalSold || 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
