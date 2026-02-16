import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * POST /api/stripe/create-account
 * Crée un compte Stripe Connect (Express) pour un utilisateur
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { email, firstName, lastName, userId, country } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Pays supportés par Stripe Connect Express
    const supportedCountries = [
      "FR", "US", "GB", "DE", "ES", "IT", "NL", "BE", "CH", "CA", "AU",
      "AT", "PT", "IE", "LU", "FI", "SE", "DK", "NO", "PL", "CZ",
      "RO", "BG", "HR", "HU", "SK", "SI", "LT", "LV", "EE", "MT", "CY",
      "JP", "SG", "HK", "NZ", "MX", "BR",
    ];
    const userCountry = (country || "FR").toUpperCase();
    const finalCountry = supportedCountries.includes(userCountry) ? userCountry : "FR";

    // Créer un compte Express (le plus simple pour les utilisateurs)
    const account = await stripe.accounts.create({
      type: "express",
      country: finalCountry,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      individual: {
        email,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      },
      metadata: {
        userId: user.id,
        app: "binq",
      },
    });

    return NextResponse.json({
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (error) {
    console.error("Erreur création compte Connect:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
