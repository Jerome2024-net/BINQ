// ============================================
// Types pour l'application TontineApp
// Alignés avec le schéma Supabase
// ============================================

export interface User {
  id: string; // uuid from auth.users
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  avatar?: string;
  // Profil étendu
  bio?: string;
  ville?: string;
  pays?: string;
  profession?: string;
  // Stats sociales
  scoreConfiance: number;
  badgeVerifie: boolean;
  nombreTontinesParticipees: number;
  nombreTontinesOrganisees: number;
  nombreToursRecus: number;
  totalCotisationsPayees: number;
  // Défaillances
  estDefaillant?: boolean;
  defaillances?: Defaillance[];
  // Préférences
  notificationsEmail: boolean;
  notificationsSms: boolean;
  profilPublic: boolean;
  // Stripe Connect
  stripeAccountId?: string;
  stripeOnboardingComplete?: boolean;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
  // Timestamps
  dateInscription: string;
  updatedAt?: string;
}

export interface Tontine {
  id: string;
  nom: string;
  description: string;
  montantCotisation: number;
  devise: string;
  frequence: "hebdomadaire" | "bimensuel" | "mensuel";
  nombreMembres: number;
  membresMax: number;
  dateDebut: string;
  dateFin?: string;
  statut: "en_attente" | "active" | "terminee" | "suspendue" | "annulee";
  organisateur: User;
  organisateurId: string;
  membres: Membre[];
  tours: Tour[];
  // Profil visuel
  emoji?: string;
  couleur?: string;
  categorie?: "famille" | "amis" | "collegues" | "communaute" | "autre";
  visibilite?: "publique" | "privee";
  image?: string;
  // Annulation
  motifAnnulation?: string;
  defaillantId?: string;
  dateAnnulation?: string;
}

export interface Membre {
  id: string;
  tontineId: string;
  user: User;
  userId: string;
  role: "organisateur" | "membre";
  dateAdhesion: string;
  statut: "actif" | "suspendu" | "exclu";
}

export interface Tour {
  id: string;
  tontineId: string;
  numero: number;
  beneficiaire: User;
  beneficiaireId: string;
  datePrevue: string;
  dateEffective?: string;
  montantTotal: number;
  statut: "a_venir" | "en_cours" | "complete" | "en_retard" | "annule";
  paiements: Paiement[];
}

export interface Paiement {
  id: string;
  tourId: string;
  tontineId: string;
  membre: User;
  membreId: string;
  montant: number;
  datePaiement: string;
  methode: "virement" | "carte" | "stripe";
  statut: "en_attente" | "confirme" | "echoue";
  reference?: string;
  stripePaymentIntentId?: string;
}

export interface Defaillance {
  id: string;
  userId: string;
  tontineId: string;
  tontineNom: string;
  tourNumero: number;
  date: string;
  montantDu: number;
  devise: string;
}

export type InvitationStatut = "en_attente" | "acceptee" | "refusee" | "expiree";

export interface Invitation {
  id: string;
  code: string;
  tontineId: string;
  tontine?: Tontine;
  inviteurId: string;
  inviteur?: User;
  email: string;
  telephone: string;
  statut: InvitationStatut;
  dateCreation: string;
}

export interface StatsTontine {
  totalCotisations: number;
  cotisationsPayees: number;
  cotisationsEnAttente: number;
  prochainTour: Tour | null;
  montantTotal: number;
}

// ========================
// INFRASTRUCTURE FINANCIÈRE
// ========================

export interface Wallet {
  id: string;
  userId: string;
  solde: number;
  soldeBloquer: number;
  devise: string;
  dateCreation: string;
  derniereMaj: string;
}

export type AbonnementStatut = "actif" | "essai" | "expire" | "annule";

export interface Abonnement {
  id: string;
  userId: string;
  plan: "essai_gratuit" | "annuel";
  montant: number;
  devise: string;
  dateDebut: string;
  dateExpiration: string;
  statut: AbonnementStatut;
  renouvellementAuto: boolean;
  reference: string;
  stripeSubscriptionId?: string;
}

export type TransactionType =
  | "depot"
  | "retrait"
  | "cotisation"
  | "reception_pot"
  | "commission"
  | "abonnement"
  | "penalite"
  | "remboursement"
  | "transfert_entrant"
  | "transfert_sortant";

export type TransactionStatut = "en_attente" | "confirme" | "echoue" | "annule";

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  montant: number;
  soldeAvant: number;
  soldeApres: number;
  devise: string;
  statut: TransactionStatut;
  reference: string;
  description: string;
  metadata: TransactionMetadata;
  dateCreation: string;
  dateConfirmation?: string;
}

export interface TransactionMetadata {
  tontineId?: string;
  tontineNom?: string;
  tourId?: string;
  tourNumero?: number;
  beneficiaire?: string;
  methode?: string;
  frais?: number;
  destinataireId?: string;
  expediteurId?: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  type: "debit" | "credit";
  compte: CompteType;
  montant: number;
  devise: string;
  description: string;
  date: string;
}

export type CompteType =
  | "wallet_utilisateur"
  | "pot_tontine"
  | "commission_plateforme"
  | "penalites"
  | "reserve_garantie"
  | "compte_transit";

export interface FraisConfig {
  abonnementAnnuel: number;
  fraisParticipant: number;
  commissionRetrait: number;
  penaliteRetard: number;
  penaliteRetardType: "fixe" | "pourcentage";
  joursGracePenalite: number;
  seuilRetraitMin: number;
  seuilDepotMax: number;
}

export interface FinancialSummary {
  soldeDisponible: number;
  soldeBloquer: number;
  totalDepose: number;
  totalRetire: number;
  totalCotisationsPaye: number;
  totalPotsRecus: number;
  totalFraisParticipant: number;
  totalAbonnements: number;
  totalPenalites: number;
  nombreTransactions: number;
}

export interface TontineFinancialSummary {
  tontineId: string;
  potTotal: number;
  cotisationsRecues: number;
  cotisationsEnAttente: number;
  commissionsPrelevees: number;
  potsDistribues: number;
  penalitesCollectees: number;
}

// ========================
// HELPERS Supabase → App mapping
// ========================

/** Convertir un row Supabase profile en User */
export function profileToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    nom: (row.nom as string) || "",
    prenom: (row.prenom as string) || "",
    email: (row.email as string) || "",
    telephone: (row.telephone as string) || "",
    avatar: (row.avatar as string) || "",
    bio: (row.bio as string) || "",
    ville: (row.ville as string) || "",
    pays: (row.pays as string) || "",
    profession: (row.profession as string) || "",
    scoreConfiance: (row.score_confiance as number) || 50,
    badgeVerifie: (row.badge_verifie as boolean) || false,
    nombreTontinesParticipees: (row.nombre_tontines_participees as number) || 0,
    nombreTontinesOrganisees: (row.nombre_tontines_organisees as number) || 0,
    nombreToursRecus: (row.nombre_tours_recus as number) || 0,
    totalCotisationsPayees: (row.total_cotisations_payees as number) || 0,
    estDefaillant: (row.est_defaillant as boolean) || false,
    notificationsEmail: row.notifications_email !== false,
    notificationsSms: (row.notifications_sms as boolean) || false,
    profilPublic: row.profil_public !== false,
    stripeAccountId: (row.stripe_account_id as string) || undefined,
    stripeOnboardingComplete: (row.stripe_onboarding_complete as boolean) || false,
    stripeChargesEnabled: (row.stripe_charges_enabled as boolean) || false,
    stripePayoutsEnabled: (row.stripe_payouts_enabled as boolean) || false,
    dateInscription: ((row.created_at as string) || new Date().toISOString()).split("T")[0],
    updatedAt: (row.updated_at as string) || undefined,
  };
}

/** Convertir un User en données Supabase pour update */
export function userToProfileUpdate(user: Partial<User>): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  if (user.nom !== undefined) map.nom = user.nom;
  if (user.prenom !== undefined) map.prenom = user.prenom;
  if (user.telephone !== undefined) map.telephone = user.telephone;
  if (user.avatar !== undefined) map.avatar = user.avatar;
  if (user.bio !== undefined) map.bio = user.bio;
  if (user.ville !== undefined) map.ville = user.ville;
  if (user.pays !== undefined) map.pays = user.pays;
  if (user.profession !== undefined) map.profession = user.profession;
  if (user.scoreConfiance !== undefined) map.score_confiance = user.scoreConfiance;
  if (user.badgeVerifie !== undefined) map.badge_verifie = user.badgeVerifie;
  if (user.nombreTontinesParticipees !== undefined) map.nombre_tontines_participees = user.nombreTontinesParticipees;
  if (user.nombreTontinesOrganisees !== undefined) map.nombre_tontines_organisees = user.nombreTontinesOrganisees;
  if (user.nombreToursRecus !== undefined) map.nombre_tours_recus = user.nombreToursRecus;
  if (user.totalCotisationsPayees !== undefined) map.total_cotisations_payees = user.totalCotisationsPayees;
  if (user.estDefaillant !== undefined) map.est_defaillant = user.estDefaillant;
  if (user.notificationsEmail !== undefined) map.notifications_email = user.notificationsEmail;
  if (user.notificationsSms !== undefined) map.notifications_sms = user.notificationsSms;
  if (user.profilPublic !== undefined) map.profil_public = user.profilPublic;
  if (user.stripeAccountId !== undefined) map.stripe_account_id = user.stripeAccountId;
  if (user.stripeOnboardingComplete !== undefined) map.stripe_onboarding_complete = user.stripeOnboardingComplete;
  if (user.stripeChargesEnabled !== undefined) map.stripe_charges_enabled = user.stripeChargesEnabled;
  if (user.stripePayoutsEnabled !== undefined) map.stripe_payouts_enabled = user.stripePayoutsEnabled;
  return map;
}

