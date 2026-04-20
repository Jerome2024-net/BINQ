import { NextRequest, NextResponse } from "next/server";
import {
  verifyAndDecodeOrder,
  verifyCinetPayPayment,
  isCinetPayConfigured,
} from "@/lib/cinetpay";
import { fulfillTicketOrder } from "@/lib/ticket-fulfillment";

// POST /api/cinetpay/verify — Vérifier le paiement CinetPay et créer les billets
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

    // ═══ Vérifier le paiement CinetPay ═══
    if (transaction_id && isCinetPayConfigured()) {
      const result = await verifyCinetPayPayment(transaction_id);

      if (!result.paid) {
        return NextResponse.json(
          {
            error: "Paiement non confirmé",
            payment_status: result.status,
          },
          { status: 402 }
        );
      }

      // Vérifier que le montant correspond (prix + 10% frais, arrondi au multiple de 5)
      const fraisService = Math.ceil(orderData.montant_total * 0.1);
      const expectedAmount = Math.ceil((orderData.montant_total + fraisService) / 5) * 5;
      if (result.amount !== expectedAmount) {
        return NextResponse.json(
          { error: "Montant invalide" },
          { status: 400 }
        );
      }
    }

    // ═══ Créer les tickets + créditer le wallet organisateur ═══
    const { tickets, already_created } = await fulfillTicketOrder(
      orderData,
      String(transaction_id || "direct")
    );

    return NextResponse.json(
      { tickets, already_created },
      { status: already_created ? 200 : 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    console.error("CinetPay verify error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
