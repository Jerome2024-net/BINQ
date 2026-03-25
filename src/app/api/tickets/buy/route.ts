import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  signOrderData,
  isCinetPayConfigured,
  createCinetPayPayment,
  generateTransactionId,
  type OrderData,
} from "@/lib/cinetpay";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function generateReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "BQ-";
  for (let i = 0; i < 8; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

function generateQR(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/tickets/buy — Acheter un billet (gratuit = direct, payant = FedaPay ou fallback dev)
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await req.json();

    const { ticket_type_id, buyer_name, buyer_email, buyer_phone, quantite } = body;

    if (!ticket_type_id || !buyer_name?.trim()) {
      return NextResponse.json({ error: "Type de billet et nom requis" }, { status: 400 });
    }

    const qty = parseInt(quantite) || 1;

    // Récupérer le type de billet + événement
    const { data: ticketType, error: ttError } = await supabase
      .from("ticket_types")
      .select("*, events(*)")
      .eq("id", ticket_type_id)
      .single();

    if (ttError || !ticketType) {
      return NextResponse.json({ error: "Type de billet non trouvé" }, { status: 404 });
    }

    if (!ticketType.is_active) {
      return NextResponse.json({ error: "Ce type de billet n'est plus disponible" }, { status: 400 });
    }

    if (!ticketType.events?.is_active || !ticketType.events?.is_published) {
      return NextResponse.json({ error: "Événement non disponible" }, { status: 400 });
    }

    // Vérifier stock
    const remaining = ticketType.quantite_total - ticketType.quantite_vendue;
    if (qty > remaining) {
      return NextResponse.json({ error: `Plus que ${remaining} billet(s) disponible(s)` }, { status: 400 });
    }

    if (qty > ticketType.max_par_personne) {
      return NextResponse.json({ error: `Maximum ${ticketType.max_par_personne} billet(s) par personne` }, { status: 400 });
    }

    const montant_total = ticketType.prix * qty;

    // ═══ Billet payant + CinetPay configuré → rediriger vers paiement ═══
    if (montant_total > 0 && isCinetPayConfigured()) {
      try {
        const orderData: OrderData = {
          ticket_type_id,
          buyer_name: buyer_name.trim(),
          buyer_email: buyer_email?.trim() || undefined,
          buyer_phone: buyer_phone?.trim() || undefined,
          qty,
          event_id: ticketType.events.id,
          montant_total,
          devise: ticketType.devise || "XOF",
        };

        const { encoded, signature } = signOrderData(orderData);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        const transactionId = generateTransactionId();
        const returnUrl = `${appUrl}/payment/ticket-success?d=${encoded}&s=${signature}&transaction_id=${transactionId}`;
        const notifyUrl = `${appUrl}/api/webhooks/cinetpay`;

        // Montant CinetPay doit être un multiple de 5
        const cinetPayAmount = Math.ceil(montant_total / 5) * 5;

        const { payment_url } = await createCinetPayPayment({
          transaction_id: transactionId,
          amount: cinetPayAmount,
          currency: ticketType.devise || "XOF",
          description: `Billet ${ticketType.events.nom}${qty > 1 ? ` x${qty}` : ""}`,
          return_url: returnUrl,
          notify_url: notifyUrl,
          customer_name: buyer_name.trim(),
          customer_email: buyer_email?.trim() || undefined,
          customer_phone_number: buyer_phone?.trim() || undefined,
        });

        return NextResponse.json({
          requires_payment: true,
          payment_url,
          transaction_id: transactionId,
        });
      } catch (cinetErr) {
        console.error("CinetPay error, falling back to direct creation:", cinetErr);
        // Fallback: créer les billets directement si CinetPay échoue
      }
    }

    // ═══ Création directe (gratuit, FedaPay non configuré, ou fallback) ═══
    const tickets = [];
    for (let i = 0; i < qty; i++) {
      tickets.push({
        ticket_type_id,
        event_id: ticketType.events.id,
        buyer_name: buyer_name.trim(),
        buyer_email: buyer_email?.trim() || null,
        buyer_phone: buyer_phone?.trim() || null,
        qr_code: generateQR(),
        reference: generateReference(),
        quantite: 1,
        montant_total: ticketType.prix,
        devise: ticketType.devise,
        statut: "valid",
      });
    }

    const { data: createdTickets, error: ticketError } = await supabase
      .from("tickets")
      .insert(tickets)
      .select();

    if (ticketError) throw ticketError;

    // Mettre à jour quantité vendue
    const { error: updateError } = await supabase
      .from("ticket_types")
      .update({ quantite_vendue: ticketType.quantite_vendue + qty })
      .eq("id", ticket_type_id);

    if (updateError) console.error("Update ticket_type qty error:", updateError);

    // Mettre à jour les stats de l'événement
    await supabase
      .from("events")
      .update({
        total_vendu: (ticketType.events.total_vendu || 0) + qty,
        revenus: (parseFloat(ticketType.events.revenus) || 0) + montant_total,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketType.events.id);

    return NextResponse.json({
      tickets: createdTickets,
      montant_total,
      devise: ticketType.devise,
    }, { status: 201 });
  } catch (err: any) {
    console.error("Ticket buy error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
