import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const FLUSH_THRESHOLD = 5; // Envoyer à Stripe dès que le cumul atteint 5 €

/**
 * Enregistre une commission dans admin_fees et flush vers Stripe si le seuil est atteint.
 */
export async function recordFee(params: {
  userId: string;
  source: string;
  montant: number;
  transactionRef: string;
}) {
  const supabase = getServiceClient();

  // Enregistrer la commission
  await supabase.from("admin_fees").insert({
    user_id: params.userId,
    source: params.source,
    montant: params.montant,
    transaction_ref: params.transactionRef,
    stripe_status: "pending",
  });

  // Vérifier le cumul pending
  await flushPendingFees();
}

/**
 * Flush automatique : envoie les frais pending vers Stripe si >= seuil.
 */
export async function flushPendingFees() {
  const supabase = getServiceClient();

  const { data: pending } = await supabase
    .from("admin_fees")
    .select("id, montant")
    .eq("stripe_status", "pending");

  if (!pending || pending.length === 0) return;

  const total = pending.reduce((sum, f) => sum + Number(f.montant), 0);

  if (total < FLUSH_THRESHOLD) return;

  // Créer un PaymentIntent vers Stripe pour collecter les frais
  try {
    const stripe = getStripe();
    const amountCents = Math.round(total * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      description: `Binq – Commissions plateforme (${pending.length} transactions)`,
      automatic_payment_methods: { enabled: false },
      payment_method_types: ["card"],
      confirm: false,
      metadata: {
        type: "admin_fees_collection",
        fee_count: String(pending.length),
        total_eur: total.toFixed(2),
        app: "binq",
      },
    });

    // Marquer toutes les fees comme "sent"
    const ids = pending.map((f) => f.id);
    await supabase
      .from("admin_fees")
      .update({
        stripe_payment_id: paymentIntent.id,
        stripe_status: "sent",
      })
      .in("id", ids);

    console.log(`[admin-fees] Flush ${pending.length} fees → ${total.toFixed(2)} € → PI ${paymentIntent.id}`);
  } catch (err) {
    console.error("[admin-fees] Erreur flush Stripe:", err);
  }
}

/**
 * Force le flush de TOUTES les fees pending, même si < seuil.
 */
export async function forceFlushFees() {
  const supabase = getServiceClient();

  const { data: pending } = await supabase
    .from("admin_fees")
    .select("id, montant")
    .eq("stripe_status", "pending");

  if (!pending || pending.length === 0) return { flushed: 0, total: 0 };

  const total = pending.reduce((sum, f) => sum + Number(f.montant), 0);
  if (total <= 0) return { flushed: 0, total: 0 };

  try {
    const stripe = getStripe();
    const amountCents = Math.round(total * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      description: `Binq – Commissions plateforme FORCE (${pending.length} transactions)`,
      automatic_payment_methods: { enabled: false },
      payment_method_types: ["card"],
      confirm: false,
      metadata: {
        type: "admin_fees_collection_force",
        fee_count: String(pending.length),
        total_eur: total.toFixed(2),
        app: "binq",
      },
    });

    const ids = pending.map((f) => f.id);
    await supabase
      .from("admin_fees")
      .update({
        stripe_payment_id: paymentIntent.id,
        stripe_status: "sent",
      })
      .in("id", ids);

    return { flushed: pending.length, total, paymentIntentId: paymentIntent.id };
  } catch (err) {
    console.error("[admin-fees] Erreur force flush:", err);
    return { flushed: 0, total, error: String(err) };
  }
}
