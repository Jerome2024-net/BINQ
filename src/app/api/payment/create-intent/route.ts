import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createIntentSchema, validateBody } from "@/lib/validations";
import { type DeviseCode, DEVISES, calcDepositStripeAmount, formatMontant } from "@/lib/currencies";

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

    const { amount, devise: walletDevise, description } = validation.data;
    const devise = (walletDevise && DEVISES[walletDevise as DeviseCode]) ? walletDevise as DeviseCode : "XOF";
    const deviseConfig = DEVISES[devise];

    // Vérifier montant minimum pour la devise
    if (amount < deviseConfig.minDeposit) {
      return NextResponse.json(
        { error: `Montant minimum : ${formatMontant(deviseConfig.minDeposit, devise)}` },
        { status: 400 }
      );
    }

    // Calculer montants : Stripe facture toujours en EUR
    const calc = calcDepositStripeAmount(amount, devise);
    const totalInCents = Math.round(calc.totalEur * 100);

    if (totalInCents < 50) {
      return NextResponse.json(
        { error: "Le montant est trop faible pour être traité" },
        { status: 400 }
      );
    }

    // Créer le PaymentIntent (toujours en EUR pour Stripe)
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalInCents,
      currency: "eur", // Stripe facture toujours en EUR
      description: description || `Dépôt portefeuille Binq (${devise})`,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: "depot",
        userId: user.id,
        app: "binq",
        devise, // Devise du wallet à créditer
        montant_demande: String(Math.round(calc.montantCredite * 100)), // Montant à créditer en centimes de la devise
        montant_eur_cents: String(Math.round(calc.montantEur * 100)), // Montant EUR avant frais
        frais_binq: String(Math.round(calc.fraisEur * 100)), // Frais en centimes EUR
        taux_frais: "0.01",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      devise,
      montantCredite: calc.montantCredite,
      montantEur: calc.montantEur,
      fraisBinq: calc.fraisEur,
      totalFacture: calc.totalEur,
    });
  } catch (error) {
    console.error("Erreur Stripe PaymentIntent:", error);
    const message =
      error instanceof Error ? error.message : "Erreur serveur Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
