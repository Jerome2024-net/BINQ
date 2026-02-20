import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── POST : dépôt ou retrait ──
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { epargne_id, type, montant, description } = body;

  if (!epargne_id || !type || !montant || montant <= 0) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  if (!["depot_wallet", "depot_carte", "retrait"].includes(type)) {
    return NextResponse.json({ error: "Type de transaction invalide" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Récupérer le compte
  const { data: epargne } = await supabase
    .from("epargnes")
    .select("*")
    .eq("id", epargne_id)
    .eq("user_id", user.id)
    .single();

  if (!epargne) {
    return NextResponse.json({ error: "Compte d'épargne non trouvé" }, { status: 404 });
  }

  if (epargne.statut !== "active") {
    return NextResponse.json({ error: "Ce compte n'est pas actif" }, { status: 400 });
  }

  const soldeActuel = Number(epargne.solde);
  let nouveauSolde: number;
  let stripePaymentId: string | null = null;

  // ── RETRAIT ──
  if (type === "retrait") {
    // Vérifier le blocage
    if (epargne.bloque_jusqu_a) {
      const dateBloquee = new Date(epargne.bloque_jusqu_a);
      if (new Date() < dateBloquee) {
        return NextResponse.json(
          { error: `Épargne bloquée jusqu'au ${dateBloquee.toLocaleDateString("fr-FR")}` },
          { status: 400 }
        );
      }
    }

    if (montant > soldeActuel) {
      return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
    }

    nouveauSolde = soldeActuel - montant;

    // Créditer le portefeuille
    const { data: profil } = await supabase
      .from("profiles")
      .select("solde_wallet")
      .eq("id", user.id)
      .single();

    await supabase
      .from("profiles")
      .update({ solde_wallet: (Number(profil?.solde_wallet) || 0) + montant })
      .eq("id", user.id);
  }

  // ── DÉPÔT PORTEFEUILLE ──
  else if (type === "depot_wallet") {
    // Vérifier le solde wallet
    const { data: profil } = await supabase
      .from("profiles")
      .select("solde_wallet")
      .eq("id", user.id)
      .single();

    const soldeWallet = Number(profil?.solde_wallet) || 0;
    if (montant > soldeWallet) {
      return NextResponse.json({ error: "Solde portefeuille insuffisant" }, { status: 400 });
    }

    // Débiter le wallet
    await supabase
      .from("profiles")
      .update({ solde_wallet: soldeWallet - montant })
      .eq("id", user.id);

    nouveauSolde = soldeActuel + montant;
  }

  // ── DÉPÔT CARTE ──
  else {
    // Trouver le customer Stripe
    const { data: profil } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profil?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Aucune carte enregistrée. Ajoutez d'abord un moyen de paiement." },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Récupérer la carte par défaut
    const paymentMethods = await stripe.paymentMethods.list({
      customer: profil.stripe_customer_id,
      type: "card",
      limit: 1,
    });

    if (!paymentMethods.data.length) {
      return NextResponse.json({ error: "Aucune carte trouvée" }, { status: 400 });
    }

    // Convertir XOF en centimes (XOF n'a pas de sous-unité mais Stripe attend des entiers)
    const montantStripe = Math.round(montant);

    try {
      const pi = await stripe.paymentIntents.create({
        amount: montantStripe,
        currency: "xof",
        customer: profil.stripe_customer_id,
        payment_method: paymentMethods.data[0].id,
        off_session: true,
        confirm: true,
        description: `Épargne Binq - ${epargne.nom}`,
        metadata: {
          type: "epargne_depot",
          epargne_id: epargne.id,
          user_id: user.id,
        },
      });

      if (pi.status !== "succeeded") {
        return NextResponse.json({ error: "Le paiement par carte a échoué" }, { status: 400 });
      }

      stripePaymentId = pi.id;
    } catch (err: unknown) {
      console.error("Stripe error:", err);
      const message = err instanceof Error ? err.message : "Erreur paiement";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    nouveauSolde = soldeActuel + montant;
  }

  // Mettre à jour le solde
  await supabase
    .from("epargnes")
    .update({ solde: nouveauSolde, updated_at: new Date().toISOString() })
    .eq("id", epargne_id);

  // Enregistrer la transaction
  const { data: tx, error: txError } = await supabase
    .from("epargne_transactions")
    .insert({
      epargne_id,
      user_id: user.id,
      type,
      montant: type === "retrait" ? -montant : montant,
      solde_apres: nouveauSolde,
      description: description || (type === "retrait" ? "Retrait vers portefeuille" : "Dépôt"),
      stripe_payment_id: stripePaymentId,
    })
    .select()
    .single();

  if (txError) {
    console.error("Erreur insertion transaction:", txError);
  }

  return NextResponse.json({
    success: true,
    transaction: tx,
    nouveau_solde: nouveauSolde,
  });
}

// ── GET : historique des transactions ──
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const epargneId = searchParams.get("epargne_id");

  const supabase = getServiceClient();

  let query = supabase
    .from("epargne_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (epargneId) {
    query = query.eq("epargne_id", epargneId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ transactions: data });
}
