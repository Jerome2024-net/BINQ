import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import { type DeviseCode, DEVISES, DEFAULT_DEVISE } from "@/lib/currencies";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── GET : lister mes terminaux marchands ──
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = getServiceClient();

  // Récupérer tous les payment_links du user dont la description commence par [MARCHAND]
  const { data, error } = await supabase
    .from("payment_links")
    .select("*")
    .eq("createur_id", user.id)
    .like("description", "[MARCHAND]%")
    .eq("statut", "actif")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur fetch terminaux marchands:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compter les paiements reçus sur ces links
  const codes = (data || []).map((d: Record<string, unknown>) => d.code as string);
  let totalReceived = 0;
  let paymentsCount = 0;

  if (codes.length > 0) {
    // Compter les liens payés (statut = paye) qui sont des terminaux marchands
    const { data: paidLinks } = await supabase
      .from("payment_links")
      .select("montant, devise")
      .eq("createur_id", user.id)
      .like("description", "[MARCHAND]%")
      .eq("statut", "paye");

    if (paidLinks) {
      paymentsCount = paidLinks.length;
      totalReceived = paidLinks.reduce((sum: number, l: Record<string, unknown>) => sum + Number(l.montant || 0), 0);
    }
  }

  const terminals = (data || []).map((d: Record<string, unknown>) => ({
    id: d.id,
    code: d.code,
    montant: d.montant,
    devise: d.devise || "XOF",
    description: (d.description as string || "").replace("[MARCHAND] ", ""),
    usage_unique: d.usage_unique,
    created_at: d.created_at,
  }));

  return NextResponse.json({
    terminals,
    stats: {
      totalTerminals: terminals.length,
      totalReceived,
      paymentsCount,
    },
  });
}

// ── POST : créer un terminal marchand ──
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { montant, description, devise: rawDevise, qrType, terminal } = body;

  const devise: DeviseCode = (rawDevise && DEVISES[rawDevise as DeviseCode]) ? (rawDevise as DeviseCode) : DEFAULT_DEVISE;

  if (qrType === "fixe" || terminal) {
    if (!montant || typeof montant !== "number" || montant <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }
  }

  const supabase = getServiceClient();

  // Code marchand unique (MRC-XXXXXX)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "MRC-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

  // terminal = true → POS mode, QR usage unique (devient "paye" après 1 paiement)
  // terminal = false → QR permanent réutilisable
  const isTerminal = terminal === true;

  const { data, error } = await supabase
    .from("payment_links")
    .insert({
      createur_id: user.id,
      code,
      montant: (qrType === "fixe" || isTerminal) ? montant : null,
      devise,
      description: `[MARCHAND] ${description || "Terminal de paiement"}`,
      statut: "actif",
      usage_unique: isTerminal, // true = POS one-time, false = permanent
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur création terminal marchand:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    terminal: {
      id: data.id,
      code: data.code,
      montant: data.montant,
      devise: data.devise,
      description: description || "Terminal de paiement",
    },
  });
}

// ── DELETE : désactiver un terminal marchand ──
export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: link } = await supabase
    .from("payment_links")
    .select("id, createur_id")
    .eq("id", id)
    .single();

  if (!link || link.createur_id !== user.id) {
    return NextResponse.json({ error: "Terminal non trouvé" }, { status: 404 });
  }

  const { error } = await supabase
    .from("payment_links")
    .update({ statut: "annule" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
