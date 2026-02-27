import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import { forceFlushFees } from "@/lib/admin-fees";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const ADMIN_EMAILS = [
  "admin@binq.fr",
  "jerome@binq.fr",
  // Ajouter les emails admin ici
];

/**
 * GET /api/admin/revenue
 * Retourne le résumé des commissions admin.
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const supabase = getServiceClient();

  // Total pending
  const { data: pending } = await supabase
    .from("admin_fees")
    .select("montant")
    .eq("stripe_status", "pending");

  const totalPending = (pending || []).reduce((s, f) => s + Number(f.montant), 0);

  // Total sent
  const { data: sent } = await supabase
    .from("admin_fees")
    .select("montant")
    .eq("stripe_status", "sent");

  const totalSent = (sent || []).reduce((s, f) => s + Number(f.montant), 0);

  // By source
  const { data: allFees } = await supabase
    .from("admin_fees")
    .select("source, montant, stripe_status")
    .order("created_at", { ascending: false })
    .limit(200);

  const bySource: Record<string, number> = {};
  (allFees || []).forEach((f) => {
    bySource[f.source] = (bySource[f.source] || 0) + Number(f.montant);
  });

  // Recent
  const { data: recent } = await supabase
    .from("admin_fees")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    totalPending: Math.round(totalPending * 100) / 100,
    totalSent: Math.round(totalSent * 100) / 100,
    totalAll: Math.round((totalPending + totalSent) * 100) / 100,
    pendingCount: (pending || []).length,
    sentCount: (sent || []).length,
    bySource,
    recent: recent || [],
  });
}

/**
 * POST /api/admin/revenue
 * Force le flush de toutes les fees pending vers Stripe.
 */
export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const result = await forceFlushFees();
  return NextResponse.json(result);
}
