import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  verifyAndDecodeOrder,
  initFedaPay,
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

// POST /api/webhooks/fedapay — Webhook FedaPay (transaction.approved, etc.)
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("x-fedapay-signature") || "";

    // ═══ Vérifier la signature du webhook ═══
    if (process.env.FEDAPAY_WEBHOOK_SECRET) {
      await initFedaPay();
      const { Webhook } = await import("fedapay");
      try {
        Webhook.constructEvent(
          rawBody,
          sig,
          process.env.FEDAPAY_WEBHOOK_SECRET
        );
      } catch {
        console.error("FedaPay webhook: signature invalide");
        return NextResponse.json(
          { error: "Signature invalide" },
          { status: 400 }
        );
      }
    }

    const event = JSON.parse(rawBody);
    const eventName = event.name || event.type || "";
    const entity = event.entity || event.data?.object || {};

    // Ignorer les événements non-approved
    if (!eventName.includes("approved") && entity.status !== "approved") {
      return NextResponse.json({ received: true });
    }

    const transactionId = entity.id;
    const callbackUrl = entity.callback_url || "";

    // ═══ Extraire les données de commande du callback_url ═══
    let encoded: string | null = null;
    let signature: string | null = null;

    try {
      const url = new URL(callbackUrl);
      encoded = url.searchParams.get("d");
      signature = url.searchParams.get("s");
    } catch {
      console.error("FedaPay webhook: callback_url invalide:", callbackUrl);
      return NextResponse.json({ received: true });
    }

    if (!encoded || !signature) {
      console.error("FedaPay webhook: données ordre manquantes dans callback_url");
      return NextResponse.json({ received: true });
    }

    const orderData = verifyAndDecodeOrder(encoded, signature);
    if (!orderData) {
      console.error("FedaPay webhook: signature ordre invalide");
      return NextResponse.json({ received: true });
    }

    const supabase = getServiceClient();
    const txRef = String(transactionId);

    // ═══ Idempotence ═══
    const firstRef = generatePaymentRef(txRef, 0);
    const { data: existingTickets } = await supabase
      .from("tickets")
      .select("id")
      .eq("reference", firstRef);

    if (existingTickets && existingTickets.length > 0) {
      return NextResponse.json({
        received: true,
        already_processed: true,
      });
    }

    // ═══ Récupérer le type de billet ═══
    const { data: ticketType } = await supabase
      .from("ticket_types")
      .select("*, events(*)")
      .eq("id", orderData.ticket_type_id)
      .single();

    if (!ticketType) {
      console.error(
        "FedaPay webhook: ticket type non trouvé:",
        orderData.ticket_type_id
      );
      return NextResponse.json({ received: true });
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

    const { error: ticketError } = await supabase
      .from("tickets")
      .insert(tickets);

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

    console.log(
      `FedaPay webhook: ${orderData.qty} billet(s) créé(s) pour transaction ${transactionId}`
    );

    return NextResponse.json({
      received: true,
      tickets_created: orderData.qty,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("FedaPay webhook error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
