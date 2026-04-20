import { createClient } from "@supabase/supabase-js";
import { generatePaymentRef, generateQR, type OrderData } from "@/lib/cinetpay";
import { recordFee } from "@/lib/admin-fees";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Crée les tickets + crédite le wallet de l'organisateur.
 * Idempotent : si les tickets existent déjà, retourne les existants.
 * 
 * Utilisé par :
 * - /api/cinetpay/verify (frontend redirect)
 * - /api/webhooks/cinetpay (webhook filet de sécurité)
 */
export async function fulfillTicketOrder(
  orderData: OrderData,
  transactionId: string
): Promise<{ tickets: any[]; already_created: boolean }> {
  const supabase = getServiceClient();
  const txRef = String(transactionId || "direct");

  // ═══ Idempotence — vérifier si les billets existent déjà ═══
  const firstRef = generatePaymentRef(txRef, 0);
  const { data: existingTickets } = await supabase
    .from("tickets")
    .select("*")
    .eq("reference", firstRef);

  if (existingTickets && existingTickets.length > 0) {
    // Tickets déjà créés, retourner les existants
    const refs = Array.from({ length: orderData.qty }, (_, i) =>
      generatePaymentRef(txRef, i)
    );
    const { data: allTickets } = await supabase
      .from("tickets")
      .select("*")
      .in("reference", refs);
    return { tickets: allTickets || [], already_created: true };
  }

  // ═══ Vérifier que le type de billet existe encore ═══
  const { data: ticketType } = await supabase
    .from("ticket_types")
    .select("*, events(*, boutique_id)")
    .eq("id", orderData.ticket_type_id)
    .single();

  if (!ticketType) {
    throw new Error("Type de billet non trouvé");
  }

  // ═══ Créer les billets ═══
  const tickets = [];
  for (let i = 0; i < orderData.qty; i++) {
    tickets.push({
      ticket_type_id: orderData.ticket_type_id,
      event_id: orderData.event_id,
      buyer_name: orderData.buyer_name,
      buyer_email: orderData.buyer_email || null,
      buyer_phone: orderData.buyer_phone || null,
      qr_code: generateQR(),
      reference: generatePaymentRef(txRef, i),
      quantite: 1,
      montant_total: ticketType.prix,
      devise: ticketType.devise,
      statut: "valid",
    });
  }

  const { data: createdTickets, error: ticketError } = await supabase
    .from("tickets")
    .insert(tickets)
    .select();

  if (ticketError) throw ticketError;

  // ═══ Mettre à jour les stats ═══
  await supabase
    .from("ticket_types")
    .update({ quantite_vendue: ticketType.quantite_vendue + orderData.qty })
    .eq("id", orderData.ticket_type_id);

  await supabase
    .from("events")
    .update({
      total_vendu: (ticketType.events.total_vendu || 0) + orderData.qty,
      revenus:
        (parseFloat(ticketType.events.revenus) || 0) + orderData.montant_total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderData.event_id);

  // ═══ Créditer le wallet de l'organisateur ═══
  const boutique_id = ticketType.events.boutique_id;
  if (boutique_id && orderData.montant_total > 0) {
    try {
      // Trouver le user_id de l'organisateur via la boutique
      const { data: boutique } = await supabase
        .from("boutiques")
        .select("user_id")
        .eq("id", boutique_id)
        .single();

      if (boutique?.user_id) {
        const devise = (orderData.devise || "XOF").toUpperCase();

        // Get or create wallet
        let { data: wallet } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", boutique.user_id)
          .eq("devise", devise)
          .single();

        if (!wallet) {
          const { data: newWallet } = await supabase
            .from("wallets")
            .insert({ user_id: boutique.user_id, solde: 0, solde_bloque: 0, devise })
            .select()
            .single();
          wallet = newWallet;
        }

        if (wallet) {
          const montantOrganisateur = orderData.montant_total;
          const newSolde = wallet.solde + montantOrganisateur;

          // Créditer le wallet
          await supabase
            .from("wallets")
            .update({ solde: newSolde, updated_at: new Date().toISOString() })
            .eq("id", wallet.id);

          // Enregistrer la transaction
          await supabase.from("transactions").insert({
            user_id: boutique.user_id,
            type: "vente_ticket",
            montant: montantOrganisateur,
            devise,
            statut: "confirme",
            description: `Vente ${orderData.qty}× billet${orderData.qty > 1 ? "s" : ""} — ${ticketType.events.nom || "Événement"}`,
            reference: `TICKET-${txRef}`,
            solde_apres: newSolde,
          });

          // Enregistrer les frais de service (10%) comme commission admin
          const fraisService = Math.ceil(orderData.montant_total * 0.1);
          if (fraisService > 0) {
            await recordFee({
              userId: boutique.user_id,
              source: "ticket_sale",
              montant: fraisService,
              transactionRef: `TICKET-${txRef}`,
            });
          }
        }
      }
    } catch (walletErr) {
      // Ne pas faire échouer la création de tickets si le crédit wallet échoue
      console.error("Erreur crédit wallet organisateur:", walletErr);
    }
  }

  // ═══ Marquer la commande comme complétée ═══
  await supabase
    .from("pending_ticket_orders")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("transaction_id", txRef);

  return { tickets: createdTickets || [], already_created: false };
}
