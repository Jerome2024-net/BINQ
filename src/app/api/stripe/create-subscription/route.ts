import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * POST /api/stripe/create-subscription
 * Crée un abonnement Stripe récurrent pour les organisateurs (180€/an)
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Chercher ou créer le client Stripe
    const stripe = getStripe();
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer = customers.data[0];

    if (!customer) {
      customer = await stripe.customers.create({
        email,
        metadata: { userId: user.id, app: "binq" },
      });
    }

    // Chercher ou créer le produit "Abonnement Organisateur"
    const products = await stripe.products.list({ limit: 100 });
    let product = products.data.find(
      (p) => p.metadata?.type === "abonnement_organisateur" && p.active
    );

    if (!product) {
      product = await stripe.products.create({
        name: "Abonnement Organisateur Binq",
        description: "Abonnement annuel pour créer et gérer des tontines",
        metadata: { type: "abonnement_organisateur", app: "binq" },
      });
    }

    // Chercher ou créer le prix (180 EUR/an)
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
    let price = prices.data.find(
      (p) => p.unit_amount === 18000 && p.currency === "eur" && p.recurring?.interval === "year"
    );

    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: 18000, // 180,00 €
        currency: "eur",
        recurring: { interval: "year" },
      });
    }

    // Créer une session Checkout pour l'abonnement
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      mode: "subscription",
      success_url: `${appUrl}/portefeuille?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/portefeuille?subscription=cancelled`,
      metadata: {
        userId: user.id,
        type: "abonnement_organisateur",
        app: "binq",
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          type: "abonnement_organisateur",
          app: "binq",
        },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Erreur création abonnement:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
