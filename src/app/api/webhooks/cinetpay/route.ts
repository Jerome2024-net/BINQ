import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  verifyCinetPayPayment,
  generatePaymentRef,
  generateQR,
} from "@/lib/cinetpay";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/webhooks/cinetpay — Notification CinetPay (notify_url)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // CinetPay envoie: cpm_trans_id, cpm_site_id, cpm_trans_date, cpm_amount, etc.
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

    // ═══ Idempotence ═══
    const firstRef = generatePaymentRef(transactionId, 0);
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

    // ═══ Chercher la commande en attente via metadata ou pending_orders ═══
    // On cherche les tickets qui correspondent à cette transaction
    // Le webhook est un filet de sécurité — le frontend /verify crée normalement les billets
    // Si les billets n'existent pas encore, on les créera via le endpoint /verify
    // quand le client sera redirigé

    console.log(
      `CinetPay webhook: paiement ${transactionId} confirmé (${result.amount} ${result.payment_method})`
    );

    return NextResponse.json({
      received: true,
      payment_confirmed: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("CinetPay webhook error:", err);
    // Toujours renvoyer 200 pour que CinetPay ne re-tente pas indéfiniment
    return NextResponse.json({ error: message }, { status: 200 });
  }
}
