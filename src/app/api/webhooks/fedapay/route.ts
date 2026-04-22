import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fulfillTicketOrder } from "@/lib/ticket-fulfillment";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function extractTransactionId(body: any): string | null {
  const tx =
    body?.entity?.metadata?.transaction_id ||
    body?.data?.entity?.metadata?.transaction_id ||
    body?.metadata?.transaction_id ||
    body?.transaction_id ||
    body?.reference ||
    null;
  return tx ? String(tx) : null;
}

function extractStatus(body: any): string {
  return String(
    body?.entity?.status ||
      body?.data?.entity?.status ||
      body?.status ||
      body?.payment_status ||
      "unknown"
  ).toLowerCase();
}

function isPaidStatus(status: string): boolean {
  return ["approved", "paid", "successful", "completed"].includes(status);
}

// POST /api/webhooks/fedapay — Notification FedaPay
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transactionId = extractTransactionId(body);

    if (!transactionId) {
      console.error("FedaPay webhook: transaction_id manquant");
      return NextResponse.json({ received: true });
    }

    const status = extractStatus(body);
    if (!isPaidStatus(status)) {
      console.log(
        `FedaPay webhook: paiement ${transactionId} non confirmé (status: ${status})`
      );
      return NextResponse.json({ received: true });
    }

    const supabase = getServiceClient();

    const { data: pendingOrder } = await supabase
      .from("pending_ticket_orders")
      .select("*")
      .eq("transaction_id", transactionId)
      .single();

    if (!pendingOrder) {
      console.log(`FedaPay webhook: aucune commande pending pour ${transactionId}`);
      return NextResponse.json({ received: true });
    }

    if (pendingOrder.status === "completed") {
      console.log(`FedaPay webhook: commande ${transactionId} déjà traitée`);
      return NextResponse.json({ received: true, already_processed: true });
    }

    const { tickets, already_created } = await fulfillTicketOrder(
      pendingOrder.order_data,
      transactionId
    );

    console.log(
      `FedaPay webhook: ${already_created ? "tickets déjà existants" : `${tickets.length} tickets créés`} pour ${transactionId}`
    );

    return NextResponse.json({
      received: true,
      payment_confirmed: true,
      tickets_created: tickets.length,
      already_created,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("FedaPay webhook error:", err);
    return NextResponse.json({ error: message }, { status: 200 });
  }
}
