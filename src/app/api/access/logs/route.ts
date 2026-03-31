import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

// GET — Historique des logs + stats
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get("space_id");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = supabase();

    // Récupérer les espaces de l'utilisateur
    const { data: spaces } = await db
      .from("access_spaces")
      .select("id")
      .eq("user_id", user.id);

    if (!spaces?.length) {
      return NextResponse.json({ logs: [], stats: { total: 0, autorises: 0, refuses: 0, presents: 0 } });
    }

    const spaceIds = spaceId ? [spaceId] : spaces.map((s) => s.id);

    // Logs
    const { data: logs, error } = await db
      .from("access_logs")
      .select("*, access_members(nom, prenom, role, photo_url), access_spaces(nom)")
      .in("space_id", spaceIds)
      .order("scanned_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Stats aujourd'hui
    const today = new Date().toISOString().split("T")[0];
    const { data: todayLogs } = await db
      .from("access_logs")
      .select("statut, member_id, type")
      .in("space_id", spaceIds)
      .gte("scanned_at", today + "T00:00:00")
      .lte("scanned_at", today + "T23:59:59");

    const autorises = todayLogs?.filter((l) => l.statut === "autorise") || [];
    const refuses = todayLogs?.filter((l) => l.statut === "refuse") || [];

    // Personnes présentes = dernière entrée sans sortie ultérieure
    const memberLastAction = new Map<string, string>();
    const sortedLogs = [...(todayLogs || [])].sort((a, b) => 0); // déjà trié
    for (const log of todayLogs || []) {
      if (log.member_id && log.statut === "autorise") {
        memberLastAction.set(log.member_id, log.type);
      }
    }
    const presents = Array.from(memberLastAction.values()).filter((t) => t === "entree").length;

    return NextResponse.json({
      logs,
      stats: {
        total: todayLogs?.length || 0,
        autorises: autorises.length,
        refuses: refuses.length,
        presents,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
