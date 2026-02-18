"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Tontine, Tour, Paiement, Membre, User, Defaillance, Invitation, profileToUser } from "@/types";
import { useAuth } from "./AuthContext";
import { createClient } from "@/lib/supabase/client";

// ========================
// Types
// ========================
interface DefaillanceResult {
  success: boolean;
  error?: string;
  defaillantNom?: string;
  membresRembourses?: number;
}

interface TontineContextType {
  tontines: Tontine[];
  isLoading: boolean;
  refreshTontines: () => Promise<void>;
  creerTontine: (data: CreerTontineData) => Promise<Tontine>;
  supprimerTontine: (id: string) => Promise<void>;
  rejoindreGroupe: (tontineId: string) => Promise<{ success: boolean; error?: string }>;
  quitterGroupe: (tontineId: string) => Promise<void>;
  demarrerTontine: (tontineId: string) => Promise<void>;
  effectuerPaiement: (tontineId: string, tourId: string, methode: string) => Promise<{ success: boolean; reference: string }>;
  inviterMembre: (tontineId: string, email: string, telephone: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  exclureMembre: (tontineId: string, membreId: string) => Promise<void>;
  signalerDefaillance: (tontineId: string, membreId: string) => Promise<DefaillanceResult>;
  getMesTontines: () => Tontine[];
  getTontineById: (id: string) => Tontine | undefined;
  getAllPaiements: () => (Paiement & { tontine: Tontine; tour: Tour })[];
  // Invitations
  invitationsRecues: Invitation[];
  invitationsEnvoyees: Invitation[];
  accepterInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  refuserInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  getInvitationByCode: (code: string) => Promise<Invitation | null>;
  getInvitationsPourTontine: (tontineId: string) => Invitation[];
  refreshInvitations: () => Promise<void>;
}

interface CreerTontineData {
  nom: string;
  description: string;
  montantCotisation: number;
  devise: string;
  frequence: "hebdomadaire" | "bimensuel" | "mensuel";
  membresMax: number;
  dateDebut: string;
  regles?: string;
  emoji?: string;
  couleur?: string;
  categorie?: "famille" | "amis" | "collegues" | "communaute" | "projet" | "autre" | string;
  visibilite?: "publique" | "privee";
}

const TontineContext = createContext<TontineContextType | undefined>(undefined);

export function TontineProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [invitationsRecues, setInvitationsRecues] = useState<Invitation[]>([]);
  const [invitationsEnvoyees, setInvitationsEnvoyees] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // ========================
  // Chargement des tontines avec toutes les relations
  // ========================
  const loadTontines = useCallback(async () => {
    try {
      // 1. Charger toutes les tontines
      const { data: tontineRows, error: tontineError } = await supabase
        .from("tontines")
        .select("*")
        .order("created_at", { ascending: false });

      if (tontineError || !tontineRows || tontineRows.length === 0) {
        setTontines([]);
        return;
      }

      // eslint-disable-next-line
      const tontineIds = tontineRows.map((t: any) => t.id as string);
      // eslint-disable-next-line
      const organisateurIds = Array.from(new Set(tontineRows.map((t: any) => t.organisateur_id as string)));

      // 2. Batch: charger TOUT en parallèle (4 requêtes au lieu de N*4)
      const [profilesRes, membresRes, toursRes, paiementsRes] = await Promise.all([
        supabase.from("profiles").select("*").in("id", organisateurIds),
        supabase.from("membres").select("*, profiles(*)").in("tontine_id", tontineIds),
        supabase.from("tours").select("*, profiles(*)").in("tontine_id", tontineIds).order("numero", { ascending: true }),
        supabase.from("paiements").select("*, profiles(*)").in("tontine_id", tontineIds),
      ]);

      // Index par ID pour lookup O(1)
      // eslint-disable-next-line
      const profilesMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
      // eslint-disable-next-line
      const membresByTontine = new Map<string, any[]>();
      // eslint-disable-next-line
      for (const m of (membresRes.data || []) as any[]) {
        const arr = membresByTontine.get(m.tontine_id) || [];
        arr.push(m);
        membresByTontine.set(m.tontine_id, arr);
      }
      // eslint-disable-next-line
      const toursByTontine = new Map<string, any[]>();
      // eslint-disable-next-line
      for (const tour of (toursRes.data || []) as any[]) {
        const arr = toursByTontine.get(tour.tontine_id) || [];
        arr.push(tour);
        toursByTontine.set(tour.tontine_id, arr);
      }
      // eslint-disable-next-line
      const paiementsByTour = new Map<string, any[]>();
      // eslint-disable-next-line
      for (const p of (paiementsRes.data || []) as any[]) {
        const arr = paiementsByTour.get(p.tour_id) || [];
        arr.push(p);
        paiementsByTour.set(p.tour_id, arr);
      }

      // 3. Assembler sans requêtes supplémentaires
      // eslint-disable-next-line
      const fullTontines: Tontine[] = tontineRows.map((t: any) => {
        const membreRows = membresByTontine.get(t.id) || [];
        const membres: Membre[] = membreRows.map((m) => ({
          id: m.id,
          tontineId: m.tontine_id,
          user: profileToUser(m.profiles),
          userId: m.user_id,
          role: m.role,
          dateAdhesion: m.date_adhesion,
          statut: m.statut,
        }));

        const tourRows = toursByTontine.get(t.id) || [];
        const tours: Tour[] = tourRows.map((tour) => {
          const paiementRows = paiementsByTour.get(tour.id) || [];
          const paiements: Paiement[] = paiementRows.map((p) => ({
            id: p.id,
            tourId: p.tour_id,
            tontineId: p.tontine_id,
            membre: profileToUser(p.profiles),
            membreId: p.membre_id,
            montant: parseFloat(p.montant),
            datePaiement: p.date_paiement || "",
            methode: p.methode,
            statut: p.statut,
            reference: p.reference || undefined,
            stripePaymentIntentId: p.stripe_payment_intent_id || undefined,
          }));

          return {
            id: tour.id,
            tontineId: tour.tontine_id,
            numero: tour.numero,
            beneficiaire: profileToUser(tour.profiles),
            beneficiaireId: tour.beneficiaire_id,
            datePrevue: tour.date_prevue,
            dateEffective: tour.date_effective || undefined,
            montantTotal: parseFloat(tour.montant_total),
            statut: tour.statut,
            paiements,
          };
        });

        const orgProfile = profilesMap.get(t.organisateur_id);
        const membreOrg = membres.find(m => m.role === "organisateur");
        const organisateur: User = orgProfile
          ? profileToUser(orgProfile as Record<string, unknown>)
          : membreOrg?.user || {
              id: t.organisateur_id,
              nom: "",
              prenom: "",
              email: "",
              telephone: "",
              scoreConfiance: 50,
              badgeVerifie: false,
              nombreTontinesParticipees: 0,
              nombreTontinesOrganisees: 0,
              nombreToursRecus: 0,
              totalCotisationsPayees: 0,
              notificationsEmail: true,
              notificationsSms: false,
              profilPublic: true,
              dateInscription: "",
            };

        return {
          id: t.id,
          nom: t.nom,
          description: t.description || "",
          montantCotisation: parseFloat(t.montant_cotisation),
          devise: t.devise,
          frequence: t.frequence,
          nombreMembres: t.nombre_membres,
          membresMax: t.membres_max,
          dateDebut: t.date_debut,
          dateFin: t.date_fin || undefined,
          statut: t.statut,
          organisateur,
          organisateurId: t.organisateur_id,
          membres,
          tours,
          emoji: t.emoji || "💰",
          couleur: t.couleur || "emerald",
          categorie: t.categorie || "autre",
          visibilite: t.visibilite || "publique",
          image: t.image || "",
          motifAnnulation: t.motif_annulation || undefined,
          defaillantId: t.defaillant_id || undefined,
          dateAnnulation: t.date_annulation || undefined,
        } as Tontine;
      });

      setTontines(fullTontines);
    } catch {
      setTontines([]);
    }
  }, [supabase]);

  // ========================
  // Chargement des invitations
  // ========================
  const loadInvitations = useCallback(async () => {
    if (!user) {
      setInvitationsRecues([]);
      setInvitationsEnvoyees([]);
      return;
    }

    // Invitations reçues (où mon email correspond)
    const { data: recuesRows } = await supabase
      .from("invitations")
      .select("*")
      .eq("email", user.email.toLowerCase())
      .eq("statut", "en_attente")
      .order("created_at", { ascending: false });

    // Invitations envoyées
    const { data: envoyeesRows } = await supabase
      .from("invitations")
      .select("*")
      .eq("inviteur_id", user.id)
      .order("created_at", { ascending: false });

    const mapInvitation = async (row: Record<string, unknown>): Promise<Invitation> => {
      // Charger info tontine
      const { data: tontineRow } = await supabase
        .from("tontines")
        .select("nom, montant_cotisation, devise, frequence, nombre_membres, membres_max")
        .eq("id", row.tontine_id)
        .single();

      // Charger info inviteur
      const { data: inviteurRow } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", row.inviteur_id)
        .single();

      return {
        id: row.id as string,
        code: (row.code as string) || "",
        tontineId: row.tontine_id as string,
        inviteurId: row.inviteur_id as string,
        inviteur: inviteurRow ? profileToUser(inviteurRow) : undefined,
        email: row.email as string,
        telephone: (row.telephone as string) || "",
        statut: row.statut as Invitation["statut"],
        dateCreation: ((row.created_at as string) || new Date().toISOString()).split("T")[0],
        tontine: tontineRow ? {
          id: row.tontine_id as string,
          nom: tontineRow.nom,
          montantCotisation: tontineRow.montant_cotisation,
          devise: tontineRow.devise,
          frequence: tontineRow.frequence,
          nombreMembres: tontineRow.nombre_membres,
          membresMax: tontineRow.membres_max,
        } as unknown as Tontine : undefined,
      };
    };

    if (recuesRows) {
      const mapped = await Promise.all(recuesRows.map((r: Record<string, unknown>) => mapInvitation(r)));
      setInvitationsRecues(mapped);
    }
    if (envoyeesRows) {
      const mapped = await Promise.all(envoyeesRows.map((r: Record<string, unknown>) => mapInvitation(r)));
      setInvitationsEnvoyees(mapped);
    }
  }, [user, supabase]);

  // Charger au démarrage quand l'utilisateur est connecté
  useEffect(() => {
    const init = async () => {
      if (user) {
        // Charger en parallèle pour réduire la latence
        await Promise.all([loadTontines(), loadInvitations()]);
      } else {
        setTontines([]);
        setInvitationsRecues([]);
        setInvitationsEnvoyees([]);
      }
      setIsLoading(false);
    };
    init();
  }, [user, loadTontines, loadInvitations]);

  // Realtime subscription avec debounce pour éviter les rafales
  useEffect(() => {
    if (!user) return;

    let tontineTimer: ReturnType<typeof setTimeout> | null = null;
    let inviteTimer: ReturnType<typeof setTimeout> | null = null;

    const debouncedLoadTontines = () => {
      if (tontineTimer) clearTimeout(tontineTimer);
      tontineTimer = setTimeout(() => loadTontines(), 500);
    };
    const debouncedLoadInvitations = () => {
      if (inviteTimer) clearTimeout(inviteTimer);
      inviteTimer = setTimeout(() => loadInvitations(), 500);
    };

    const channel = supabase
      .channel("tontines-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tontines" }, debouncedLoadTontines)
      .on("postgres_changes", { event: "*", schema: "public", table: "membres" }, debouncedLoadTontines)
      .on("postgres_changes", { event: "*", schema: "public", table: "tours" }, debouncedLoadTontines)
      .on("postgres_changes", { event: "*", schema: "public", table: "paiements" }, debouncedLoadTontines)
      .on("postgres_changes", { event: "*", schema: "public", table: "invitations" }, debouncedLoadInvitations)
      .subscribe();

    return () => {
      if (tontineTimer) clearTimeout(tontineTimer);
      if (inviteTimer) clearTimeout(inviteTimer);
      supabase.removeChannel(channel);
    };
  }, [user, supabase, loadTontines, loadInvitations]);

  const refreshTontines = useCallback(async () => {
    await loadTontines();
  }, [loadTontines]);

  const refreshInvitations = useCallback(async () => {
    await loadInvitations();
  }, [loadInvitations]);

  // ========================
  // CRÉER UNE TONTINE
  // ========================
  const creerTontine = useCallback(
    async (data: CreerTontineData): Promise<Tontine> => {
      if (!user) throw new Error("Non connecté");

      // Insérer la tontine
      const { data: newTontine, error } = await supabase
        .from("tontines")
        .insert({
          nom: data.nom,
          description: data.description,
          montant_cotisation: data.montantCotisation,
          devise: data.devise || "EUR",
          frequence: data.frequence,
          nombre_membres: 1,
          membres_max: data.membresMax,
          date_debut: data.dateDebut,
          organisateur_id: user.id,
          emoji: data.emoji || "💰",
          couleur: data.couleur || "emerald",
          categorie: data.categorie || "autre",
          visibilite: data.visibilite || "publique",
        })
        .select()
        .single();

      if (error || !newTontine) throw new Error(error?.message || "Erreur création tontine");

      // Ajouter l'organisateur comme membre
      await supabase.from("membres").insert({
        tontine_id: newTontine.id,
        user_id: user.id,
        role: "organisateur",
        date_adhesion: new Date().toISOString().split("T")[0],
      });

      await loadTontines();

      return {
        id: newTontine.id,
        nom: newTontine.nom,
        description: newTontine.description || "",
        montantCotisation: parseFloat(newTontine.montant_cotisation),
        devise: newTontine.devise,
        frequence: newTontine.frequence,
        nombreMembres: 1,
        membresMax: newTontine.membres_max,
        dateDebut: newTontine.date_debut,
        statut: newTontine.statut,
        organisateur: user,
        organisateurId: user.id,
        membres: [],
        tours: [],
        emoji: newTontine.emoji || "💰",
        couleur: newTontine.couleur || "emerald",
        categorie: newTontine.categorie || "autre",
        visibilite: newTontine.visibilite || "publique",
        image: newTontine.image || "",
      };
    },
    [user, supabase, loadTontines]
  );

  // ========================
  // SUPPRIMER UNE TONTINE
  // ========================
  const supprimerTontine = useCallback(
    async (id: string) => {
      await supabase.from("tontines").delete().eq("id", id);
      await loadTontines();
    },
    [supabase, loadTontines]
  );

  // ========================
  // REJOINDRE UNE TONTINE
  // ========================
  const rejoindreGroupe = useCallback(
    async (tontineId: string) => {
      if (!user) return { success: false, error: "Non connecté" };

      const tontine = tontines.find((t) => t.id === tontineId);
      if (!tontine) return { success: false, error: "Tontine introuvable" };
      if (tontine.nombreMembres >= tontine.membresMax) return { success: false, error: "Groupe complet" };
      if (tontine.membres.some((m) => m.userId === user.id)) return { success: false, error: "Déjà membre" };

      const { error } = await supabase.from("membres").insert({
        tontine_id: tontineId,
        user_id: user.id,
        role: "membre",
        date_adhesion: new Date().toISOString().split("T")[0],
      });

      if (error) return { success: false, error: error.message };

      // Incrémenter le nombre de membres
      await supabase
        .from("tontines")
        .update({ nombre_membres: tontine.nombreMembres + 1 })
        .eq("id", tontineId);

      await loadTontines();
      return { success: true };
    },
    [user, tontines, supabase, loadTontines]
  );

  // ========================
  // QUITTER UNE TONTINE
  // ========================
  const quitterGroupe = useCallback(
    async (tontineId: string) => {
      if (!user) return;

      await supabase
        .from("membres")
        .delete()
        .eq("tontine_id", tontineId)
        .eq("user_id", user.id);

      const tontine = tontines.find((t) => t.id === tontineId);
      if (tontine) {
        await supabase
          .from("tontines")
          .update({ nombre_membres: Math.max(0, tontine.nombreMembres - 1) })
          .eq("id", tontineId);
      }

      await loadTontines();
    },
    [user, tontines, supabase, loadTontines]
  );

  // ========================
  // DÉMARRER UNE TONTINE
  // ========================
  const demarrerTontine = useCallback(
    async (tontineId: string) => {
      const tontine = tontines.find((t) => t.id === tontineId);
      if (!tontine || tontine.statut !== "en_attente") return;

      // Passer en active
      await supabase
        .from("tontines")
        .update({ statut: "active" })
        .eq("id", tontineId);

      // Générer les tours
      for (let i = 0; i < tontine.membres.length; i++) {
        const membre = tontine.membres[i];
        const datePrevue = calculateTourDate(tontine.dateDebut, tontine.frequence, i);
        const montantTotal = tontine.montantCotisation * (tontine.nombreMembres - 1);

        const { data: tourInserted } = await supabase
          .from("tours")
          .insert({
            tontine_id: tontineId,
            numero: i + 1,
            beneficiaire_id: membre.userId,
            date_prevue: datePrevue,
            montant_total: montantTotal,
            statut: i === 0 ? "en_cours" : "a_venir",
          })
          .select()
          .single();

        // Créer les paiements en attente pour le premier tour
        if (i === 0 && tourInserted) {
          const paiementInserts = tontine.membres
            .filter((m) => m.userId !== membre.userId) // Le bénéficiaire ne paie pas
            .map((m) => ({
              tour_id: tourInserted.id,
              tontine_id: tontineId,
              membre_id: m.userId,
              montant: tontine.montantCotisation,
              methode: "stripe" as const,
              statut: "en_attente" as const,
            }));

          if (paiementInserts.length > 0) {
            await supabase.from("paiements").insert(paiementInserts);
          }
        }
      }

      await loadTontines();
    },
    [tontines, supabase, loadTontines]
  );

  // ========================
  // EFFECTUER UN PAIEMENT
  // ========================
  const effectuerPaiement = useCallback(
    async (tontineId: string, tourId: string, methode: string) => {
      if (!user) return { success: false, reference: "" };

      const reference = generateReference(methode);
      const now = new Date().toISOString();

      // Chercher le paiement existant (en_attente) pour ce membre dans ce tour
      const { data: existingPaiement } = await supabase
        .from("paiements")
        .select("*")
        .eq("tour_id", tourId)
        .eq("membre_id", user.id)
        .single();

      if (existingPaiement) {
        // Mettre à jour le paiement existant
        await supabase
          .from("paiements")
          .update({
            statut: "confirme",
            methode,
            reference,
            date_paiement: now,
          })
          .eq("id", existingPaiement.id);
      } else {
        // Insérer un nouveau paiement
        const tontine = tontines.find((t) => t.id === tontineId);
        await supabase.from("paiements").insert({
          tour_id: tourId,
          tontine_id: tontineId,
          membre_id: user.id,
          montant: tontine?.montantCotisation || 0,
          methode,
          statut: "confirme",
          reference,
          date_paiement: now,
        });
      }

      // Vérifier si le tour est complété
      const tontine = tontines.find((t) => t.id === tontineId);
      if (tontine) {
        const { data: allPaiements } = await supabase
          .from("paiements")
          .select("*")
          .eq("tour_id", tourId)
          .eq("statut", "confirme");

        const confirmes = allPaiements?.length || 0;
        const attendu = tontine.nombreMembres - 1;

        if (confirmes >= attendu) {
          // Tour complet
          const today = new Date().toISOString().split("T")[0];
          await supabase
            .from("tours")
            .update({ statut: "complete", date_effective: today })
            .eq("id", tourId);

          // Démarrer le tour suivant
          const tour = tontine.tours.find((t) => t.id === tourId);
          if (tour) {
            const nextTour = tontine.tours.find(
              (t) => t.statut === "a_venir" && t.numero === tour.numero + 1
            );
            if (nextTour) {
              await supabase
                .from("tours")
                .update({ statut: "en_cours" })
                .eq("id", nextTour.id);

              // Créer les paiements en attente pour le nouveau tour
              const paiementInserts = tontine.membres
                .filter((m) => m.userId !== nextTour.beneficiaireId)
                .map((m) => ({
                  tour_id: nextTour.id,
                  tontine_id: tontineId,
                  membre_id: m.userId,
                  montant: tontine.montantCotisation,
                  methode: "stripe" as const,
                  statut: "en_attente" as const,
                }));

              if (paiementInserts.length > 0) {
                await supabase.from("paiements").insert(paiementInserts);
              }
            }
          }
        }
      }

      await loadTontines();
      return { success: true, reference };
    },
    [user, tontines, supabase, loadTontines]
  );

  // ========================
  // INVITER UN MEMBRE
  // ========================
  const inviterMembre = useCallback(
    async (tontineId: string, email: string, telephone: string) => {
      if (!user) return { success: false, error: "Non connecté" };

      const tontine = tontines.find((t) => t.id === tontineId);
      if (!tontine) return { success: false, error: "Tontine introuvable" };
      if (tontine.nombreMembres >= tontine.membresMax) return { success: false, error: "Groupe complet" };

      const emailLower = email.toLowerCase().trim();

      // Empêcher de s'inviter soi-même
      if (emailLower === user.email.toLowerCase()) {
        return { success: false, error: "Vous ne pouvez pas vous inviter vous-même" };
      }

      // Vérifier si déjà membre
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", emailLower)
        .single();

      if (targetProfile && tontine.membres.some((m) => m.userId === targetProfile.id)) {
        return { success: false, error: "Cette personne est déjà membre" };
      }

      // Vérifier si invitation en attente existe déjà
      const { data: existingInvite } = await supabase
        .from("invitations")
        .select("id")
        .eq("tontine_id", tontineId)
        .eq("email", emailLower)
        .eq("statut", "en_attente")
        .single();

      if (existingInvite) {
        return { success: false, error: "Une invitation est déjà en attente pour cet email" };
      }

      // Créer l'invitation (que l'utilisateur existe ou non)
      const inviteCode = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      const { error } = await supabase.from("invitations").insert({
        tontine_id: tontineId,
        inviteur_id: user.id,
        email: emailLower,
        telephone: telephone || "",
        code: inviteCode,
      });

      if (error) return { success: false, error: error.message };

      await loadInvitations();
      return { success: true, code: inviteCode };
    },
    [user, tontines, supabase, loadInvitations]
  );

  // ========================
  // ACCEPTER UNE INVITATION
  // ========================
  const accepterInvitation = useCallback(
    async (invitationId: string) => {
      if (!user) return { success: false, error: "Non connecté" };

      // Trouver l'invitation
      const invitation = invitationsRecues.find((i) => i.id === invitationId);
      if (!invitation) return { success: false, error: "Invitation introuvable" };

      // Vérifier que le groupe n'est pas complet
      const tontine = tontines.find((t) => t.id === invitation.tontineId);
      if (tontine && tontine.nombreMembres >= tontine.membresMax) {
        return { success: false, error: "Le groupe est complet" };
      }

      // 1. Mettre à jour l'invitation
      const { error: updateError } = await supabase
        .from("invitations")
        .update({ statut: "acceptee" })
        .eq("id", invitationId);

      if (updateError) return { success: false, error: updateError.message };

      // 2. Ajouter comme membre
      const { error: membreError } = await supabase.from("membres").insert({
        tontine_id: invitation.tontineId,
        user_id: user.id,
        role: "membre",
        date_adhesion: new Date().toISOString().split("T")[0],
      });

      if (membreError) return { success: false, error: membreError.message };

      // 3. Incrémenter le nombre de membres
      if (tontine) {
        await supabase
          .from("tontines")
          .update({ nombre_membres: tontine.nombreMembres + 1 })
          .eq("id", invitation.tontineId);
      }

      await loadTontines();
      await loadInvitations();
      return { success: true };
    },
    [user, invitationsRecues, tontines, supabase, loadTontines, loadInvitations]
  );

  // ========================
  // CHERCHER UNE INVITATION PAR CODE
  // ========================
  const getInvitationByCode = useCallback(
    async (code: string): Promise<Invitation | null> => {
      const { data: row, error: fetchError } = await supabase
        .from("invitations")
        .select("*")
        .eq("code", code)
        .single();

      if (fetchError || !row) return null;

      // Charger tontine
      const { data: tontineRow } = await supabase
        .from("tontines")
        .select("nom, description, montant_cotisation, devise, frequence, nombre_membres, membres_max, date_debut, emoji, couleur, image, categorie")
        .eq("id", row.tontine_id)
        .single();

      // Charger inviteur
      const { data: inviteurRow } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", row.inviteur_id)
        .single();

      // Charger les membres avec leurs profils
      const { data: membresRows } = await supabase
        .from("membres_tontine")
        .select("id, tontine_id, user_id, role, date_adhesion, statut, profiles(*)")
        .eq("tontine_id", row.tontine_id)
        .eq("statut", "actif");

      const membres: Membre[] = (membresRows || []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        tontineId: m.tontine_id as string,
        userId: m.user_id as string,
        role: m.role as Membre["role"],
        dateAdhesion: ((m.date_adhesion as string) || "").split("T")[0],
        statut: m.statut as Membre["statut"],
        user: profileToUser(m.profiles as Record<string, unknown>),
      }));

      return {
        id: row.id as string,
        code: (row.code as string) || "",
        tontineId: row.tontine_id as string,
        inviteurId: row.inviteur_id as string,
        inviteur: inviteurRow ? profileToUser(inviteurRow) : undefined,
        email: row.email as string,
        telephone: (row.telephone as string) || "",
        statut: row.statut as Invitation["statut"],
        dateCreation: ((row.created_at as string) || new Date().toISOString()).split("T")[0],
        tontine: tontineRow
          ? ({
              id: row.tontine_id as string,
              nom: tontineRow.nom,
              description: tontineRow.description || "",
              montantCotisation: tontineRow.montant_cotisation,
              devise: tontineRow.devise,
              frequence: tontineRow.frequence,
              nombreMembres: tontineRow.nombre_membres,
              membresMax: tontineRow.membres_max,
              dateDebut: tontineRow.date_debut || "",
              emoji: tontineRow.emoji || undefined,
              couleur: tontineRow.couleur || undefined,
              image: tontineRow.image || undefined,
              categorie: tontineRow.categorie || undefined,
              membres,
            } as unknown as Tontine)
          : undefined,
      };
    },
    [supabase]
  );

  // ========================
  // REFUSER UNE INVITATION
  // ========================
  const refuserInvitation = useCallback(
    async (invitationId: string) => {
      if (!user) return { success: false, error: "Non connecté" };

      const { error } = await supabase
        .from("invitations")
        .update({ statut: "refusee" })
        .eq("id", invitationId);

      if (error) return { success: false, error: error.message };

      await loadInvitations();
      return { success: true };
    },
    [user, supabase, loadInvitations]
  );

  // ========================
  // INVITATIONS POUR UNE TONTINE
  // ========================
  const getInvitationsPourTontine = useCallback(
    (tontineId: string) => {
      return invitationsEnvoyees.filter((i) => i.tontineId === tontineId);
    },
    [invitationsEnvoyees]
  );

  // ========================
  // EXCLURE UN MEMBRE
  // ========================
  const exclureMembre = useCallback(
    async (tontineId: string, membreId: string) => {
      // membreId ici est l'ID du record dans la table membres
      await supabase
        .from("membres")
        .update({ statut: "exclu" })
        .eq("id", membreId);

      const tontine = tontines.find((t) => t.id === tontineId);
      if (tontine) {
        await supabase
          .from("tontines")
          .update({ nombre_membres: Math.max(0, tontine.nombreMembres - 1) })
          .eq("id", tontineId);
      }

      await loadTontines();
    },
    [tontines, supabase, loadTontines]
  );

  // ========================
  // SIGNALER UNE DÉFAILLANCE
  // ========================
  const signalerDefaillance = useCallback(
    async (tontineId: string, membreId: string): Promise<DefaillanceResult> => {
      const tontine = tontines.find((t) => t.id === tontineId);
      if (!tontine) return { success: false, error: "Tontine introuvable" };
      if (tontine.statut !== "active") return { success: false, error: "La tontine n'est pas active" };

      const membre = tontine.membres.find((m) => m.id === membreId);
      if (!membre) return { success: false, error: "Membre introuvable" };
      if (membre.role === "organisateur") return { success: false, error: "Impossible de signaler l'organisateur" };

      const tourEnCours = tontine.tours.find((t) => t.statut === "en_cours");
      const defaillantNom = membre.user.prenom + " " + membre.user.nom;

      // 1. Créer la défaillance
      await supabase.from("defaillances").insert({
        user_id: membre.userId,
        tontine_id: tontineId,
        tontine_nom: tontine.nom,
        tour_numero: tourEnCours?.numero || 0,
        montant_du: tontine.montantCotisation,
        devise: tontine.devise,
      });

      // 2. Mettre à jour le profil du défaillant
      await supabase
        .from("profiles")
        .update({
          score_confiance: Math.max(0, (membre.user.scoreConfiance ?? 50) - 50),
          est_defaillant: true,
        })
        .eq("id", membre.userId);

      // 3. Annuler la tontine
      await supabase
        .from("tontines")
        .update({
          statut: "annulee",
          motif_annulation: `Défaillance de ${defaillantNom} — non-paiement de la cotisation`,
          defaillant_id: membre.userId,
          date_annulation: new Date().toISOString(),
        })
        .eq("id", tontineId);

      // 4. Annuler les tours restants
      await supabase
        .from("tours")
        .update({ statut: "annule" })
        .eq("tontine_id", tontineId)
        .neq("statut", "complete");

      // 5. Exclure le membre
      await supabase
        .from("membres")
        .update({ statut: "exclu" })
        .eq("id", membreId);

      const membresARembourser = tontine.membres.filter((m) => m.id !== membreId).length;

      await loadTontines();

      return {
        success: true,
        defaillantNom,
        membresRembourses: membresARembourser,
      };
    },
    [tontines, supabase, loadTontines]
  );

  // ========================
  // CONSULTATION
  // ========================
  const getMesTontines = useCallback(() => {
    if (!user) return [];
    return tontines.filter((t) =>
      t.membres.some((m) => m.userId === user.id)
    );
  }, [user, tontines]);

  const getTontineById = useCallback(
    (id: string) => tontines.find((t) => t.id === id),
    [tontines]
  );

  const getAllPaiements = useCallback(() => {
    return tontines.flatMap((t) =>
      t.tours.flatMap((tour) =>
        tour.paiements.map((p) => ({ ...p, tontine: t, tour }))
      )
    );
  }, [tontines]);

  return (
    <TontineContext.Provider
      value={{
        tontines,
        isLoading,
        refreshTontines,
        creerTontine,
        supprimerTontine,
        rejoindreGroupe,
        quitterGroupe,
        demarrerTontine,
        effectuerPaiement,
        inviterMembre,
        exclureMembre,
        signalerDefaillance,
        getMesTontines,
        getTontineById,
        getAllPaiements,
        invitationsRecues,
        invitationsEnvoyees,
        accepterInvitation,
        refuserInvitation,
        getInvitationByCode,
        getInvitationsPourTontine,
        refreshInvitations,
      }}
    >
      {children}
    </TontineContext.Provider>
  );
}

export function useTontine() {
  const context = useContext(TontineContext);
  if (!context) throw new Error("useTontine must be used within TontineProvider");
  return context;
}

// === Helpers ===

function calculateTourDate(startDate: string, frequence: string, index: number): string {
  const date = new Date(startDate);
  switch (frequence) {
    case "hebdomadaire":
      date.setDate(date.getDate() + 7 * (index + 1));
      break;
    case "bimensuel":
      date.setDate(date.getDate() + 14 * (index + 1));
      break;
    case "mensuel":
    default:
      date.setMonth(date.getMonth() + index + 1);
      break;
  }
  return date.toISOString().split("T")[0];
}

function generateReference(methode: string): string {
  const prefixes: Record<string, string> = {
    virement: "VIR",
    carte: "CB",
    stripe: "STR",
  };
  const prefix = prefixes[methode] || "PAY";
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}
