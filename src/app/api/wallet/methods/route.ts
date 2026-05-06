import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const VALID_TYPES = ["momo_mtn", "moov_money", "bank_transfer"] as const;

/**
 * GET /api/wallet/methods
 * Liste les moyens de retrait de l'utilisateur.
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const supabase = getServiceClient();

  const { data: methods, error } = await supabase
    .from("withdrawal_methods")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .in("type", VALID_TYPES as unknown as string[])
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ methods: methods || [] });
}

/**
 * POST /api/wallet/methods
 * Ajouter un moyen de retrait.
 * Body: { type, numero, label?, nom_titulaire?, is_default? }
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { type, numero, label, nom_titulaire, is_default } = body;

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }
  if (!numero || numero.trim().length < 8) {
    return NextResponse.json({ error: "Numéro invalide" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Si is_default, retirer le default des autres
  if (is_default) {
    await supabase
      .from("withdrawal_methods")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .eq("is_active", true);
  }

  // Générer le label automatiquement si pas fourni
  const typeLabels: Record<string, string> = {
    momo_mtn: "MTN MoMo",
    moov_money: "Moov Money",
    bank_transfer: "Virement bancaire",
  };
  const autoLabel = label || `${typeLabels[type]} ${numero.slice(-4)}`;

  const { data: method, error } = await supabase
    .from("withdrawal_methods")
    .insert({
      user_id: user.id,
      type,
      numero: numero.trim(),
      label: autoLabel,
      nom_titulaire: nom_titulaire || null,
      is_default: is_default || false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ method });
}

/**
 * DELETE /api/wallet/methods?id=xxx
 * Désactiver un moyen de retrait.
 */
export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const methodId = searchParams.get("id");

  if (!methodId) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { error } = await supabase
    .from("withdrawal_methods")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", methodId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
