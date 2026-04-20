import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyCinetPayPayment } from "@/lib/cinetpay";
import { fulfillTicketOrder } from "@/lib/ticket-fulfillment";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/webhooks/cinetpay — Notification CinetPay (notify_url)
// Filet de sécurité : crée les tickets même si le client ferme son navigateur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const transactionId =
      body.cpm_trans_id || body.transaction_id || body.cpm_custom;

    if (!transactionId) {
      console.error("CinetPay webhook: transaction_id manquant");
      return NextResponse.json({ received: true });
    }

    // ═══ Vérifier le paiement via l'API CinetPay /check ═══
    const result = await verifyCinetPayPayment(transactionId);

    if (!result.paid) {
      console.log(
        `CinetPay webhook: paiement ${transactionId} non accepté (status: ${result.status})`
      );
      return NextResponse.json({ received: true });
    }

    const supabase = getServiceClient();

    // ═══ Récupérer la commande en attente ═══
    const { data: pendingOrder } = await supabase
      .from("pending_ticket_orders")
      .select("*")
      .eq("transaction_id", transactionId)
      .single();

    if (!pendingOrder) {
      console.log(
        `CinetPay webhook: aucune commande pending pour ${transactionId}`
      );
      return NextResponse.json({ received: true });
    }

    if (pendingOrder.status === "completed") {
      console.log(
        `CinetPay webhook: commande ${transactionId} déjà traitée`
      );
      return NextResponse.json({ received: true, already_processed: true });
    }

    // ═══ Créer les tickets + créditer le wallet organisateur ═══
    const { tickets, already_created } = await fulfillTicketOrder(
      pendingOrder.order_data,
      transactionId
    );

    console.log(
      `CinetPay webhook: ${already_created ? "tickets déjà existants" : `${tickets.length} tickets créés`} pour ${transactionId} (${result.amount} ${result.payment_method})`
    );

    return NextResponse.json({
      received: true,
      payment_confirmed: true,
      tickets_created: tickets.length,
      already_created,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("CinetPay webhook error:", err);
    // Toujours renvoyer 200 pour que CinetPay ne re-tente pas indéfiniment
    return NextResponse.json({ error: message }, { status: 200 });
  }
}
