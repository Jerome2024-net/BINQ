import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

const JOURS_MAP: Record<string, number> = {
  dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6,
};

// POST — Scanner un QR code d'accès
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { qr_code, space_id, type } = await req.json();

    if (!qr_code || !space_id) {
      return NextResponse.json({ error: "QR code et espace requis" }, { status: 400 });
    }

    const db = supabase();

    // 1. Trouver le membre par QR code
    const { data: member } = await db
      .from("access_members")
      .select("*, access_spaces!inner(nom, user_id)")
      .eq("qr_code", qr_code)
      .eq("space_id", space_id)
      .single();

    if (!member) {
      // Membre pas trouvé pour cet espace, log refus
      await db.from("access_logs").insert({
        member_id: null,
        space_id,
        type: type || "entree",
        statut: "refuse",
        raison_refus: "Badge inconnu ou espace non autorisé",
      });
      return NextResponse.json({
        statut: "refuse",
        raison: "Badge inconnu ou espace non autorisé",
      });
    }

    // Vérifier que l'espace appartient à l'utilisateur qui scanne
    if (member.access_spaces.user_id !== user.id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // 2. Badge actif ?
    if (!member.actif) {
      await db.from("access_logs").insert({
        member_id: member.id,
        space_id,
        type: type || "entree",
        statut: "refuse",
        raison_refus: "Badge désactivé",
      });
      return NextResponse.json({
        statut: "refuse",
        raison: "Badge désactivé",
        membre: { nom: member.nom, prenom: member.prenom, role: member.role },
      });
    }

    // 3. Dans la période ?
    const now = new Date();
    if (member.date_debut) {
      const debut = new Date(member.date_debut);
      if (now < debut) {
        await db.from("access_logs").insert({
          member_id: member.id, space_id,
          type: type || "entree", statut: "refuse",
          raison_refus: "Accès pas encore actif",
        });
        return NextResponse.json({
          statut: "refuse",
          raison: "Accès pas encore actif (début: " + member.date_debut + ")",
          membre: { nom: member.nom, prenom: member.prenom, role: member.role },
        });
      }
    }
    if (member.date_fin) {
      const fin = new Date(member.date_fin + "T23:59:59");
      if (now > fin) {
        await db.from("access_logs").insert({
          member_id: member.id, space_id,
          type: type || "entree", statut: "refuse",
          raison_refus: "Accès expiré",
        });
        return NextResponse.json({
          statut: "refuse",
          raison: "Accès expiré depuis le " + member.date_fin,
          membre: { nom: member.nom, prenom: member.prenom, role: member.role },
        });
      }
    }

    // 4. Vérifier l'espace (horaires et jours)
    const { data: space } = await db
      .from("access_spaces")
      .select("*")
      .eq("id", space_id)
      .single();

    if (space) {
      // Jour autorisé ?
      const jourActuel = Object.keys(JOURS_MAP).find(
        (k) => JOURS_MAP[k] === now.getDay()
      );
      if (space.jours_actifs && jourActuel && !space.jours_actifs.includes(jourActuel)) {
        await db.from("access_logs").insert({
          member_id: member.id, space_id,
          type: type || "entree", statut: "refuse",
          raison_refus: "Jour non autorisé (" + jourActuel + ")",
        });
        return NextResponse.json({
          statut: "refuse",
          raison: "Jour non autorisé (" + jourActuel + ")",
          membre: { nom: member.nom, prenom: member.prenom, role: member.role },
        });
      }

      // Horaire autorisé ?
      if (space.horaire_debut && space.horaire_fin) {
        const heureActuelle = now.toTimeString().slice(0, 5); // "HH:MM"
        if (heureActuelle < space.horaire_debut || heureActuelle > space.horaire_fin) {
          await db.from("access_logs").insert({
            member_id: member.id, space_id,
            type: type || "entree", statut: "refuse",
            raison_refus: `Hors horaires (${space.horaire_debut}-${space.horaire_fin})`,
          });
          return NextResponse.json({
            statut: "refuse",
            raison: `Hors horaires (${space.horaire_debut}-${space.horaire_fin})`,
            membre: { nom: member.nom, prenom: member.prenom, role: member.role },
          });
        }
      }
    }

    // 5. ✅ ACCÈS AUTORISÉ
    await db.from("access_logs").insert({
      member_id: member.id,
      space_id,
      type: type || "entree",
      statut: "autorise",
    });

    return NextResponse.json({
      statut: "autorise",
      membre: {
        id: member.id,
        nom: member.nom,
        prenom: member.prenom,
        role: member.role,
        photo_url: member.photo_url,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
