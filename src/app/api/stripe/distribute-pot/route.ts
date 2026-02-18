import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { distributePotSchema, validateBody } from "@/lib/validations";

/**
 * POST /api/stripe/distribute-pot
 * Transfère les fonds du pot vers le compte Stripe Connect du bénéficiaire
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateBody(distributePotSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { amount, currency, destinationAccountId, tontineNom, tourNumero } = validation.data;
    const cur = currency;
    const amountInCents = Math.round(amount * 100);

    // Vérifier que le compte destination est actif
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(destinationAccountId);
    if (!account.charges_enabled || !account.payouts_enabled) {
      return NextResponse.json(
        { error: "Le compte du bénéficiaire n'est pas encore vérifié. Il doit compléter l'onboarding Stripe." },
        { status: 400 }
      );
    }

    // Transférer les fonds vers le compte Connect du bénéficiaire
    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: cur,
      destination: destinationAccountId,
      description: `Pot tontine - ${tontineNom} (Tour ${tourNumero})`,
      metadata: {
        type: "distribution_pot",
        tontineNom: tontineNom || "",
        tourNumero: String(tourNumero || 0),
        app: "binq",
      },
    });

    return NextResponse.json({
      transferId: transfer.id,
      amount: transfer.amount / 100,
      currency: transfer.currency,
      destination: transfer.destination,
    });
  } catch (error) {
    console.error("Erreur distribution pot:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
