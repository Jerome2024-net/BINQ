"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Transaction,
  TransactionType,
  TransactionStatut,
  TransactionMetadata,
  LedgerEntry,
  FraisConfig,
  FinancialSummary,
  TontineFinancialSummary,
  Abonnement,
  CompteType,
} from "@/types";
import { useAuth } from "./AuthContext";
import { createClient } from "@/lib/supabase/client";

// ========================
// Configuration des frais
// ========================
const DEFAULT_FRAIS: FraisConfig = {
  abonnementAnnuel: 180,
  fraisDepot: 1, // 1% application_fee sur chaque cotisation Stripe
  fraisParticipant: 1,
  commissionRetrait: 0,
  penaliteRetard: 8,
  penaliteRetardType: "fixe",
  joursGracePenalite: 3,
  seuilRetraitMin: 2,
  seuilDepotMax: 10000,
};

// ========================
// Interface
// ========================
interface FinanceContextType {
  // Abonnement
  abonnement: Abonnement | null;
  activerEssaiGratuit: () => Promise<{ success: boolean; error?: string }>;
  souscrireAbonnementStripe: () => Promise<{ success: boolean; url?: string; error?: string }>;
  rafraichirAbonnement: () => Promise<void>;
  isAbonnementActif: () => boolean;
  isEssaiGratuit: () => boolean;
  getJoursRestantsAbonnement: () => number;

  // Transaction history (read-only, alimenté par webhooks Stripe)
  transactions: Transaction[];
  getTransactions: (filters?: TransactionFilters) => Transaction[];
  getLedger: () => LedgerEntry[];
  refreshTransactions: () => Promise<void>;

  // Summaries
  getFinancialSummary: () => FinancialSummary;
  getTontineFinancialSummary: (tontineId: string) => TontineFinancialSummary;
  getFraisConfig: () => FraisConfig;

  isLoading: boolean;
}

interface TransactionFilters {
  type?: TransactionType;
  statut?: TransactionStatut;
  dateDebut?: string;
  dateFin?: string;
  tontineId?: string;
  limit?: number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // ========================
  // Chargement initial
  // ========================
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLedger([]);
      setAbonnement(null);
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [txRes, subRes] = await Promise.all([
          supabase
            .from("transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(200),
          supabase
            .from("abonnements")
            .select("*")
            .eq("user_id", user.id)
            .single(),
        ]);

        if (txRes.data) {
          setTransactions(txRes.data.map(rowToTransaction));
          if (txRes.data.length > 0) {
            const txIds = txRes.data.map((t: { id: string }) => t.id);
            const { data: ledgerData } = await supabase
              .from("ledger_entries")
              .select("*")
              .in("transaction_id", txIds);
            if (ledgerData) setLedger(ledgerData.map(rowToLedgerEntry));
          }
        }
        if (subRes.data) setAbonnement(rowToAbonnement(subRes.data));
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ========================
  // Rafraîchir les transactions (après paiement Stripe)
  // ========================
  const refreshTransactions = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (data) {
        setTransactions(data.map(rowToTransaction));
        if (data.length > 0) {
          const txIds = data.map((t: { id: string }) => t.id);
          const { data: ledgerData } = await supabase
            .from("ledger_entries")
            .select("*")
            .in("transaction_id", txIds);
          if (ledgerData) setLedger(ledgerData.map(rowToLedgerEntry));
        }
      }
    } catch {
      // ignore
    }
  }, [user, supabase]);

  // ========================
  // Abonnement
  // ========================
  const isAbonnementActif = useCallback((): boolean => {
    if (!abonnement) return false;
    const isValid = new Date(abonnement.dateExpiration) > new Date();
    return (abonnement.statut === "actif" || abonnement.statut === "essai") && isValid;
  }, [abonnement]);

  const isEssaiGratuit = useCallback((): boolean => {
    if (!abonnement) return false;
    return abonnement.statut === "essai" && abonnement.plan === "essai_gratuit" && new Date(abonnement.dateExpiration) > new Date();
  }, [abonnement]);

  const getJoursRestantsAbonnement = useCallback((): number => {
    if (!abonnement || (abonnement.statut !== "actif" && abonnement.statut !== "essai")) return 0;
    const diff = new Date(abonnement.dateExpiration).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [abonnement]);

  const activerEssaiGratuit = useCallback(async () => {
    if (!user) return { success: false, error: "Non connecté" };

    if (isAbonnementActif()) {
      return { success: false, error: "Vous avez déjà un abonnement actif" };
    }

    if (abonnement && abonnement.plan === "essai_gratuit") {
      return { success: false, error: "Vous avez déjà utilisé votre essai gratuit" };
    }

    try {
      const now = new Date();
      const expiration = new Date(now);
      expiration.setDate(expiration.getDate() + 90);

      const { data: subData, error } = await supabase
        .from("abonnements")
        .upsert(
          {
            user_id: user.id,
            plan: "essai_gratuit",
            montant: 0,
            devise: "EUR",
            date_debut: now.toISOString(),
            date_expiration: expiration.toISOString(),
            statut: "essai",
            renouvellement_auto: false,
            reference: `ESSAI-${Date.now().toString(36).toUpperCase()}`,
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) {
        console.error("Supabase essai gratuit error:", error.message);
        throw new Error(error.message || "Erreur activation essai gratuit");
      }

      if (subData) {
        setAbonnement(rowToAbonnement(subData));
      }

      return { success: true };
    } catch (err) {
      console.error("activerEssaiGratuit error:", err);
      return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
    }
  }, [user, abonnement, isAbonnementActif, supabase]);

  const souscrireAbonnementStripe = useCallback(async (): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> => {
    if (!user) return { success: false, error: "Non connecté" };

    if (isAbonnementActif() && !isEssaiGratuit()) {
      return { success: false, error: "Vous avez déjà un abonnement actif" };
    }

    try {
      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        return { success: false, error: data.error || "Erreur Stripe" };
      }

      return { success: true, url: data.url };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Erreur réseau" };
    }
  }, [user, isAbonnementActif, isEssaiGratuit]);

  const rafraichirAbonnement = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("abonnements")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) setAbonnement(rowToAbonnement(data));
  }, [user, supabase]);

  // ========================
  // Consultation (read-only)
  // ========================
  const getTransactions = useCallback(
    (filters?: TransactionFilters): Transaction[] => {
      let result = [...transactions];

      if (filters?.type) result = result.filter((t) => t.type === filters.type);
      if (filters?.statut) result = result.filter((t) => t.statut === filters.statut);
      if (filters?.tontineId) result = result.filter((t) => t.metadata.tontineId === filters.tontineId);
      if (filters?.dateDebut) result = result.filter((t) => t.dateCreation >= filters.dateDebut!);
      if (filters?.dateFin) result = result.filter((t) => t.dateCreation <= filters.dateFin!);

      result.sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());

      if (filters?.limit) result = result.slice(0, filters.limit);

      return result;
    },
    [transactions]
  );

  const getLedger = useCallback((): LedgerEntry[] => ledger, [ledger]);

  const getFinancialSummary = useCallback((): FinancialSummary => {
    const confirmed = transactions.filter((t) => t.statut === "confirme");

    // Solde calculé à partir des transactions (plus de wallet interne)
    const totalIn = confirmed
      .filter((t) => ["depot", "reception_pot", "remboursement", "transfert_entrant"].includes(t.type))
      .reduce((s, t) => s + t.montant, 0);
    const totalOut = confirmed
      .filter((t) => ["retrait", "cotisation", "abonnement", "penalite", "commission", "transfert_sortant"].includes(t.type))
      .reduce((s, t) => s + t.montant, 0);

    return {
      soldeDisponible: Math.max(0, totalIn - totalOut),
      soldeBloquer: 0,
      totalDepose: confirmed.filter((t) => t.type === "depot").reduce((s, t) => s + t.montant, 0),
      totalRetire: confirmed.filter((t) => t.type === "retrait").reduce((s, t) => s + t.montant, 0),
      totalCotisationsPaye: confirmed.filter((t) => t.type === "cotisation").reduce((s, t) => s + t.montant, 0),
      totalPotsRecus: confirmed.filter((t) => t.type === "reception_pot").reduce((s, t) => s + t.montant, 0),
      totalFraisParticipant: confirmed.filter((t) => t.type === "cotisation").reduce((s, t) => s + (t.metadata.frais || 0), 0),
      totalAbonnements: confirmed.filter((t) => t.type === "abonnement").reduce((s, t) => s + t.montant, 0),
      totalPenalites: confirmed.filter((t) => t.type === "penalite").reduce((s, t) => s + t.montant, 0),
      nombreTransactions: confirmed.length,
    };
  }, [transactions]);

  const getTontineFinancialSummary = useCallback(
    (tontineId: string): TontineFinancialSummary => {
      const tontineTx = transactions.filter(
        (t) => t.metadata.tontineId === tontineId && t.statut === "confirme"
      );

      return {
        tontineId,
        potTotal: tontineTx.filter((t) => t.type === "cotisation").reduce((s, t) => s + t.montant, 0),
        cotisationsRecues: tontineTx.filter((t) => t.type === "cotisation").length,
        cotisationsEnAttente: 0,
        commissionsPrelevees: tontineTx.reduce((s, t) => s + (t.metadata.frais || 0), 0),
        potsDistribues: tontineTx.filter((t) => t.type === "reception_pot").reduce((s, t) => s + t.montant, 0),
        penalitesCollectees: tontineTx.filter((t) => t.type === "penalite").reduce((s, t) => s + t.montant, 0),
      };
    },
    [transactions]
  );

  const getFraisConfig = useCallback(() => DEFAULT_FRAIS, []);

  return (
    <FinanceContext.Provider
      value={{
        abonnement,
        activerEssaiGratuit,
        souscrireAbonnementStripe,
        rafraichirAbonnement,
        isAbonnementActif,
        isEssaiGratuit,
        getJoursRestantsAbonnement,
        transactions,
        getTransactions,
        getLedger,
        refreshTransactions,
        getFinancialSummary,
        getTontineFinancialSummary,
        getFraisConfig,
        isLoading,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used within FinanceProvider");
  return context;
}

// ========================
// Row converters
// ========================

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    walletId: (row.wallet_id as string) || "",
    userId: row.user_id as string,
    type: row.type as TransactionType,
    montant: parseFloat(row.montant as string) || 0,
    soldeAvant: parseFloat(row.solde_avant as string) || 0,
    soldeApres: parseFloat(row.solde_apres as string) || 0,
    devise: (row.devise as string) || "EUR",
    statut: (row.statut as TransactionStatut) || "confirme",
    reference: (row.reference as string) || "",
    description: (row.description as string) || "",
    metadata: {
      tontineId: (row.meta_tontine_id as string) || undefined,
      tontineNom: (row.meta_tontine_nom as string) || undefined,
      tourId: (row.meta_tour_id as string) || undefined,
      tourNumero: (row.meta_tour_numero as number) || undefined,
      beneficiaire: (row.meta_beneficiaire as string) || undefined,
      methode: (row.meta_methode as string) || undefined,
      frais: parseFloat(row.meta_frais as string) || 0,
      destinataireId: (row.meta_destinataire_id as string) || undefined,
      expediteurId: (row.meta_expediteur_id as string) || undefined,
    },
    dateCreation: (row.created_at as string) || new Date().toISOString(),
    dateConfirmation: (row.confirmed_at as string) || undefined,
  };
}

function rowToLedgerEntry(row: Record<string, unknown>): LedgerEntry {
  return {
    id: row.id as string,
    transactionId: row.transaction_id as string,
    type: row.type as "debit" | "credit",
    compte: row.compte as CompteType,
    montant: parseFloat(row.montant as string) || 0,
    devise: (row.devise as string) || "EUR",
    description: (row.description as string) || "",
    date: (row.created_at as string) || new Date().toISOString(),
  };
}

function rowToAbonnement(row: Record<string, unknown>): Abonnement {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    plan: (row.plan as string) === "essai_gratuit" ? "essai_gratuit" : "annuel",
    montant: parseFloat(row.montant as string) || 0,
    devise: (row.devise as string) || "EUR",
    dateDebut: (row.date_debut as string) || "",
    dateExpiration: (row.date_expiration as string) || "",
    statut: (row.statut as Abonnement["statut"]) || "actif",
    renouvellementAuto: (row.renouvellement_auto as boolean) || false,
    reference: (row.reference as string) || "",
    stripeSubscriptionId: (row.stripe_subscription_id as string) || undefined,
  };
}
