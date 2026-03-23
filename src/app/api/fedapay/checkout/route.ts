import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  signOrderData,
  initFedaPay,
  isFedaPayConfigured,
  type OrderData,
} from "@/lib/fedapay";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/fedapay/checkout — Initier un paiement FedaPay pour un billet
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await req.json();
    const { ticket_type_id, buyer_name, buyer_email, buyer_phone, quantite } =
      body;

    if (!ticket_type_id || !buyer_name?.trim()) {
      return NextResponse.json(
        { error: "Type de billet et nom requis" },
        { status: 400 }
      );
    }

    const qty = parseInt(quantite) || 1;

    // ═══ Récupérer le type de billet + événement ═══
    const { data: ticketType, error: ttError } = await supabase
      .from("ticket_types")
      .select("*, events(*)")
      .eq("id", ticket_type_id)
      .single();

    if (ttError || !ticketType) {
      return NextResponse.json(
        { error: "Type de billet non trouvé" },
        { status: 404 }
      );
    }

    if (!ticketType.is_active) {
      return NextResponse.json(
        { error: "Ce type de billet n'est plus disponible" },
        { status: 400 }
      );
    }

    if (!ticketType.events?.is_active || !ticketType.events?.is_published) {
      return NextResponse.json(
        { error: "Événement non disponible" },
        { status: 400 }
      );
    }

    // Vérifier stock
    const remaining = ticketType.quantite_total - ticketType.quantite_vendue;
    if (qty > remaining) {
      return NextResponse.json(
        { error: `Plus que ${remaining} billet(s) disponible(s)` },
        { status: 400 }
      );
    }

    if (qty > ticketType.max_par_personne) {
      return NextResponse.json(
        { error: `Maximum ${ticketType.max_par_personne} billet(s) par personne` },
        { status: 400 }
      );
    }

    const montant_total = ticketType.prix * qty;

    // Billet gratuit → dire au frontend d'utiliser /api/tickets/buy
    if (montant_total <= 0) {
      return NextResponse.json({ free: true });
    }

    // FedaPay non configuré → fallback (mode dev)
    if (!isFedaPayConfigured()) {
      return NextResponse.json({ fallback: true });
    }

    // ═══ Créer la transaction FedaPay ═══
    await initFedaPay();
    const { Transaction } = await import("fedapay");

    const orderData: OrderData = {
      ticket_type_id,
      buyer_name: buyer_name.trim(),
      buyer_email: buyer_email?.trim() || undefined,
      buyer_phone: buyer_phone?.trim() || undefined,
      qty,
      event_id: ticketType.events.id,
      montant_total,
      devise: ticketType.devise || "XOF",
    };

    const { encoded, signature } = signOrderData(orderData);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    const callbackUrl = `${appUrl}/payment/ticket-success?d=${encoded}&s=${signature}`;

    const customerData: Record<string, unknown> = {
      firstname: buyer_name.trim(),
    };
    if (buyer_email?.trim()) customerData.email = buyer_email.trim();
    if (buyer_phone?.trim()) {
      customerData.phone_number = {
        number: buyer_phone.trim(),
        country: "bj",
      };
    }

    const transaction = await Transaction.create({
      description: `Billet ${ticketType.events.nom}${qty > 1 ? ` x${qty}` : ""}`,
      amount: montant_total,
      callback_url: callbackUrl,
      currency: { iso: ticketType.devise || "XOF" },
      customer: customerData,
    });

    // Générer le token de paiement → URL de checkout
    const tokenResult = await transaction.generateToken();

    return NextResponse.json({
      payment_url: tokenResult.url,
      transaction_id: transaction.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur de paiement";
    console.error("FedaPay checkout error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
