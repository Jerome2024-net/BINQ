/**
 * Système de contraintes financières pour Binq
 * - Score de fiabilité (0-100)
 * - Caution (blocage / restitution / saisie)
 * - Pénalités automatiques
 * - Vérification d'éligibilité
 */

import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ========================
// Types
// ========================
export interface ScoreFiabilite {
  userId: string;
  score: number;
  totalPaiements: number;
  paiementsATemps: number;
  paiementsRetard: number;
  defaillances: number;
  niveau: "excellent" | "bon" | "moyen" | "faible" | "bloque";
}

export interface Penalite {
  id: string;
  userId: string;
  tontineId: string;
  tourId: string;
  montant: number;
  raison: string;
  statut: "appliquee" | "payee" | "annulee";
  dateCreation: string;
}

export interface Caution {
  id: string;
  userId: string;
  tontineId: string;
  montant: number;
  statut: "bloquee" | "restituee" | "saisie";
  dateCreation: string;
  dateLiberation?: string;
}

// ========================
// Score de fiabilité
// ========================
export async function calculerScore(userId: string): Promise<ScoreFiabilite> {
  const supabase = getServiceClient();

  // Récupérer les paiements de l'utilisateur
  const { data: paiements } = await supabase
    .from("paiements")
    .select("*")
    .eq("membre_id", userId);

  const total = paiements?.length || 0;
  let aTemps = 0;
  let retard = 0;
  let defaillancesCount = 0;

  if (paiements) {
    for (const p of paiements) {
      if (p.statut === "confirme") {
        aTemps++;
      } else if (p.statut === "echoue") {
        defaillancesCount++;
      }
    }
  }

  // Compter les défaillances enregistrées
  const { data: defaillances } = await supabase
    .from("defaillances")
    .select("id")
    .eq("user_id", userId);

  defaillancesCount += defaillances?.length || 0;

  // Compter pénalités non payées
  const { data: penalites } = await supabase
    .from("penalites")
    .select("id, montant")
    .eq("user_id", userId)
    .eq("statut", "appliquee");

  const penalitesNonPayees = penalites?.length || 0;

  // Calcul du score
  let score = 100;
  if (total > 0) {
    const ratioATemps = aTemps / total;
    const ratioDefaillance = defaillancesCount / total;
    score = Math.round(ratioATemps * 100 - ratioDefaillance * 50);
  }
  // Malus pénalités
  score = Math.max(0, score - penalitesNonPayees * 5);
  score = Math.min(100, Math.max(0, score));

  let niveau: ScoreFiabilite["niveau"];
  if (score >= 80) niveau = "excellent";
  else if (score >= 60) niveau = "bon";
  else if (score >= 40) niveau = "moyen";
  else if (score >= 20) niveau = "faible";
  else niveau = "bloque";

  // Persister le score dans le profil
  await supabase
    .from("profiles")
    .update({
      score_fiabilite: score,
      niveau_fiabilite: niveau,
    })
    .eq("id", userId);

  return {
    userId,
    score,
    totalPaiements: total,
    paiementsATemps: aTemps,
    paiementsRetard: retard,
    defaillances: defaillancesCount,
    niveau,
  };
}

export function getNiveauColor(niveau: ScoreFiabilite["niveau"]): string {
  switch (niveau) {
    case "excellent": return "#10b981";
    case "bon": return "#22c55e";
    case "moyen": return "#f59e0b";
    case "faible": return "#ef4444";
    case "bloque": return "#991b1b";
  }
}

export function getNiveauLabel(niveau: ScoreFiabilite["niveau"]): string {
  switch (niveau) {
    case "excellent": return "Excellent";
    case "bon": return "Bon";
    case "moyen": return "Moyen";
    case "faible": return "Faible";
    case "bloque": return "Bloqué";
  }
}

// ========================
// Caution
// ========================
export async function bloquerCaution(
  userId: string,
  tontineId: string,
  montant: number
): Promise<{ success: boolean; cautionId?: string; error?: string }> {
  const supabase = getServiceClient();

  // Vérifier le solde du wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!wallet || wallet.solde < montant) {
    return {
      success: false,
      error: `Solde insuffisant. Vous devez avoir ${montant}€ sur votre portefeuille pour la caution.`,
    };
  }

  // Débiter le wallet
  const { error: walletError } = await supabase
    .from("wallets")
    .update({
      solde: wallet.solde - montant,
      solde_bloque: (wallet.solde_bloque || 0) + montant,
    })
    .eq("user_id", userId);

  if (walletError) {
    return { success: false, error: "Erreur lors du blocage de la caution" };
  }

  // Créer la caution
  const { data: caution, error } = await supabase
    .from("cautions")
    .insert({
      user_id: userId,
      tontine_id: tontineId,
      montant,
      statut: "bloquee",
    })
    .select()
    .single();

  if (error) {
    // Annuler le débit
    await supabase
      .from("wallets")
      .update({
        solde: wallet.solde,
        solde_bloque: wallet.solde_bloque || 0,
      })
      .eq("user_id", userId);
    return { success: false, error: "Erreur création caution" };
  }

  // Transaction de caution
  await supabase.from("transactions").insert({
    wallet_id: wallet.id,
    user_id: userId,
    type: "penalite",
    montant,
    solde_avant: wallet.solde,
    solde_apres: wallet.solde - montant,
    devise: "EUR",
    statut: "confirme",
    description: "Caution bloquée pour la tontine",
    meta_tontine_id: tontineId,
    reference: `CAUTION-${Date.now().toString(36).toUpperCase()}`,
    confirmed_at: new Date().toISOString(),
  });

  return { success: true, cautionId: caution.id };
}

export async function restituerCaution(
  userId: string,
  tontineId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceClient();

  const { data: caution } = await supabase
    .from("cautions")
    .select("*")
    .eq("user_id", userId)
    .eq("tontine_id", tontineId)
    .eq("statut", "bloquee")
    .single();

  if (!caution) {
    return { success: false, error: "Aucune caution trouvée" };
  }

  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (wallet) {
    await supabase
      .from("wallets")
      .update({
        solde: wallet.solde + caution.montant,
        solde_bloque: Math.max(0, (wallet.solde_bloque || 0) - caution.montant),
      })
      .eq("user_id", userId);

    // Transaction de restitution
    await supabase.from("transactions").insert({
      wallet_id: wallet.id,
      user_id: userId,
      type: "remboursement",
      montant: caution.montant,
      solde_avant: wallet.solde,
      solde_apres: wallet.solde + caution.montant,
      devise: "EUR",
      statut: "confirme",
      description: "Caution restituée - aucun retard",
      meta_tontine_id: tontineId,
      reference: `REST-CAUTION-${Date.now().toString(36).toUpperCase()}`,
      confirmed_at: new Date().toISOString(),
    });
  }

  await supabase
    .from("cautions")
    .update({
      statut: "restituee",
      date_liberation: new Date().toISOString(),
    })
    .eq("id", caution.id);

  return { success: true };
}

export async function saisirCaution(
  userId: string,
  tontineId: string,
  raison: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceClient();

  const { data: caution } = await supabase
    .from("cautions")
    .select("*")
    .eq("user_id", userId)
    .eq("tontine_id", tontineId)
    .eq("statut", "bloquee")
    .single();

  if (!caution) {
    return { success: false, error: "Aucune caution trouvée" };
  }

  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (wallet) {
    await supabase
      .from("wallets")
      .update({
        solde_bloque: Math.max(0, (wallet.solde_bloque || 0) - caution.montant),
      })
      .eq("user_id", userId);
  }

  await supabase
    .from("cautions")
    .update({
      statut: "saisie",
      date_liberation: new Date().toISOString(),
    })
    .eq("id", caution.id);

  return { success: true };
}

// ========================
// Pénalités
// ========================
export async function appliquerPenalite(
  userId: string,
  tontineId: string,
  tourId: string,
  montant: number,
  raison: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceClient();

  const { error } = await supabase.from("penalites").insert({
    user_id: userId,
    tontine_id: tontineId,
    tour_id: tourId,
    montant,
    raison,
    statut: "appliquee",
  });

  if (error) {
    return { success: false, error: "Erreur création pénalité" };
  }

  // Débiter du wallet si solde suffisant
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (wallet && wallet.solde >= montant) {
    await supabase
      .from("wallets")
      .update({ solde: wallet.solde - montant })
      .eq("user_id", userId);

    await supabase
      .from("penalites")
      .update({ statut: "payee" })
      .eq("user_id", userId)
      .eq("tontine_id", tontineId)
      .eq("tour_id", tourId)
      .eq("statut", "appliquee");

    // Transaction
    await supabase.from("transactions").insert({
      wallet_id: wallet.id,
      user_id: userId,
      type: "penalite",
      montant,
      solde_avant: wallet.solde,
      solde_apres: wallet.solde - montant,
      devise: "EUR",
      statut: "confirme",
      description: `Pénalité : ${raison}`,
      meta_tontine_id: tontineId,
      meta_tour_id: tourId,
      reference: `PEN-${Date.now().toString(36).toUpperCase()}`,
      confirmed_at: new Date().toISOString(),
    });
  }

  // Recalculer le score
  await calculerScore(userId);

  return { success: true };
}

// ========================
// Vérification éligibilité
// ========================
export async function verifierEligibilite(
  userId: string
): Promise<{ eligible: boolean; raison?: string; score: ScoreFiabilite }> {
  const supabase = getServiceClient();
  const score = await calculerScore(userId);

  if (score.niveau === "bloque") {
    return {
      eligible: false,
      raison: `Votre score de fiabilité est trop bas (${score.score}/100). Régularisez vos pénalités.`,
      score,
    };
  }

  const { data: penalites } = await supabase
    .from("penalites")
    .select("montant")
    .eq("user_id", userId)
    .eq("statut", "appliquee");

  if (penalites && penalites.length > 0) {
    const totalPenalites = penalites.reduce((s, p) => s + p.montant, 0);
    return {
      eligible: false,
      raison: `Vous avez ${penalites.length} pénalité(s) non payée(s) (${totalPenalites}€).`,
      score,
    };
  }

  return { eligible: true, score };
}
