import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import { type DeviseCode, DEFAULT_DEVISE, formatMontant } from "@/lib/currencies";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const TAUX_FRAIS_RETRAIT = 0.01; // 1% de frais de retrait
const MIN_RETRAIT_XOF = 500;
const MIN_RETRAIT_EUR = 1;

/**
 * POST /api/wallet/withdraw
 * Demander un retrait vers un moyen de retrait.
 * Body: { method_id, montant, devise? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { method_id, montant } = body;
    const devise: DeviseCode = (body.devise || DEFAULT_DEVISE) as DeviseCode;

    // Validations
    if (!method_id) {
      return NextResponse.json({ error: "Moyen de retrait manquant" }, { status: 400 });
    }
    if (!montant || montant <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const minRetrait = devise === "XOF" ? MIN_RETRAIT_XOF : MIN_RETRAIT_EUR;
    if (montant < minRetrait) {
      return NextResponse.json({
        error: `Montant minimum: ${formatMontant(minRetrait, devise)}`,
      }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Vérifier que le moyen de retrait existe et appartient à l'utilisateur
    const { data: method } = await supabase
      .from("withdrawal_methods")
      .select("*")
      .eq("id", method_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!method) {
      return NextResponse.json({ error: "Moyen de retrait invalide" }, { status: 400 });
    }

    // Récupérer le wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("devise", devise)
      .single();

    if (!wallet) {
      return NextResponse.json({ error: "Wallet introuvable" }, { status: 400 });
    }

    // Calculer les frais
    const frais = Math.round(montant * TAUX_FRAIS_RETRAIT);
    const net = montant - frais;

    // Vérifier le solde disponible
    const soldeDisponible = (wallet.solde || 0) - (wallet.solde_bloque || 0);
    if (montant > soldeDisponible) {
      return NextResponse.json({
        error: `Solde insuffisant. Disponible: ${formatMontant(soldeDisponible, devise)}`,
      }, { status: 400 });
    }

    // Générer la référence
    const reference = `RET-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Débiter le wallet (bloquer le montant)
    const nouveauSolde = (wallet.solde || 0) - montant;
    const { error: updateErr } = await supabase
      .from("wallets")
      .update({ solde: nouveauSolde, updated_at: new Date().toISOString() })
      .eq("id", wallet.id);

    if (updateErr) {
      return NextResponse.json({ error: "Erreur débit wallet" }, { status: 500 });
    }

    // Créer la demande de retrait
    const { data: withdrawal, error: withdrawErr } = await supabase
      .from("withdrawals")
      .insert({
        user_id: user.id,
        wallet_id: wallet.id,
        method_id: method.id,
        montant,
        frais,
        net,
        devise,
        statut: "pending",
        reference,
      })
      .select()
      .single();

    if (withdrawErr) {
      // Rollback: recréditer le wallet
      await supabase
        .from("wallets")
        .update({ solde: wallet.solde })
        .eq("id", wallet.id);
      return NextResponse.json({ error: "Erreur création retrait" }, { status: 500 });
    }

    // Enregistrer la transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      wallet_id: wallet.id,
      type: "retrait",
      montant: -montant,
      devise,
      statut: "confirme",
      reference,
      description: `Retrait vers ${method.label}`,
      confirmed_at: new Date().toISOString(),
    });

    // Notification
    try {
      await supabase.from("notifications").insert({
        user_id: user.id,
        titre: "Retrait en cours",
        message: `Votre retrait de ${formatMontant(net, devise)} vers ${method.label} est en cours de traitement.`,
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        montant,
        frais,
        net,
        devise,
        statut: "pending",
        reference,
        method: {
          type: method.type,
          label: method.label,
          numero: method.numero,
        },
      },
      nouveau_solde: nouveauSolde,
    });
  } catch (err) {
    console.error("[wallet/withdraw] Erreur:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * GET /api/wallet/withdraw
 * Historique des retraits.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const supabase = getServiceClient();

  const { data: withdrawals, error } = await supabase
    .from("withdrawals")
    .select(`
      *,
      withdrawal_methods (type, label, numero)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ withdrawals: withdrawals || [] });
}
