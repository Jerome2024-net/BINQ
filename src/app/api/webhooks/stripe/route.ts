import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Client Supabase admin (service_role) pour le webhook — contourne RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

/**
 * POST /api/webhooks/stripe
 * Webhook Stripe — source de vérité pour les paiements
 * Met à jour Supabase en conséquence de chaque événement Stripe
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Vérifier la signature du webhook (OBLIGATOIRE en production)
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const stripe = getStripe();

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("Erreur vérification signature webhook:", err);
        return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
      }
    } else if (process.env.NODE_ENV === "development") {
      // En développement UNIQUEMENT, accepter sans vérification
      event = JSON.parse(body) as Stripe.Event;
    } else {
      return NextResponse.json({ error: "Webhook secret non configuré" }, { status: 500 });
    }

    // Traiter l'événement
    switch (event.type) {
      // =============================
      // PAIEMENTS (dépôts & cotisations)
      // =============================
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const meta = pi.metadata;
        console.log(`✅ Paiement réussi: ${pi.id} — ${pi.amount / 100} ${pi.currency.toUpperCase()}`);

        if (meta?.type === "cotisation" && meta.payerUserId) {
          // Enregistrer la cotisation confirmée par Stripe
          await supabaseAdmin.from("transactions").upsert(
            {
              user_id: meta.payerUserId,
              type: "cotisation",
              montant: pi.amount / 100,
              devise: pi.currency.toUpperCase(),
              statut: "confirme",
              reference: `STR-${pi.id.slice(-8).toUpperCase()}`,
              description: `Cotisation Stripe - ${meta.tontineNom || ""} (Tour ${meta.tourNumero || ""})`,
              meta_tontine_id: meta.tontineId || null,
              meta_tontine_nom: meta.tontineNom || null,
              meta_tour_id: meta.tourId || null,
              meta_tour_numero: meta.tourNumero ? parseInt(meta.tourNumero) : null,
              meta_methode: "stripe",
              meta_frais: meta.applicationFee ? parseFloat(meta.applicationFee) / 100 : 0,
              confirmed_at: new Date().toISOString(),
              stripe_payment_intent_id: pi.id,
            },
            { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true }
          );
        } else if (meta?.type === "depot" && meta.userId) {
          // Confirmer un dépôt wallet
          await supabaseAdmin.from("transactions").upsert(
            {
              user_id: meta.userId,
              type: "depot",
              montant: pi.amount / 100,
              devise: pi.currency.toUpperCase(),
              statut: "confirme",
              reference: `DEP-${pi.id.slice(-8).toUpperCase()}`,
              description: `Dépôt Stripe confirmé`,
              meta_methode: "stripe",
              confirmed_at: new Date().toISOString(),
              stripe_payment_intent_id: pi.id,
            },
            { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true }
          );

          // Créditer le wallet via RPC atomique
          if (meta.userId) {
            await supabaseAdmin.rpc("update_wallet_balance", {
              p_user_id: meta.userId,
              p_delta: pi.amount / 100,
            });
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const failedPi = event.data.object as Stripe.PaymentIntent;
        const failMeta = failedPi.metadata;
        console.log(`❌ Paiement échoué: ${failedPi.id}`, failedPi.last_payment_error?.message);

        // Marquer la transaction comme échouée si elle existe
        if (failMeta?.payerUserId || failMeta?.userId) {
          await supabaseAdmin
            .from("transactions")
            .update({ statut: "echoue" })
            .eq("stripe_payment_intent_id", failedPi.id);
        }
        break;
      }

      // =============================
      // COMPTES CONNECT
      // =============================
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        console.log(`🔄 Compte Connect: ${account.id} — charges: ${account.charges_enabled}, payouts: ${account.payouts_enabled}`);

        // Mettre à jour le profil utilisateur avec le statut Connect
        if (account.metadata?.userId) {
          await supabaseAdmin
            .from("profiles")
            .update({
              stripe_charges_enabled: account.charges_enabled,
              stripe_payouts_enabled: account.payouts_enabled,
              stripe_details_submitted: account.details_submitted,
            })
            .eq("id", account.metadata.userId);
        }
        break;
      }

      // =============================
      // PAYOUTS (retraits vers banque)
      // =============================
      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        console.log(`💸 Payout effectué: ${payout.id} — ${payout.amount / 100} ${payout.currency.toUpperCase()}`);

        // Marquer le retrait comme complété
        await supabaseAdmin
          .from("transactions")
          .update({ statut: "confirme", confirmed_at: new Date().toISOString() })
          .eq("reference", `RET-${payout.id.slice(-8).toUpperCase()}`);
        break;
      }

      case "payout.failed": {
        const failedPayout = event.data.object as Stripe.Payout;
        console.log(`❌ Payout échoué: ${failedPayout.id}`, failedPayout.failure_message);

        // Reverser le montant au wallet si le payout échoue
        await supabaseAdmin
          .from("transactions")
          .update({ statut: "echoue", description: `Retrait échoué: ${failedPayout.failure_message || "erreur inconnue"}` })
          .eq("reference", `RET-${failedPayout.id.slice(-8).toUpperCase()}`);
        break;
      }

      // =============================
      // TRANSFERS (distribution pot)
      // =============================
      case "transfer.created": {
        const transfer = event.data.object as Stripe.Transfer;
        console.log(`🔀 Transfert: ${transfer.id} — ${transfer.amount / 100} ${transfer.currency.toUpperCase()} vers ${transfer.destination}`);
        break;
      }

      // =============================
      // ABONNEMENTS
      // =============================
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const subMeta = sub.metadata;
        console.log(`📋 Abonnement créé: ${sub.id}`);

        if (subMeta?.userId) {
          await supabaseAdmin.from("abonnements").upsert(
            {
              user_id: subMeta.userId,
              type: "organisateur",
              statut: "actif",
              prix: 15,
              devise: "EUR",
              stripe_subscription_id: sub.id,
              date_debut: new Date((sub as unknown as Record<string, unknown>).current_period_start as number * 1000).toISOString(),
              date_fin: new Date((sub as unknown as Record<string, unknown>).current_period_end as number * 1000).toISOString(),
              renouvellement_auto: true,
            },
            { onConflict: "user_id" }
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as Stripe.Subscription;
        console.log(`🗑️ Abonnement supprimé: ${deletedSub.id}`);

        await supabaseAdmin
          .from("abonnements")
          .update({ statut: "annule", renouvellement_auto: false })
          .eq("stripe_subscription_id", deletedSub.id);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessMeta = session.metadata;
        console.log(`🛒 Checkout terminé: ${session.id}`);

        // Activer l'abonnement si c'est un checkout d'abonnement
        if (sessMeta?.type === "abonnement_organisateur" && sessMeta?.userId) {
          await supabaseAdmin.from("abonnements").upsert(
            {
              user_id: sessMeta.userId,
              type: "organisateur",
              statut: "actif",
              prix: 180,
              devise: "EUR",
              stripe_session_id: session.id,
              date_debut: new Date().toISOString(),
              date_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              renouvellement_auto: true,
            },
            { onConflict: "user_id" }
          );
        }
        break;
      }

      default:
        console.log(`⚡ Événement Stripe non géré: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erreur webhook Stripe:", error);
    return NextResponse.json(
      { error: "Erreur traitement webhook" },
      { status: 500 }
    );
  }
}
