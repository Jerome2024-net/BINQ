import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAndDecodeOrder } from "@/lib/fedapay";
import { fulfillTicketOrder } from "@/lib/ticket-fulfillment";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/fedapay/verify — Vérifier le paiement FedaPay et retourner les billets
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data: encoded, signature, transaction_id } = body;

    if (!encoded || !signature) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const orderData = verifyAndDecodeOrder(encoded, signature);
    if (!orderData) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 403 });
    }

    if (!transaction_id) {
      return NextResponse.json({ error: "transaction_id manquant" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data: pendingOrder } = await supabase
      .from("pending_ticket_orders")
      .select("status")
      .eq("transaction_id", String(transaction_id))
      .single();

    if (!pendingOrder) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    if (pendingOrder.status !== "completed") {
      return NextResponse.json(
        { error: "Paiement non confirmé", payment_status: pendingOrder.status },
        { status: 402 }
      );
    }

    const { tickets, already_created } = await fulfillTicketOrder(
      orderData,
      String(transaction_id)
    );

    return NextResponse.json(
      { tickets, already_created },
      { status: already_created ? 200 : 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    console.error("FedaPay verify error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
