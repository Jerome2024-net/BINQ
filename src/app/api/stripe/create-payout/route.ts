import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createPayoutSchema, validateBody } from "@/lib/validations";
import { recordFee } from "@/lib/admin-fees";

const WITHDRAWAL_FEE_RATE = 0.015; // 1.5% withdrawal fee

/**
 * POST /api/stripe/create-payout
 * Crée un Payout depuis un compte Connect vers le compte bancaire externe de l'utilisateur
 * Frais de retrait : 1.5% déduits du montant
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

    // Calculate 1.5% fee
    const fraisBinq = Math.round(amount * WITHDRAWAL_FEE_RATE * 100) / 100;
    const montantNet = Math.round((amount - fraisBinq) * 100) / 100;
    const amountInCents = Math.round(montantNet * 100);

    if (amountInCents < 100) {
      return NextResponse.json(
        { error: "Le montant net après frais est trop faible (minimum 1€)" },
        { status: 400 }
      );
    }

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

    // Créer le payout vers le compte bancaire (montant net)
    const payout = await stripe.payouts.create(
      {
        amount: amountInCents,
        currency: cur,
        description: `Retrait Binq (net après 1.5% frais)`,
        metadata: {
          type: "retrait",
          app: "binq",
          montant_brut: String(Math.round(amount * 100)),
          frais_binq: String(Math.round(fraisBinq * 100)),
          taux_frais: "0.015",
        },
      },
      { stripeAccount: accountId }
    );

    // Record withdrawal fee
    if (fraisBinq > 0) {
      try {
        await recordFee({
          userId: user.id,
          source: "withdrawal",
          montant: fraisBinq,
          transactionRef: `RET-${payout.id.slice(-8).toUpperCase()}`,
        });
      } catch (err) {
        console.error("[create-payout] Fee recording error:", err);
      }
    }

    return NextResponse.json({
      payoutId: payout.id,
      amount: amount,
      montantNet: montantNet,
      fraisBinq: fraisBinq,
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
