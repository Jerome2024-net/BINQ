import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * POST /api/stripe/account-status
 * Vérifie le statut d'un compte Stripe Connect
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json({ error: "accountId requis" }, { status: 400 });
    }

    const account = await stripe.accounts.retrieve(accountId);

    // Récupérer le solde du compte Connect
    let balance = { available: 0, pending: 0 };
    try {
      const stripeBalance = await stripe.balance.retrieve({
        stripeAccount: accountId,
      });
      balance = {
        available: stripeBalance.available.reduce((sum, b) => sum + b.amount, 0) / 100,
        pending: stripeBalance.pending.reduce((sum, b) => sum + b.amount, 0) / 100,
      };
    } catch {
      // Le compte n'a peut-être pas encore de balance
    }

    return NextResponse.json({
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      email: account.email,
      balance,
    });
  } catch (error) {
    console.error("Erreur statut compte:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
