import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createIntentSchema, validateBody } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateBody(createIntentSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { amount, currency, description } = validation.data;
    const cur = currency;
    const amountInCents = Math.round(amount * 100);

    if (amountInCents < 50) {
      return NextResponse.json(
        { error: "Le montant minimum est de 0,50 €/$" },
        { status: 400 }
      );
    }

    // === FRAIS BINQ 1% ADDITIONNELS ===
    const TAUX_FRAIS_DEPOT = 0.01; // 1%
    const fraisInCents = Math.round(amountInCents * TAUX_FRAIS_DEPOT);
    const totalInCents = amountInCents + fraisInCents;

    // Créer le PaymentIntent avec userId pour traçabilité webhook
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalInCents, // Montant demandé + 1% de frais
      currency: cur,
      description: description || "Dépôt portefeuille Binq",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: "depot",
        userId: user.id,
        app: "binq",
        montant_demande: String(amountInCents), // Ce qui sera crédité (centimes)
        frais_binq: String(fraisInCents),        // Frais Binq (centimes)
        taux_frais: String(TAUX_FRAIS_DEPOT),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      montantDemande: amount,
      fraisBinq: fraisInCents / 100,
      totalFacture: totalInCents / 100,
    });
  } catch (error) {
    console.error("Erreur Stripe PaymentIntent:", error);
    const message =
      error instanceof Error ? error.message : "Erreur serveur Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
