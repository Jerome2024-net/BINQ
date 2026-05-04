import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { fulfillTicketOrder } from "@/lib/ticket-fulfillment";

function verifyFedaPaySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function extractTransactionId(body: any): string | null {
  const tx =
    body?.entity?.metadata?.transaction_id ||
    body?.entity?.custom_metadata?.transaction_id ||
    body?.data?.entity?.metadata?.transaction_id ||
    body?.data?.entity?.custom_metadata?.transaction_id ||
    body?.metadata?.transaction_id ||
    body?.custom_metadata?.transaction_id ||
    body?.["v1/transaction"]?.metadata?.transaction_id ||
    body?.["v1/transaction"]?.custom_metadata?.transaction_id ||
    body?.transaction_id ||
    body?.reference ||
    null;
  return tx ? String(tx) : null;
}

function extractStatus(body: any): string {
  return String(
    body?.entity?.status ||
      body?.data?.entity?.status ||
      body?.["v1/transaction"]?.status ||
      body?.status ||
      body?.payment_status ||
      "unknown"
  ).toLowerCase();
}

function isPaidStatus(status: string): boolean {
  return ["approved", "paid", "successful", "completed"].includes(status);
}

// POST /api/webhooks/fedapay — Notification FedaPay
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-fedapay-signature");

    if (process.env.FEDAPAY_WEBHOOK_SECRET) {
      if (!verifyFedaPaySignature(rawBody, signature)) {
        console.error("FedaPay webhook: signature invalide");
        return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const transactionId = extractTransactionId(body);

    if (!transactionId) {
      console.error("FedaPay webhook: transaction_id manquant");
      return NextResponse.json({ received: true });
    }

    const status = extractStatus(body);
    if (!isPaidStatus(status)) {
      console.log(
        `FedaPay webhook: paiement ${transactionId} non confirmé (status: ${status})`
      );
      return NextResponse.json({ received: true });
    }

    const supabase = getServiceClient();

    const { data: pendingOrder } = await supabase
      .from("pending_ticket_orders")
      .select("*")
      .eq("transaction_id", transactionId)
      .single();

    if (!pendingOrder) {
      const { data: commande } = await supabase
        .from("commandes")
        .select("*")
        .eq("reference", transactionId)
        .single();

      if (!commande) {
        console.log(`FedaPay webhook: aucune commande pending pour ${transactionId}`);
        return NextResponse.json({ received: true });
      }

      if (commande.statut === "payee") {
        console.log(`FedaPay webhook: commande commerce ${transactionId} déjà payée`);
        return NextResponse.json({ received: true, already_processed: true });
      }

      await supabase
        .from("commandes")
        .update({ statut: "payee" })
        .eq("id", commande.id);

      const { data: items } = await supabase
        .from("commande_items")
        .select("produit_id, quantite")
        .eq("commande_id", commande.id);

      await Promise.allSettled(
        (items || []).map(async (item: any) => {
          const { data: produit } = await supabase
            .from("produits")
            .select("stock, ventes")
            .eq("id", item.produit_id)
            .single();

          if (!produit) return;

          const updates: Record<string, number> = {
            ventes: Number(produit.ventes || 0) + Number(item.quantite || 1),
          };
          if (produit.stock !== null) {
            updates.stock = Math.max(0, Number(produit.stock || 0) - Number(item.quantite || 1));
          }
          await supabase.from("produits").update(updates).eq("id", item.produit_id);
        })
      );

      await supabase.from("notifications").insert({
        user_id: commande.vendeur_id,
        titre: "Commande payée",
        message: `${commande.client_nom || "Un client"} a payé la commande ${transactionId}`,
        lu: false,
      });

      console.log(`FedaPay webhook: commande commerce ${transactionId} marquée payée`);
      return NextResponse.json({ received: true });
    }

    if (pendingOrder.status === "completed") {
      console.log(`FedaPay webhook: commande ${transactionId} déjà traitée`);
      return NextResponse.json({ received: true, already_processed: true });
    }

    const { tickets, already_created } = await fulfillTicketOrder(
      pendingOrder.order_data,
      transactionId
    );

    console.log(
      `FedaPay webhook: ${already_created ? "tickets déjà existants" : `${tickets.length} tickets créés`} pour ${transactionId}`
    );

    return NextResponse.json({
      received: true,
      payment_confirmed: true,
      tickets_created: tickets.length,
      already_created,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("FedaPay webhook error:", err);
    return NextResponse.json({ error: message }, { status: 200 });
  }
}
