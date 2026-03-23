import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  verifyAndDecodeOrder,
  initFedaPay,
  isFedaPayConfigured,
  generatePaymentRef,
  generateQR,
} from "@/lib/fedapay";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/fedapay/verify — Vérifier le paiement et créer les billets
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data: encoded, signature, transaction_id } = body;

    if (!encoded || !signature) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // ═══ Vérifier la signature HMAC ═══
    const orderData = verifyAndDecodeOrder(encoded, signature);
    if (!orderData) {
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 403 }
      );
    }

    // ═══ Vérifier le paiement FedaPay ═══
    if (transaction_id && isFedaPayConfigured()) {
      await initFedaPay();
      const { Transaction } = await import("fedapay");
      const transaction = await Transaction.retrieve(transaction_id);

      if (!transaction.wasPaid()) {
        return NextResponse.json(
          {
            error: "Paiement non confirmé",
            payment_status: transaction.status,
          },
          { status: 402 }
        );
      }

      // Vérifier que le montant correspond
      if (parseInt(transaction.amount) !== orderData.montant_total) {
        return NextResponse.json(
          { error: "Montant invalide" },
          { status: 400 }
        );
      }
    }

    const supabase = getServiceClient();
    const txRef = String(transaction_id || "direct");

    // ═══ Idempotence — vérifier si les billets existent déjà ═══
    const firstRef = generatePaymentRef(txRef, 0);
    const { data: existingTickets } = await supabase
      .from("tickets")
      .select("*")
      .eq("reference", firstRef);

    if (existingTickets && existingTickets.length > 0) {
      // Déjà créés → renvoyer tous les billets de cette transaction
      const refs = Array.from({ length: orderData.qty }, (_, i) =>
        generatePaymentRef(txRef, i)
      );
      const { data: allTickets } = await supabase
        .from("tickets")
        .select("*")
        .in("reference", refs);
      return NextResponse.json({
        tickets: allTickets,
        already_created: true,
      });
    }

    // ═══ Vérifier que le type de billet existe encore ═══
    const { data: ticketType } = await supabase
      .from("ticket_types")
      .select("*, events(*)")
      .eq("id", orderData.ticket_type_id)
      .single();

    if (!ticketType) {
      return NextResponse.json(
        { error: "Type de billet non trouvé" },
        { status: 404 }
      );
    }

    // ═══ Créer les billets ═══
    const tickets = [];
    for (let i = 0; i < orderData.qty; i++) {
      tickets.push({
        ticket_type_id: orderData.ticket_type_id,
        event_id: orderData.event_id,
        buyer_name: orderData.buyer_name,
        buyer_email: orderData.buyer_email || null,
        buyer_phone: orderData.buyer_phone || null,
        qr_code: generateQR(),
        reference: generatePaymentRef(txRef, i),
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

    // ═══ Mettre à jour les stats ═══
    await supabase
      .from("ticket_types")
      .update({ quantite_vendue: ticketType.quantite_vendue + orderData.qty })
      .eq("id", orderData.ticket_type_id);

    await supabase
      .from("events")
      .update({
        total_vendu: (ticketType.events.total_vendu || 0) + orderData.qty,
        revenus:
          (parseFloat(ticketType.events.revenus) || 0) +
          orderData.montant_total,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderData.event_id);

    return NextResponse.json({ tickets: createdTickets }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    console.error("FedaPay verify error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
