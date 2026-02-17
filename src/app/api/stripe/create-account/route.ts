import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

/**
 * POST /api/stripe/create-account
 * Crée un compte Stripe Connect (Express) pour un utilisateur
 * et sauvegarde le stripe_account_id en base.
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
    const stripe = getStripe();
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

    // Sauvegarder le stripe_account_id dans le profil Supabase
    await supabaseAdmin
      .from("profiles")
      .update({
        stripe_account_id: account.id,
        stripe_onboarding_complete: account.details_submitted,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
      })
      .eq("id", user.id);

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
