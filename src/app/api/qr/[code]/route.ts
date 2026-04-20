import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/qr/[code] — Resolve a universal QR code
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = getServiceClient();

    const { data: qr, error } = await supabase
      .from("qr_codes")
      .select(`
        *,
        boutique:boutiques(id, nom, slug, logo_url, description, ville, is_active),
        produit:produits(id, nom, prix, devise, image_url, is_active, boutique:boutiques(nom, slug)),
        vendeur:profiles!qr_codes_user_id_fkey(id, prenom, nom, avatar_url)
      `)
      .eq("code", params.code)
      .eq("is_active", true)
      .single();

    if (error || !qr) {
      return NextResponse.json({ error: "QR Code introuvable" }, { status: 404 });
    }

    // Increment scan count (fire and forget)
    supabase
      .from("qr_codes")
      .update({ scans: (qr.scans || 0) + 1 })
      .eq("id", qr.id)
      .then();

    // Build redirect URL based on type
    let redirectUrl = "/dashboard";
    let meta: Record<string, unknown> = { type: qr.type, label: qr.label };

    switch (qr.type) {
      case "boutique":
        if (qr.boutique) {
          redirectUrl = `/boutique/${qr.boutique.slug}`;
          meta = { ...meta, boutique: qr.boutique };
        }
        break;
      case "produit":
        if (qr.produit) {
          redirectUrl = `/produit/${qr.produit_id}`;
          meta = { ...meta, produit: qr.produit };
        }
        break;
      case "paiement":
        if (qr.payment_link_id) {
          // Fetch the payment link code
          const { data: pl } = await supabase
            .from("payment_links")
            .select("code")
            .eq("id", qr.payment_link_id)
            .single();
          redirectUrl = pl ? `/pay/${pl.code}` : "/dashboard";
          meta = { ...meta, payment_link_id: qr.payment_link_id };
        }
        break;
      case "vendeur":
        if (qr.user_id) {
          redirectUrl = `/pay/user/${qr.user_id}`;
          meta = { ...meta, vendeur: qr.vendeur };
        }
        break;
      case "commande":
        redirectUrl = `/commandes`;
        break;
      case "menu":
        if (qr.boutique) {
          redirectUrl = `/boutique/${qr.boutique.slug}/menu`;
          meta = { ...meta, boutique: qr.boutique };
        }
        break;
    }

    return NextResponse.json({ qr, redirectUrl, meta });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
