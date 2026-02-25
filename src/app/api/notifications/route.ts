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

// ── GET : récupérer les notifications de l'utilisateur ──
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, titre, message, lu, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Erreur fetch notifications:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compter les non-lues
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("lu", false);

  return NextResponse.json({
    notifications: data || [],
    unreadCount: count || 0,
  });
}

// ── PATCH : marquer des notifications comme lues ──
export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { ids, all } = body; // ids: string[] ou all: true

  const supabase = getServiceClient();

  if (all) {
    // Tout marquer comme lu
    const { error } = await supabase
      .from("notifications")
      .update({ lu: true })
      .eq("user_id", user.id)
      .eq("lu", false);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (ids && Array.isArray(ids) && ids.length > 0) {
    // Marquer certaines comme lues
    const { error } = await supabase
      .from("notifications")
      .update({ lu: true })
      .eq("user_id", user.id)
      .in("id", ids);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ── DELETE : supprimer une notification ──
export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const supabase = getServiceClient();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
