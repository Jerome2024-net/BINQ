import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createCotisationSchema, validateBody } from "@/lib/validations";

/**
 * POST /api/stripe/create-cotisation
 * Crée un PaymentIntent pour une cotisation de tontine
 * L'argent va vers le compte plateforme avec une application_fee
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateBody(createCotisationSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { amount, currency, tontineId, tontineNom, tourId, tourNumero } = validation.data;
    const cur = currency;
    const amountInCents = Math.round(amount * 100);
    if (amountInCents < 50) {
      return NextResponse.json({ error: "Le montant minimum est de 0,50 €/$" }, { status: 400 });
    }

    // Calculer les frais plateforme (1% participant)
    const applicationFee = Math.round(amountInCents * 0.01);

    // Créer le PaymentIntent avec application_fee_amount
    // L'argent arrive sur le compte plateforme, les frais sont prélevés automatiquement
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: cur,
      description: `Cotisation - ${tontineNom} (Tour ${tourNumero})`,
      automatic_payment_methods: { enabled: true },
      application_fee_amount: applicationFee,
      metadata: {
        type: "cotisation",
        tontineId: tontineId || "",
        tontineNom: tontineNom || "",
        tourId: tourId || "",
        tourNumero: String(tourNumero || 0),
        payerUserId: user.id,
        applicationFee: String(applicationFee),
        app: "binq",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      applicationFee: applicationFee / 100,
    });
  } catch (error) {
    console.error("Erreur PaymentIntent cotisation:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
