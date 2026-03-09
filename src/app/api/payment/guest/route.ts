import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { type DeviseCode, DEVISES, xofToEur, formatMontant } from "@/lib/currencies";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const GUEST_FEE_RATE = 0.02; // 2% guest fee

/**
 * POST /api/payment/guest
 * Creates a Stripe Checkout Session for guest (non-logged-in) users.
 * The guest pays amount + 2% fee via card.
 * On success (webhook), the merchant/recipient wallet is credited the full amount.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, montant, type } = body;

    // type = "link" (payment link) or "user" (direct user payment)
    if (!type || !montant || montant <= 0) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const supabase = getServiceClient();
    let recipientId: string;
    let recipientName: string;
    let description: string;
    let devise: DeviseCode = "XOF";
    let linkCode: string | null = null;
    let linkId: string | null = null;

    if (type === "link") {
      // Payment via payment link
      if (!code) {
        return NextResponse.json({ error: "Code requis" }, { status: 400 });
      }

      const { data: link, error: linkErr } = await supabase
        .from("payment_links")
        .select("*, createur:profiles!createur_id(prenom, nom)")
        .eq("code", code)
        .single();

      if (linkErr || !link) {
        return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
      }

      if (link.statut !== "actif") {
        return NextResponse.json({ error: "Ce lien n'est plus actif" }, { status: 410 });
      }

      // Can't guest-pay a "send" link (needs account to receive)
      if (link.type === "send") {
        return NextResponse.json({ error: "Créez un compte pour récupérer cet argent" }, { status: 400 });
      }

      recipientId = link.createur_id;
      recipientName = `${link.createur?.prenom || ""} ${link.createur?.nom || ""}`.trim();
      description = link.description || `Paiement à ${recipientName}`;
      devise = (link.devise === "EUR" || link.devise === "XOF") ? link.devise : "XOF";
      linkCode = link.code;
      linkId = link.id;

      // If fixed amount, use it
      if (link.montant && link.montant > 0) {
        // montant must match
      }
    } else if (type === "user") {
      // Direct payment to user
      if (!code) {
        return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, prenom, nom")
        .eq("id", code)
        .single();

      if (!profile) {
        return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      }

      recipientId = profile.id;
      recipientName = `${profile.prenom || ""} ${profile.nom || ""}`.trim();
      description = `Paiement à ${recipientName} via Binq`;
      devise = (body.devise === "EUR" || body.devise === "XOF") ? body.devise : "XOF";
    } else {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    const parsedMontant = parseFloat(montant);
    const deviseConfig = DEVISES[devise];

    if (parsedMontant < deviseConfig.minTransfer) {
      return NextResponse.json({
        error: `Montant minimum : ${formatMontant(deviseConfig.minTransfer, devise)}`,
      }, { status: 400 });
    }

    // Calculate EUR amount for Stripe + 2% guest fee
    const montantEur = devise === "XOF" ? xofToEur(parsedMontant) : parsedMontant;
    const fraisGuest = Math.round(montantEur * GUEST_FEE_RATE * 100) / 100;
    const totalEur = Math.round((montantEur + fraisGuest) * 100) / 100;
    const totalCents = Math.round(totalEur * 100);

    if (totalCents < 50) {
      return NextResponse.json({ error: "Le montant est trop faible" }, { status: 400 });
    }

    // Create Stripe Checkout Session
    const stripe = getStripe();
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://binq.app";

    const successUrl = type === "link"
      ? `${origin}/pay/${linkCode}?guest_success=true&amount=${parsedMontant}`
      : `${origin}/pay/user/${code}?guest_success=true&amount=${parsedMontant}`;

    const cancelUrl = type === "link"
      ? `${origin}/pay/${linkCode}`
      : `${origin}/pay/user/${code}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: description,
              description: `Paiement de ${formatMontant(parsedMontant, devise)} — frais inclus (2%)`,
            },
            unit_amount: totalCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "guest_payment",
        recipient_id: recipientId,
        montant_credite: String(parsedMontant),
        devise,
        montant_eur_cents: String(Math.round(montantEur * 100)),
        frais_guest_cents: String(Math.round(fraisGuest * 100)),
        payment_link_id: linkId || "",
        payment_link_code: linkCode || "",
        app: "binq",
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({
      sessionUrl: session.url,
      montantCredite: parsedMontant,
      montantEur,
      fraisGuest,
      totalEur,
      devise,
    });
  } catch (err) {
    console.error("[payment/guest] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
