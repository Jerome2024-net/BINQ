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

// GET /api/events/[id]/team — Liste de l'équipe de scan
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const { id } = params;

    // Vérifier que l'utilisateur est propriétaire ou membre de l'équipe
    const { data: event } = await supabase
      .from("events")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    const isOwner = event.user_id === user.id;
    if (!isOwner) {
      const { data: membership } = await supabase
        .from("scan_team")
        .select("id")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();
      if (!membership) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
    }

    const { data: team, error } = await supabase
      .from("scan_team")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Récupérer les profils des membres
    const userIds = team?.map((t) => t.user_id) || [];
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("profiles")
        .select("id, nom, prenom, email, telephone")
        .in("id", userIds);
      profiles = users || [];
    }

    const enrichedTeam = (team || []).map((t) => {
      const profile = profiles.find((p) => p.id === t.user_id);
      return {
        ...t,
        profile: profile || null,
      };
    });

    return NextResponse.json({ team: enrichedTeam, is_owner: isOwner });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/events/[id]/team — Ajouter un contrôleur par email ou téléphone
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const { id } = params;
    const body = await req.json();
    const { email, telephone } = body;

    if (!email?.trim() && !telephone?.trim()) {
      return NextResponse.json({ error: "Email ou téléphone requis" }, { status: 400 });
    }

    // Vérifier propriété de l'événement
    const { data: event } = await supabase
      .from("events")
      .select("id, user_id, nom")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    // Chercher l'utilisateur par email ou téléphone dans profiles
    let query = supabase.from("profiles").select("id, nom, prenom, email, telephone");
    if (email?.trim()) {
      query = query.eq("email", email.trim().toLowerCase());
    } else if (telephone?.trim()) {
      query = query.eq("telephone", telephone.trim());
    }
    const { data: targetUser } = await query.single();

    if (!targetUser) {
      return NextResponse.json({
        error: "Utilisateur non trouvé. Il doit d'abord créer un compte Binq.",
      }, { status: 404 });
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({
        error: "Vous êtes déjà l'organisateur",
      }, { status: 400 });
    }

    // Vérifier si déjà dans l'équipe
    const { data: existing } = await supabase
      .from("scan_team")
      .select("id, is_active")
      .eq("event_id", id)
      .eq("user_id", targetUser.id)
      .single();

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json({ error: "Déjà dans l'équipe" }, { status: 400 });
      }
      // Réactiver
      await supabase.from("scan_team").update({ is_active: true }).eq("id", existing.id);
      return NextResponse.json({
        success: true,
        message: `${targetUser.prenom || ""} ${targetUser.nom || ""} réactivé dans l'équipe`,
      });
    }

    // Ajouter
    const { error: insertError } = await supabase
      .from("scan_team")
      .insert({
        event_id: id,
        user_id: targetUser.id,
        added_by: user.id,
        role: "scanner",
      });

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: `${targetUser.prenom || ""} ${targetUser.nom || ""} ajouté à l'équipe`,
      member: { id: targetUser.id, nom: targetUser.nom, prenom: targetUser.prenom },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/events/[id]/team — Retirer un contrôleur
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("member_id");

    if (!memberId) {
      return NextResponse.json({ error: "member_id requis" }, { status: 400 });
    }

    // Vérifier propriété
    const { data: event } = await supabase
      .from("events")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Désactiver (soft delete)
    await supabase
      .from("scan_team")
      .update({ is_active: false })
      .eq("event_id", id)
      .eq("user_id", memberId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
