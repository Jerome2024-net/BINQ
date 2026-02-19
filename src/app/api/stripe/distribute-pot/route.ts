import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { distributePotSchema, validateBody } from "@/lib/validations";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * POST /api/stripe/distribute-pot
 * Transfère les fonds du pot vers le compte Stripe Connect du bénéficiaire
 * et enregistre la transaction reception_pot pour le bénéficiaire
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

    const { amount, currency, destinationAccountId, tontineNom, tourNumero, tontineId, tourId, beneficiaryUserId } = validation.data;
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
        beneficiaryUserId: beneficiaryUserId || "",
        tontineId: tontineId || "",
        tourId: tourId || "",
        app: "binq",
      },
    });

    // Enregistrer la transaction reception_pot pour le bénéficiaire
    if (beneficiaryUserId) {
      try {
        // S'assurer qu'un wallet existe pour la FK
        let walletId: string | null = null;
        const { data: walletRow } = await supabaseAdmin
          .from("wallets")
          .select("id")
          .eq("user_id", beneficiaryUserId)
          .single();

        if (walletRow) {
          walletId = walletRow.id;
        } else {
          const { data: newWallet } = await supabaseAdmin
            .from("wallets")
            .insert({ user_id: beneficiaryUserId, solde: 0, solde_bloque: 0, devise: "EUR" })
            .select("id")
            .single();
          walletId = newWallet?.id || null;
        }

        if (walletId) {
          await supabaseAdmin.from("transactions").insert({
            wallet_id: walletId,
            user_id: beneficiaryUserId,
            type: "reception_pot",
            montant: amount,
            devise: cur.toUpperCase(),
            statut: "confirme",
            reference: `POT-${transfer.id}`,
            description: `Pot reçu — ${tontineNom} (Tour ${tourNumero})`,
            meta_tontine_id: tontineId || null,
            meta_tontine_nom: tontineNom,
            meta_tour_id: tourId || null,
            meta_tour_numero: tourNumero,
            meta_methode: "stripe_connect",
            confirmed_at: new Date().toISOString(),
          });
        }
      } catch (txErr) {
        console.error("Erreur enregistrement transaction pot:", txErr);
        // Ne pas bloquer le transfert si l'enregistrement échoue
      }
    }

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
