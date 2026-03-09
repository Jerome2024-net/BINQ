import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createPayoutSchema, validateBody } from "@/lib/validations";

/**
 * POST /api/stripe/create-payout
 * Crée un Payout depuis un compte Connect vers le compte bancaire externe de l'utilisateur
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateBody(createPayoutSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { amount, currency, stripeAccountId } = validation.data;
    const accountId = stripeAccountId;
    const cur = currency;
    const amountInCents = Math.round(amount * 100);

    // Vérifier le solde disponible sur le compte Connect
    const stripe = getStripe();
    const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
    const availableAmount = balance.available.reduce((sum, b) => sum + b.amount, 0);

    if (availableAmount < amountInCents) {
      return NextResponse.json(
        { error: `Solde Stripe insuffisant. Disponible: ${(availableAmount / 100).toFixed(2)} ${cur.toUpperCase()}` },
        { status: 400 }
      );
    }

    // Créer le payout vers le compte bancaire
    const payout = await stripe.payouts.create(
      {
        amount: amountInCents,
        currency: cur,
        description: "Retrait Binq",
        metadata: {
          type: "retrait",
          app: "binq",
        },
      },
      { stripeAccount: accountId }
    );

    return NextResponse.json({
      payoutId: payout.id,
      amount: payout.amount / 100,
      currency: payout.currency,
      status: payout.status,
      arrivalDate: payout.arrival_date,
    });
  } catch (error) {
    console.error("Erreur payout:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
