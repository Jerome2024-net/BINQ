import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/api-auth";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/marketplace/acheter — Créer un lien de paiement pour un produit (passerelle QR)
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const { produit_id, note } = await req.json();

    if (!produit_id) {
      return NextResponse.json({ error: "Produit requis" }, { status: 400 });
    }

    // Get product + boutique
    const { data: produit } = await supabase
      .from("produits")
      .select(`
        *,
        boutique:boutiques(id, user_id, nom, devise)
      `)
      .eq("id", produit_id)
      .eq("is_active", true)
      .single();

    if (!produit) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const boutique = (produit as any).boutique;
    const vendeur_id = boutique.user_id;
    const montant = Number(produit.prix);
    const devise = produit.devise || "XOF";

    // Can't buy from yourself
    if (vendeur_id === user.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas acheter votre propre produit" }, { status: 400 });
    }

    // Check stock
    if (produit.stock !== null && produit.stock <= 0) {
      return NextResponse.json({ error: "Produit en rupture de stock" }, { status: 400 });
    }

    // Generate reference
    const ref = `MKT-${Date.now().toString(36).toUpperCase()}`;

    // Create a payment link — buyer will pay via Stripe / mobile money
    const code = `mkt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: paymentLink, error: plErr } = await supabase
      .from("payment_links")
      .insert({
        code,
        createur_id: vendeur_id,
        montant,
        devise,
        description: `Achat: ${produit.nom} — ${boutique.nom}`,
        type: "request",
        statut: "actif",
        metadata: {
          marketplace: true,
          produit_id: produit.id,
          produit_nom: produit.nom,
          boutique_id: boutique.id,
          boutique_nom: boutique.nom,
          acheteur_id: user.id,
          reference: ref,
          note: note?.trim() || null,
        },
      })
      .select()
      .single();

    if (plErr) throw plErr;

    return NextResponse.json({
      code,
      reference: ref,
      montant,
      devise,
      produit: { nom: produit.nom, image_url: produit.image_url },
      boutique: { nom: boutique.nom },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
