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
          // === FRAIS BINQ 1% ADDITIONNELS ===
          // Le montant demandé et les frais sont dans les metadata
          const montantDemandeCents = meta.montant_demande ? parseInt(meta.montant_demande) : null;
          const fraisBinqCents = meta.frais_binq ? parseInt(meta.frais_binq) : null;

          // Montant à créditer = montant demandé (sans les frais)
          const montantCredite = montantDemandeCents ? montantDemandeCents / 100 : pi.amount / 100;
          const fraisBinq = fraisBinqCents ? fraisBinqCents / 100 : 0;
          const totalPaye = pi.amount / 100;

          // Confirmer le dépôt (montant crédité, pas le total payé)
          await supabaseAdmin.from("transactions").upsert(
            {
              user_id: meta.userId,
              type: "depot",
              montant: montantCredite,
              devise: pi.currency.toUpperCase(),
              statut: "confirme",
              reference: `DEP-${pi.id.slice(-8).toUpperCase()}`,
              description: `Dépôt Stripe confirmé`,
              meta_methode: "stripe",
              meta_frais: fraisBinq,
              confirmed_at: new Date().toISOString(),
              stripe_payment_intent_id: pi.id,
            },
            { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true }
          );

          // Enregistrer les frais Binq comme transaction séparée (traçabilité)
          if (fraisBinq > 0) {
            try {
              await supabaseAdmin.from("transactions").insert({
                user_id: meta.userId,
                type: "commission",
                montant: fraisBinq,
                devise: pi.currency.toUpperCase(),
                statut: "confirme",
                reference: `FEE-${pi.id.slice(-8).toUpperCase()}`,
                description: `Frais plateforme Binq (1%) sur dépôt de ${montantCredite} €`,
                meta_methode: "stripe",
                confirmed_at: new Date().toISOString(),
              });
            } catch {
              // Ne pas bloquer si doublon
            }
          }

          // Créditer le wallet du montant DEMANDÉ (pas le total payé)
          if (meta.userId) {
            await supabaseAdmin.rpc("update_wallet_balance", {
              p_user_id: meta.userId,
              p_delta: montantCredite,
            });
          }

          console.log(`💰 Dépôt: ${montantCredite}€ crédité, frais Binq: ${fraisBinq}€, total payé: ${totalPaye}€`);
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
              stripe_account_id: account.id,
              stripe_onboarding_complete: account.details_submitted,
              stripe_charges_enabled: account.charges_enabled,
              stripe_payouts_enabled: account.payouts_enabled,
            })
            .eq("id", account.metadata.userId);
        } else {
          // Fallback : chercher par stripe_account_id
          await supabaseAdmin
            .from("profiles")
            .update({
              stripe_onboarding_complete: account.details_submitted,
              stripe_charges_enabled: account.charges_enabled,
              stripe_payouts_enabled: account.payouts_enabled,
            })
            .eq("stripe_account_id", account.id);
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
          const periodStart = new Date((sub as unknown as Record<string, number>).current_period_start * 1000);
          const periodEnd = new Date((sub as unknown as Record<string, number>).current_period_end * 1000);
          await supabaseAdmin.from("abonnements").upsert(
            {
              user_id: subMeta.userId,
              plan: "annuel",
              montant: 180,
              devise: "EUR",
              statut: "actif",
              date_debut: periodStart.toISOString(),
              date_expiration: periodEnd.toISOString(),
              renouvellement_auto: true,
              reference: `STR-SUB-${sub.id.slice(-8).toUpperCase()}`,
              stripe_subscription_id: sub.id,
            },
            { onConflict: "user_id" }
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const updatedSub = event.data.object as Stripe.Subscription;
        const updMeta = updatedSub.metadata;
        console.log(`🔄 Abonnement mis à jour: ${updatedSub.id} — statut: ${updatedSub.status}`);

        if (updMeta?.userId) {
          const periodEnd = new Date((updatedSub as unknown as Record<string, number>).current_period_end * 1000);
          const stripeStatus = updatedSub.status;
          const appStatus = stripeStatus === "active" ? "actif" : stripeStatus === "canceled" ? "annule" : "expire";

          await supabaseAdmin
            .from("abonnements")
            .update({
              statut: appStatus,
              date_expiration: periodEnd.toISOString(),
              renouvellement_auto: !updatedSub.cancel_at_period_end,
            })
            .eq("stripe_subscription_id", updatedSub.id);
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
        console.log(`🛒 Checkout terminé: ${session.id} — mode: ${session.mode}`);

        // Activer l'abonnement si c'est un checkout d'abonnement
        if (sessMeta?.type === "abonnement_organisateur" && sessMeta?.userId) {
          const now = new Date();
          const expiration = new Date(now);
          expiration.setFullYear(expiration.getFullYear() + 1);

          await supabaseAdmin.from("abonnements").upsert(
            {
              user_id: sessMeta.userId,
              plan: "annuel",
              montant: 180,
              devise: "EUR",
              statut: "actif",
              date_debut: now.toISOString(),
              date_expiration: expiration.toISOString(),
              renouvellement_auto: true,
              reference: `STR-CHK-${session.id.slice(-8).toUpperCase()}`,
              stripe_session_id: session.id,
              stripe_subscription_id: (session as unknown as Record<string, string>).subscription || null,
            },
            { onConflict: "user_id" }
          );
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`💳 Facture payée: ${invoice.id}`);

        // Renouvellement automatique : mettre à jour la date d'expiration
        const invoiceAny = invoice as unknown as Record<string, unknown>;
        const invoiceSubId = invoiceAny.subscription as string | undefined;
        if (invoiceSubId) {
          const periodEnd = invoice.lines?.data?.[0]?.period?.end;
          if (periodEnd) {
            await supabaseAdmin
              .from("abonnements")
              .update({
                statut: "actif",
                date_expiration: new Date(periodEnd * 1000).toISOString(),
              })
              .eq("stripe_subscription_id", invoiceSubId);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log(`❌ Facture impayée: ${failedInvoice.id}`);

        const failedInvoiceAny = failedInvoice as unknown as Record<string, unknown>;
        const failedSubId = failedInvoiceAny.subscription as string | undefined;
        if (failedSubId) {
          await supabaseAdmin
            .from("abonnements")
            .update({ statut: "expire" })
            .eq("stripe_subscription_id", failedSubId);
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
