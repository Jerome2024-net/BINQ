import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/coffres/setup-card
 * Crée un SetupIntent Stripe pour enregistrer une carte de paiement.
 * La carte est liée au customer Stripe de l'utilisateur pour les futurs dépôts épargne.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const stripe = getStripe();

    // Récupérer ou créer le customer Stripe
    const { data: profil } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, prenom, nom")
      .eq("id", user.id)
      .single();

    let customerId = profil?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profil?.email || user.email,
        name: `${profil?.prenom || ""} ${profil?.nom || ""}`.trim() || undefined,
        metadata: { user_id: user.id, app: "binq" },
      });
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Créer un SetupIntent pour enregistrer la carte
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      metadata: {
        user_id: user.id,
        type: "epargne_card_setup",
        app: "binq",
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    });
  } catch (error) {
    console.error("Erreur setup-card:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/coffres/setup-card
 * Liste les cartes enregistrées du customer Stripe
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();

    const { data: profil } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profil?.stripe_customer_id) {
      return NextResponse.json({ cartes: [] });
    }

    const stripe = getStripe();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: profil.stripe_customer_id,
      type: "card",
    });

    const cartes = paymentMethods.data.map((pm) => ({
      id: pm.id,
      marque: pm.card?.brand || "unknown",
      last4: pm.card?.last4 || "****",
      exp_month: pm.card?.exp_month,
      exp_year: pm.card?.exp_year,
    }));

    return NextResponse.json({ cartes });
  } catch (error) {
    console.error("Erreur list cards:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
