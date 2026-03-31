import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

// POST — Pointeuse self-service (public, sans auth)
// Body: { space_code, pin }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { space_code, pin } = body;

    if (!space_code || !pin) {
      return NextResponse.json({ error: "Code espace et PIN requis" }, { status: 400 });
    }

    // 1. Trouver l'espace par space_code
    const { data: space } = await supabase()
      .from("access_spaces")
      .select("*")
      .eq("space_code", space_code)
      .eq("mode", "pointeuse")
      .single();

    if (!space) {
      return NextResponse.json({
        statut: "refuse",
        message: "Espace non trouvé ou pas en mode pointeuse",
      });
    }

    if (!space.actif) {
      return NextResponse.json({
        statut: "refuse",
        message: "Cet espace est désactivé",
      });
    }

    // 2. Trouver le membre par PIN dans cet espace
    const { data: member } = await supabase()
      .from("access_members")
      .select("*")
      .eq("space_id", space.id)
      .eq("pin", pin)
      .single();

    if (!member) {
      return NextResponse.json({
        statut: "refuse",
        message: "PIN incorrect",
      });
    }

    // 3. Vérifier badge actif
    if (!member.actif) {
      await logAccess(member.id, space.id, "entree", "refuse", "Badge désactivé");
      return NextResponse.json({
        statut: "refuse",
        message: "Votre badge est désactivé",
        member: { nom: member.nom, prenom: member.prenom, role: member.role },
      });
    }

    // 4. Vérifier période
    const now = new Date();
    if (member.date_debut && new Date(member.date_debut) > now) {
      await logAccess(member.id, space.id, "entree", "refuse", "Badge pas encore actif");
      return NextResponse.json({
        statut: "refuse",
        message: "Votre badge n'est pas encore actif",
        member: { nom: member.nom, prenom: member.prenom, role: member.role },
      });
    }
    if (member.date_fin && new Date(member.date_fin) < now) {
      await logAccess(member.id, space.id, "entree", "refuse", "Badge expiré");
      return NextResponse.json({
        statut: "refuse",
        message: "Votre badge a expiré",
        member: { nom: member.nom, prenom: member.prenom, role: member.role },
      });
    }

    // 5. Vérifier jour
    const joursMap: Record<number, string> = {
      0: "dimanche", 1: "lundi", 2: "mardi", 3: "mercredi",
      4: "jeudi", 5: "vendredi", 6: "samedi",
    };
    const jourActuel = joursMap[now.getDay()];
    if (space.jours_actifs && !space.jours_actifs.includes(jourActuel)) {
      await logAccess(member.id, space.id, "entree", "refuse", `Fermé le ${jourActuel}`);
      return NextResponse.json({
        statut: "refuse",
        message: `L'espace est fermé le ${jourActuel}`,
        member: { nom: member.nom, prenom: member.prenom, role: member.role },
      });
    }

    // 6. Vérifier horaires
    const heureActuelle = now.toTimeString().slice(0, 5);
    if (space.horaire_debut && space.horaire_fin) {
      if (heureActuelle < space.horaire_debut || heureActuelle > space.horaire_fin) {
        await logAccess(member.id, space.id, "entree", "refuse", "Hors horaires");
        return NextResponse.json({
          statut: "refuse",
          message: `Hors horaires (${space.horaire_debut} - ${space.horaire_fin})`,
          member: { nom: member.nom, prenom: member.prenom, role: member.role },
        });
      }
    }

    // 7. Déterminer automatiquement entrée ou sortie
    // Vérifier le dernier log du membre aujourd'hui
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: lastLog } = await supabase()
      .from("access_logs")
      .select("type")
      .eq("member_id", member.id)
      .eq("space_id", space.id)
      .eq("statut", "autorise")
      .gte("scanned_at", todayStart.toISOString())
      .order("scanned_at", { ascending: false })
      .limit(1)
      .single();

    // Si dernier log est "entree" → c'est une sortie, sinon c'est une entrée
    const type = lastLog?.type === "entree" ? "sortie" : "entree";

    // 8. Enregistrer
    const { data: log } = await logAccess(member.id, space.id, type, "autorise", null);

    return NextResponse.json({
      statut: "autorise",
      type,
      message: type === "entree"
        ? `Bienvenue, ${member.prenom} ! Entrée enregistrée.`
        : `Au revoir, ${member.prenom} ! Sortie enregistrée.`,
      member: { nom: member.nom, prenom: member.prenom, role: member.role },
      heure: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      log_id: log?.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

async function logAccess(
  memberId: string,
  spaceId: string,
  type: string,
  statut: string,
  raisonRefus: string | null
) {
  const { data } = await supabase()
    .from("access_logs")
    .insert({
      member_id: memberId,
      space_id: spaceId,
      type,
      statut,
      raison_refus: raisonRefus,
    })
    .select()
    .single();
  return { data };
}
