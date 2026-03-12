import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import { type DeviseCode, DEVISES, DEFAULT_DEVISE } from "@/lib/currencies";
import crypto from "crypto";
import { generateQRCode } from "@/lib/qr-universal";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── GET : lister mes payment links ──
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("payment_links")
    .select("*")
    .eq("createur_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur fetch payment links:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ links: data || [] });
}

// ── POST : créer un payment link ──
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { montant, description, devise: rawDevise } = body;

  const devise: DeviseCode = (rawDevise && DEVISES[rawDevise as DeviseCode]) ? (rawDevise as DeviseCode) : DEFAULT_DEVISE;

  // Montant optionnel (null = montant libre)
  if (montant !== undefined && montant !== null) {
    if (typeof montant !== "number" || montant <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }
  }

  const supabase = getServiceClient();

  // Générer un code unique
  const code = crypto.randomBytes(8).toString("hex");

  const { data, error } = await supabase
    .from("payment_links")
    .insert({
      createur_id: user.id,
      code,
      montant: montant || null,
      devise,
      description: description || null,
      statut: "actif",
      usage_unique: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur création payment link:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-generate universal QR code for the payment link
  if (data) {
    await supabase.from("qr_codes").insert({
      code: generateQRCode(),
      type: "paiement",
      payment_link_id: data.id,
      user_id: user.id,
      label: description || "Paiement",
    });
  }

  return NextResponse.json({ link: data });
}

// ── DELETE : supprimer / annuler un payment link ──
export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Vérifier que le lien appartient à l'utilisateur
  const { data: link } = await supabase
    .from("payment_links")
    .select("id, createur_id")
    .eq("id", id)
    .single();

  if (!link || link.createur_id !== user.id) {
    return NextResponse.json({ error: "Lien non trouvé" }, { status: 404 });
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
