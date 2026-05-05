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

const TAUX_FRAIS_SERVICE_COMMERCE = 0.1;

function toAmount(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function parseOrderNote(note: unknown): any | null {
  if (!note || typeof note !== "string") return null;
  try {
    const parsed = JSON.parse(note);
    return parsed?.type === "local_delivery" ? parsed : null;
  } catch {
    return null;
  }
}

async function getOrCreateWallet(supabase: any, userId: string, devise: string) {
  let { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("devise", devise)
    .single();

  if (!wallet) {
    const { data: created } = await supabase
      .from("wallets")
      .insert({ user_id: userId, solde: 0, solde_bloque: 0, devise })
      .select()
      .single();
    wallet = created;
  }

  if (!wallet) {
    const { data: fallback } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();
    wallet = fallback;
  }

  return wallet;
}

async function creditWallet(supabase: any, wallet: any, amount: number) {
  const before = toAmount(wallet?.solde);
  const after = before + amount;

  const { error: rpcErr } = await supabase.rpc("update_wallet_balance", {
    p_wallet_id: wallet.id,
    p_amount: amount,
  });

  if (rpcErr) {
    await supabase
      .from("wallets")
      .update({ solde: after, updated_at: new Date().toISOString() })
      .eq("id", wallet.id);
  }

  return { before, after };
}

async function settleCommerceWallets(supabase: any, commande: any, transactionId: string) {
  const merchantReference = `COM-${transactionId}-MARCHAND`;
  const { data: existingSettlement } = await supabase
    .from("transactions")
    .select("id")
    .eq("reference", merchantReference)
    .limit(1)
    .maybeSingle();

  if (existingSettlement || commande.wallet_settled_at) {
    return { already_settled: true };
  }

  const note = parseOrderNote(commande.note);
  const devise = String(commande.devise || note?.devise || "XOF");
  const sousTotal = toAmount(commande.sous_total ?? note?.sous_total ?? commande.montant);
  const fraisLivraison = toAmount(commande.frais_livraison ?? note?.frais_livraison);
  const totalPaye = toAmount(commande.montant_total ?? commande.montant);
  const expectedServiceFee = Math.ceil(sousTotal * TAUX_FRAIS_SERVICE_COMMERCE);
  const storedServiceFee = toAmount(commande.frais_service ?? note?.frais_service);
  const fraisService = storedServiceFee > 0
    ? storedServiceFee
    : totalPaye >= sousTotal + fraisLivraison + expectedServiceFee
      ? expectedServiceFee
      : 0;
  const livreurId = commande.livreur_id || note?.livreur_id || null;
  const montantLivreur = livreurId ? toAmount(commande.montant_livreur ?? note?.montant_livreur ?? fraisLivraison) : 0;
  const montantMarchandBase = toAmount(commande.montant_marchand ?? note?.montant_marchand ?? sousTotal);
  const montantMarchand = montantMarchandBase + (livreurId ? 0 : fraisLivraison);
  const now = new Date().toISOString();

  if (montantMarchand > 0 && commande.vendeur_id) {
    const merchantWallet = await getOrCreateWallet(supabase, commande.vendeur_id, devise);
    if (merchantWallet) {
      const balance = await creditWallet(supabase, merchantWallet, montantMarchand);
      await supabase.from("transactions").insert({
        user_id: commande.vendeur_id,
        wallet_id: merchantWallet.id,
        type: "depot",
        montant: montantMarchand,
        solde_avant: balance.before,
        solde_apres: balance.after,
        devise,
        statut: "confirme",
        reference: merchantReference,
        description: `Encaissement commande ${transactionId}${!livreurId && fraisLivraison > 0 ? " — livraison incluse" : ""}`,
        meta_methode: "fedapay",
        confirmed_at: now,
      });
    }
  }

  if (livreurId && montantLivreur > 0) {
    const driverReference = `COM-${transactionId}-LIVREUR`;
    const { data: existingDriverTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("reference", driverReference)
      .limit(1)
      .maybeSingle();

    if (!existingDriverTx) {
      const driverWallet = await getOrCreateWallet(supabase, livreurId, devise);
      if (driverWallet) {
        const balance = await creditWallet(supabase, driverWallet, montantLivreur);
        await supabase.from("transactions").insert({
          user_id: livreurId,
          wallet_id: driverWallet.id,
          type: "depot",
          montant: montantLivreur,
          solde_avant: balance.before,
          solde_apres: balance.after,
          devise,
          statut: "confirme",
          reference: driverReference,
          description: `Livraison commande ${transactionId}`,
          meta_methode: "fedapay",
          confirmed_at: now,
        });

        await supabase.from("notifications").insert({
          user_id: livreurId,
          titre: "Livraison créditée",
          message: `Vos frais de livraison pour la commande ${transactionId} sont disponibles dans votre portefeuille.`,
          lu: false,
        });
      }
    }
  }

  if (fraisService > 0) {
    const feeReference = `COM-${transactionId}-FEE`;
    const { data: existingFee } = await supabase
      .from("admin_fees")
      .select("id")
      .eq("transaction_ref", feeReference)
      .limit(1)
      .maybeSingle();

    if (!existingFee) {
      await supabase.from("admin_fees").insert({
        user_id: commande.vendeur_id,
        source: "commerce_service_fee",
        montant: fraisService,
        transaction_ref: feeReference,
        stripe_status: "pending",
      });
    }
  }

  const settlementUpdate = {
    statut: "payee",
    wallet_settled_at: now,
    frais_service: fraisService,
    montant_marchand: montantMarchand,
    montant_livreur: montantLivreur,
  };

  const { error: settlementErr } = await supabase
    .from("commandes")
    .update(settlementUpdate)
    .eq("id", commande.id);

  if (settlementErr) {
    await supabase.from("commandes").update({ statut: "payee" }).eq("id", commande.id);
  }

  return { already_settled: false, montant_marchand: montantMarchand, montant_livreur: montantLivreur, frais_service: fraisService };
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

      const shouldUpdateProducts = commande.statut !== "payee";

      if (shouldUpdateProducts) {
        await supabase
          .from("commandes")
          .update({ statut: "payee" })
          .eq("id", commande.id);
      }

      const { data: items } = await supabase
        .from("commande_items")
        .select("produit_id, quantite")
        .eq("commande_id", commande.id);

      if (shouldUpdateProducts) {
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
      }

      const settlement = await settleCommerceWallets(supabase, commande, transactionId);

      await supabase.from("notifications").insert({
        user_id: commande.vendeur_id,
        titre: "Commande payée",
        message: `${commande.client_nom || "Un client"} a payé la commande ${transactionId}. L'encaissement est disponible dans votre portefeuille.`,
        lu: false,
      });

      console.log(`FedaPay webhook: commande commerce ${transactionId} marquée payée`);
      return NextResponse.json({ received: true, payment_confirmed: true, order_confirmed: true, settlement });
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
