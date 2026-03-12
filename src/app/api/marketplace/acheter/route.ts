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

// POST /api/marketplace/acheter — Acheter un produit (paiement wallet Binq)
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

    // Check buyer wallet balance
    const { data: buyerWallet } = await supabase
      .from("wallets")
      .select("id, solde")
      .eq("user_id", user.id)
      .eq("devise", devise)
      .single();

    if (!buyerWallet || buyerWallet.solde < montant) {
      return NextResponse.json({
        error: "Solde insuffisant",
        solde: buyerWallet?.solde || 0,
        montant,
      }, { status: 400 });
    }

    // Debit buyer
    const { error: debitErr } = await supabase.rpc("update_wallet_balance", {
      p_user_id: user.id,
      p_devise: devise,
      p_amount: -montant,
    });
    if (debitErr) {
      // Fallback direct update
      await supabase
        .from("wallets")
        .update({ solde: buyerWallet.solde - montant })
        .eq("id", buyerWallet.id);
    }

    // Credit seller
    const { data: sellerWallet } = await supabase
      .from("wallets")
      .select("id, solde")
      .eq("user_id", vendeur_id)
      .eq("devise", devise)
      .single();

    if (sellerWallet) {
      const { error: creditErr } = await supabase.rpc("update_wallet_balance", {
        p_user_id: vendeur_id,
        p_devise: devise,
        p_amount: montant,
      });
      if (creditErr) {
        await supabase
          .from("wallets")
          .update({ solde: sellerWallet.solde + montant })
          .eq("id", sellerWallet.id);
      }
    } else {
      await supabase.from("wallets").insert({
        user_id: vendeur_id,
        devise,
        solde: montant,
      });
    }

    // Generate reference
    const ref = `MKT-${Date.now().toString(36).toUpperCase()}`;

    // Create commande
    const { data: commande, error: cmdErr } = await supabase
      .from("commandes")
      .insert({
        acheteur_id: user.id,
        boutique_id: boutique.id,
        produit_id: produit.id,
        vendeur_id,
        montant,
        devise,
        statut: "payee",
        methode_paiement: "binq_wallet",
        reference: ref,
        note: note?.trim() || null,
      })
      .select()
      .single();

    if (cmdErr) throw cmdErr;

    // Update product sales count + stock
    const productUpdates: Record<string, any> = { ventes: (produit.ventes || 0) + 1 };
    if (produit.stock !== null) productUpdates.stock = produit.stock - 1;
    await supabase.from("produits").update(productUpdates).eq("id", produit.id);

    // Create transaction records
    await supabase.from("transactions").insert([
      {
        user_id: user.id,
        type: "achat_marketplace",
        montant: -montant,
        devise,
        description: `Achat: ${produit.nom} — ${boutique.nom}`,
        reference: ref,
        statut: "complete",
      },
      {
        user_id: vendeur_id,
        type: "vente_marketplace",
        montant,
        devise,
        description: `Vente: ${produit.nom}`,
        reference: ref,
        statut: "complete",
      },
    ]);

    // Notifications
    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("prenom, nom")
      .eq("id", user.id)
      .single();

    const buyerName = buyerProfile ? `${buyerProfile.prenom} ${buyerProfile.nom}` : "Un acheteur";

    try {
      await supabase.from("notifications").insert({
        user_id: vendeur_id,
        titre: "Nouvelle vente !",
        message: `${buyerName} a acheté "${produit.nom}" pour ${montant} ${devise}`,
        type: "marketplace",
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({
      commande,
      reference: ref,
      produit: { nom: produit.nom, image_url: produit.image_url },
      boutique: { nom: boutique.nom },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
