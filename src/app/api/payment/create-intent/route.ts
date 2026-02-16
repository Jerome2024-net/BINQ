import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency, description } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Montant invalide" },
        { status: 400 }
      );
    }

    const validCurrencies = ["eur", "usd"];
    const cur = (currency || "eur").toLowerCase();
    if (!validCurrencies.includes(cur)) {
      return NextResponse.json(
        { error: `Devise non supportée. Devises acceptées: ${validCurrencies.join(", ")}` },
        { status: 400 }
      );
    }

    // Stripe utilise les centimes (1€ = 100 centimes)
    const amountInCents = Math.round(amount * 100);

    if (amountInCents < 50) {
      return NextResponse.json(
        { error: "Le montant minimum est de 0,50 €/$" },
        { status: 400 }
      );
    }

    // Créer le PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: cur,
      description: description || "Dépôt portefeuille Binq",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: "depot",
        app: "binq",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Erreur Stripe PaymentIntent:", error);
    const message =
      error instanceof Error ? error.message : "Erreur serveur Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
