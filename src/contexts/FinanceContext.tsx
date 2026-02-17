"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Wallet,
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
  wallet: Wallet | null;
  getOrCreateWallet: () => Promise<Wallet>;
  abonnement: Abonnement | null;
  activerEssaiGratuit: () => Promise<{ success: boolean; error?: string }>;
  souscrireAbonnement: () => Promise<{ success: boolean; transaction?: Transaction; error?: string }>;
  souscrireAbonnementStripe: () => Promise<{ success: boolean; url?: string; error?: string }>;
  rafraichirAbonnement: () => Promise<void>;
  isAbonnementActif: () => boolean;
  isEssaiGratuit: () => boolean;
  getJoursRestantsAbonnement: () => number;
  deposer: (montant: number, methode: string) => Promise<{ success: boolean; transaction?: Transaction; error?: string }>;
  retirer: (montant: number, methode: string) => Promise<{ success: boolean; transaction?: Transaction; error?: string }>;
  payerCotisation: (
    montant: number,
    tontineId: string,
    tontineNom: string,
    tourId: string,
    tourNumero: number,
    methode: string
  ) => Promise<{ success: boolean; transaction?: Transaction; error?: string }>;
  recevoirPot: (
    montant: number,
    tontineId: string,
    tontineNom: string,
    tourNumero: number
  ) => Promise<{ success: boolean; transaction?: Transaction; error?: string }>;
  appliquerPenalite: (
    montant: number,
    tontineId: string,
    tontineNom: string,
    raison: string
  ) => Promise<{ success: boolean; transaction?: Transaction; error?: string }>;
  rembourserCotisationAnnulation: (
    montant: number,
    tontineId: string,
    tontineNom: string,
    tourNumero: number
  ) => Promise<{ success: boolean; transaction?: Transaction; error?: string }>;
  getTransactions: (filters?: TransactionFilters) => Transaction[];
  getLedger: () => LedgerEntry[];
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
  const [wallet, setWallet] = useState<Wallet | null>(null);
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
      setWallet(null);
      setTransactions([]);
      setLedger([]);
      setAbonnement(null);
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // Charger tout en parallèle
        const [walletRes, txRes, subRes] = await Promise.all([
          supabase.from("wallets").select("*").eq("user_id", user.id).single(),
          supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("abonnements").select("*").eq("user_id", user.id).single(),
        ]);

        if (walletRes.data) setWallet(rowToWallet(walletRes.data));
        if (txRes.data) {
          setTransactions(txRes.data.map(rowToTransaction));
          // Charger le ledger uniquement s'il y a des transactions
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
  // Wallet
  // ========================
  const getOrCreateWallet = useCallback(async (): Promise<Wallet> => {
    if (!user) throw new Error("Non connecté");

    if (wallet) return wallet;

    // Essayer de trouver le wallet existant
    const { data: existing } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      const w = rowToWallet(existing);
      setWallet(w);
      return w;
    }

    // Créer un nouveau wallet
    const { data: newWallet, error } = await supabase
      .from("wallets")
      .insert({
        user_id: user.id,
        solde: 0,
        solde_bloque: 0,
        devise: "EUR",
      })
      .select()
      .single();

    if (error || !newWallet) throw new Error("Impossible de créer le portefeuille");

    const w = rowToWallet(newWallet);
    setWallet(w);
    return w;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, wallet]);

  // ========================
  // Helpers internes
  // ========================
  const generateRef = (prefix: string): string => {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  };

  const updateWalletBalance = useCallback(
    async (delta: number): Promise<Wallet> => {
      if (!wallet || !user) throw new Error("Portefeuille introuvable");

      // Mise à jour atomique via RPC Postgres (évite les race conditions)
      const { data: newSolde, error } = await supabase.rpc("update_wallet_balance", {
        p_user_id: user.id,
        p_delta: delta,
      });

      if (error) {
        if (error.message.includes("solde insuffisant")) {
          throw new Error("Solde insuffisant");
        }
        throw new Error("Erreur mise à jour solde");
      }

      const updated: Wallet = { ...wallet, solde: Number(newSolde), derniereMaj: new Date().toISOString() };
      setWallet(updated);
      return updated;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wallet, user]
  );

  const createTransaction = useCallback(
    async (
      w: Wallet,
      type: TransactionType,
      montant: number,
      description: string,
      meta: TransactionMetadata,
      balanceBefore: number,
      balanceAfter: number,
      refPrefix: string
    ): Promise<Transaction> => {
      const ref = generateRef(refPrefix);
      const now = new Date().toISOString();

      const { data: txRow, error } = await supabase
        .from("transactions")
        .insert({
          wallet_id: w.id,
          user_id: w.userId,
          type,
          montant,
          solde_avant: balanceBefore,
          solde_apres: balanceAfter,
          devise: w.devise,
          statut: "confirme",
          reference: ref,
          description,
          meta_tontine_id: meta.tontineId || null,
          meta_tontine_nom: meta.tontineNom || null,
          meta_tour_id: meta.tourId || null,
          meta_tour_numero: meta.tourNumero || null,
          meta_beneficiaire: meta.beneficiaire || null,
          meta_methode: meta.methode || null,
          meta_frais: meta.frais || 0,
          meta_destinataire_id: meta.destinataireId || null,
          meta_expediteur_id: meta.expediteurId || null,
          confirmed_at: now,
        })
        .select()
        .single();

      if (error || !txRow) throw new Error("Erreur création transaction");

      const tx = rowToTransaction(txRow);
      setTransactions((prev) => [tx, ...prev]);
      return tx;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const createLedgerEntries = useCallback(
    async (transactionId: string, entries: { type: "debit" | "credit"; compte: CompteType; montant: number; devise: string; description: string }[]) => {
      const insertData = entries.map((e) => ({
        transaction_id: transactionId,
        type: e.type,
        compte: e.compte,
        montant: e.montant,
        devise: e.devise,
        description: e.description,
      }));

      const { data, error } = await supabase
        .from("ledger_entries")
        .insert(insertData)
        .select();

      if (!error && data) {
        const newEntries = data.map(rowToLedgerEntry);
        setLedger((prev) => [...prev, ...newEntries]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ========================
  // Opérations financières
  // ========================

  const deposer = useCallback(
    async (montant: number, methode: string) => {
      if (!user) return { success: false, error: "Non connecté" };
      if (montant <= 0) return { success: false, error: "Montant invalide" };
      if (montant > DEFAULT_FRAIS.seuilDepotMax) {
        return { success: false, error: `Dépôt maximum: ${DEFAULT_FRAIS.seuilDepotMax.toLocaleString("fr-FR")} € par jour` };
      }

      try {
        const w = await getOrCreateWallet();
        const balanceBefore = w.solde;
        const balanceAfter = balanceBefore + montant;

        await updateWalletBalance(montant);

        const tx = await createTransaction(
          w, "depot", montant,
          `Dépôt via ${methode === "stripe" ? "Stripe" : methode}`,
          { methode },
          balanceBefore, balanceAfter, "DEP"
        );

        await createLedgerEntries(tx.id, [
          { type: "debit", compte: "compte_transit", montant, devise: "EUR", description: `Dépôt reçu via ${methode}` },
          { type: "credit", compte: "wallet_utilisateur", montant, devise: "EUR", description: `Crédit portefeuille` },
        ]);

        return { success: true, transaction: tx };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Erreur" };
      }
    },
    [user, getOrCreateWallet, updateWalletBalance, createTransaction, createLedgerEntries]
  );

  const retirer = useCallback(
    async (montant: number, methode: string) => {
      if (!user) return { success: false, error: "Non connecté" };
      if (montant <= 0) return { success: false, error: "Montant invalide" };
      if (montant < DEFAULT_FRAIS.seuilRetraitMin) {
        return { success: false, error: `Retrait minimum: ${DEFAULT_FRAIS.seuilRetraitMin.toLocaleString("fr-FR")} €` };
      }

      try {
        const w = await getOrCreateWallet();
        if (w.solde < montant) {
          return { success: false, error: `Solde insuffisant. Vous avez ${w.solde.toLocaleString("fr-FR")} €` };
        }

        const balanceBefore = w.solde;
        const balanceAfter = balanceBefore - montant;

        await updateWalletBalance(-montant);

        const tx = await createTransaction(
          w, "retrait", montant,
          `Retrait via ${methode} (sans frais)`,
          { methode, frais: 0 },
          balanceBefore, balanceAfter, "RET"
        );

        await createLedgerEntries(tx.id, [
          { type: "debit", compte: "wallet_utilisateur", montant, devise: "EUR", description: `Retrait` },
          { type: "credit", compte: "compte_transit", montant, devise: "EUR", description: `Retrait envoyé via ${methode}` },
        ]);

        return { success: true, transaction: tx };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Erreur" };
      }
    },
    [user, getOrCreateWallet, updateWalletBalance, createTransaction, createLedgerEntries]
  );

  const payerCotisation = useCallback(
    async (
      montant: number,
      tontineId: string,
      tontineNom: string,
      tourId: string,
      tourNumero: number,
      methode: string
    ) => {
      if (!user) return { success: false, error: "Non connecté" };

      try {
        const w = await getOrCreateWallet();
        const fraisParticipant = Math.round(montant * DEFAULT_FRAIS.fraisParticipant) / 100;
        const totalDebit = montant + fraisParticipant;

        const isStripePayment = methode === "stripe";

        // Si paiement Stripe → la carte est déjà débitée, on ne touche PAS au wallet
        // Si paiement wallet → on débite le wallet
        let balanceBefore = w.solde;
        let balanceAfter = w.solde;

        if (!isStripePayment) {
          if (w.solde < totalDebit) {
            return {
              success: false,
              error: `Solde insuffisant. Vous avez ${w.solde.toLocaleString("fr-FR")} €, besoin de ${totalDebit.toLocaleString("fr-FR")} €`,
            };
          }
          balanceAfter = balanceBefore - totalDebit;
          await updateWalletBalance(-totalDebit);
        }

        const tx = await createTransaction(
          w, "cotisation", montant,
          `Cotisation ${isStripePayment ? "Stripe" : "wallet"} - ${tontineNom} (Tour ${tourNumero}) · Frais: ${fraisParticipant.toLocaleString("fr-FR")} €`,
          { tontineId, tontineNom, tourId, tourNumero, methode, frais: fraisParticipant },
          balanceBefore, balanceAfter, "COT"
        );

        await createLedgerEntries(tx.id, [
          {
            type: "debit",
            compte: isStripePayment ? "compte_transit" : "wallet_utilisateur",
            montant: totalDebit,
            devise: "EUR",
            description: `Cotisation ${tontineNom} + frais 1% (${isStripePayment ? "carte Stripe" : "wallet"})`,
          },
          { type: "credit", compte: "pot_tontine", montant, devise: "EUR", description: `Cotisation versée au pot` },
          { type: "credit", compte: "commission_plateforme", montant: fraisParticipant, devise: "EUR", description: `Frais participant 1%` },
        ]);

        return { success: true, transaction: tx };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Erreur" };
      }
    },
    [user, getOrCreateWallet, updateWalletBalance, createTransaction, createLedgerEntries]
  );

  const recevoirPot = useCallback(
    async (montant: number, tontineId: string, tontineNom: string, tourNumero: number) => {
      if (!user) return { success: false, error: "Non connecté" };

      try {
        const w = await getOrCreateWallet();
        const balanceBefore = w.solde;
        const balanceAfter = balanceBefore + montant;

        await updateWalletBalance(montant);

        const tx = await createTransaction(
          w, "reception_pot", montant,
          `Réception du pot - ${tontineNom} (Tour ${tourNumero})`,
          { tontineId, tontineNom, tourNumero },
          balanceBefore, balanceAfter, "POT"
        );

        await createLedgerEntries(tx.id, [
          { type: "debit", compte: "pot_tontine", montant, devise: "EUR", description: `Distribution pot` },
          { type: "credit", compte: "wallet_utilisateur", montant, devise: "EUR", description: `Pot reçu` },
        ]);

        return { success: true, transaction: tx };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Erreur" };
      }
    },
    [user, getOrCreateWallet, updateWalletBalance, createTransaction, createLedgerEntries]
  );

  const appliquerPenalite = useCallback(
    async (montant: number, tontineId: string, tontineNom: string, raison: string) => {
      if (!user) return { success: false, error: "Non connecté" };

      try {
        const w = await getOrCreateWallet();
        if (w.solde < montant) {
          return { success: false, error: "Solde insuffisant pour la pénalité" };
        }

        const balanceBefore = w.solde;
        const balanceAfter = balanceBefore - montant;

        await updateWalletBalance(-montant);

        const tx = await createTransaction(
          w, "penalite", montant,
          `Pénalité - ${tontineNom}: ${raison}`,
          { tontineId, tontineNom },
          balanceBefore, balanceAfter, "PEN"
        );

        await createLedgerEntries(tx.id, [
          { type: "debit", compte: "wallet_utilisateur", montant, devise: "EUR", description: `Pénalité: ${raison}` },
          { type: "credit", compte: "penalites", montant, devise: "EUR", description: `Pénalité collectée` },
        ]);

        return { success: true, transaction: tx };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Erreur" };
      }
    },
    [user, getOrCreateWallet, updateWalletBalance, createTransaction, createLedgerEntries]
  );

  const rembourserCotisationAnnulation = useCallback(
    async (montant: number, tontineId: string, tontineNom: string, tourNumero: number) => {
      if (!user) return { success: false, error: "Non connecté" };

      try {
        const w = await getOrCreateWallet();
        const balanceBefore = w.solde;
        const balanceAfter = balanceBefore + montant;

        await updateWalletBalance(montant);

        const tx = await createTransaction(
          w, "remboursement", montant,
          `Remboursement - ${tontineNom} (Tour ${tourNumero}) suite à annulation`,
          { tontineId, tontineNom, tourNumero },
          balanceBefore, balanceAfter, "RMB"
        );

        await createLedgerEntries(tx.id, [
          { type: "debit", compte: "pot_tontine", montant, devise: "EUR", description: `Remboursement annulation` },
          { type: "credit", compte: "wallet_utilisateur", montant, devise: "EUR", description: `Remboursement cotisation` },
        ]);

        return { success: true, transaction: tx };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Erreur" };
      }
    },
    [user, getOrCreateWallet, updateWalletBalance, createTransaction, createLedgerEntries]
  );

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

    // Vérifier si l'utilisateur a déjà eu un essai (même expiré)
    if (abonnement && abonnement.plan === "essai_gratuit") {
      return { success: false, error: "Vous avez déjà utilisé votre essai gratuit" };
    }

    try {
      const now = new Date();
      const expiration = new Date(now);
      expiration.setDate(expiration.getDate() + 90); // 90 jours d'essai

      const { data: subData, error } = await supabase
        .from("abonnements")
        .upsert({
          user_id: user.id,
          plan: "essai_gratuit",
          montant: 0,
          devise: "EUR",
          date_debut: now.toISOString(),
          date_expiration: expiration.toISOString(),
          statut: "essai",
          renouvellement_auto: false,
          reference: `ESSAI-${Date.now().toString(36).toUpperCase()}`,
        }, { onConflict: "user_id" })
        .select()
        .single();

      if (error) {
        console.error("Supabase essai gratuit error:", error.message, error.code, error.details);
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

  const souscrireAbonnement = useCallback(async () => {
    if (!user) return { success: false, error: "Non connecté" };

    try {
      const w = await getOrCreateWallet();
      const prix = DEFAULT_FRAIS.abonnementAnnuel;

      if (w.solde < prix) {
        return { success: false, error: `Solde insuffisant. Besoin de ${prix} €` };
      }

      if (isAbonnementActif()) {
        return { success: false, error: "Vous avez déjà un abonnement actif" };
      }

      const balanceBefore = w.solde;
      const balanceAfter = balanceBefore - prix;
      await updateWalletBalance(-prix);

      const tx = await createTransaction(
        w, "abonnement", prix,
        "Abonnement annuel organisateur Binq",
        { frais: 0 },
        balanceBefore, balanceAfter, "ABO"
      );

      await createLedgerEntries(tx.id, [
        { type: "debit", compte: "wallet_utilisateur", montant: prix, devise: "EUR", description: "Abonnement annuel" },
        { type: "credit", compte: "commission_plateforme", montant: prix, devise: "EUR", description: "Revenu abonnement" },
      ]);

      const now = new Date();
      const expiration = new Date(now);
      expiration.setFullYear(expiration.getFullYear() + 1);

      const { data: subData, error } = await supabase
        .from("abonnements")
        .upsert({
          user_id: user.id,
          plan: "annuel",
          montant: prix,
          devise: "EUR",
          date_debut: now.toISOString(),
          date_expiration: expiration.toISOString(),
          statut: "actif",
          renouvellement_auto: false,
          reference: tx.reference,
        }, { onConflict: "user_id" })
        .select()
        .single();

      if (!error && subData) {
        setAbonnement(rowToAbonnement(subData));
      }

      return { success: true, transaction: tx };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Erreur" };
    }
  }, [user, getOrCreateWallet, updateWalletBalance, createTransaction, createLedgerEntries, isAbonnementActif, supabase]);

  // ========================
  // Stripe Checkout abonnement
  // ========================
  const souscrireAbonnementStripe = useCallback(async (): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!user) return { success: false, error: "Non connecté" };

    // Autoriser l'upgrade depuis un essai gratuit, bloquer seulement si déjà abonné payant
    if (isAbonnementActif() && !isEssaiGratuit()) {
      return { success: false, error: "Vous avez déjà un abonnement actif" };
    }

    try {
      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        return { success: false, error: data.error || "Erreur lors de la création de la session Stripe" };
      }

      return { success: true, url: data.url };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Erreur réseau" };
    }
  }, [user, isAbonnementActif, isEssaiGratuit]);

  // ========================
  // Rafraîchir l'abonnement depuis Supabase
  // ========================
  const rafraichirAbonnement = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("abonnements").select("*").eq("user_id", user.id).single();
    if (data) setAbonnement(rowToAbonnement(data));
  }, [user, supabase]);

  // ========================
  // Consultation
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

  const getLedger = useCallback((): LedgerEntry[] => {
    return ledger;
  }, [ledger]);

  const getFinancialSummary = useCallback((): FinancialSummary => {
    const userTx = transactions.filter((t) => t.statut === "confirme");

    return {
      soldeDisponible: wallet?.solde || 0,
      soldeBloquer: wallet?.soldeBloquer || 0,
      totalDepose: userTx.filter((t) => t.type === "depot").reduce((sum, t) => sum + t.montant, 0),
      totalRetire: userTx.filter((t) => t.type === "retrait").reduce((sum, t) => sum + t.montant, 0),
      totalCotisationsPaye: userTx.filter((t) => t.type === "cotisation").reduce((sum, t) => sum + t.montant, 0),
      totalPotsRecus: userTx.filter((t) => t.type === "reception_pot").reduce((sum, t) => sum + t.montant, 0),
      totalFraisParticipant: userTx.filter((t) => t.type === "cotisation").reduce((sum, t) => sum + (t.metadata.frais || 0), 0),
      totalAbonnements: userTx.filter((t) => t.type === "abonnement").reduce((sum, t) => sum + t.montant, 0),
      totalPenalites: userTx.filter((t) => t.type === "penalite").reduce((sum, t) => sum + t.montant, 0),
      nombreTransactions: userTx.length,
    };
  }, [wallet, transactions]);

  const getTontineFinancialSummary = useCallback(
    (tontineId: string): TontineFinancialSummary => {
      const tontineTx = transactions.filter((t) => t.metadata.tontineId === tontineId && t.statut === "confirme");

      return {
        tontineId,
        potTotal: tontineTx.filter((t) => t.type === "cotisation").reduce((sum, t) => sum + t.montant, 0),
        cotisationsRecues: tontineTx.filter((t) => t.type === "cotisation").length,
        cotisationsEnAttente: 0,
        commissionsPrelevees: tontineTx.reduce((sum, t) => sum + (t.metadata.frais || 0), 0),
        potsDistribues: tontineTx.filter((t) => t.type === "reception_pot").reduce((sum, t) => sum + t.montant, 0),
        penalitesCollectees: tontineTx.filter((t) => t.type === "penalite").reduce((sum, t) => sum + t.montant, 0),
      };
    },
    [transactions]
  );

  const getFraisConfig = useCallback(() => DEFAULT_FRAIS, []);

  return (
    <FinanceContext.Provider
      value={{
        wallet,
        getOrCreateWallet,
        abonnement,
        activerEssaiGratuit,
        souscrireAbonnement,
        souscrireAbonnementStripe,
        rafraichirAbonnement,
        isAbonnementActif,
        isEssaiGratuit,
        getJoursRestantsAbonnement,
        deposer,
        retirer,
        payerCotisation,
        recevoirPot,
        appliquerPenalite,
        rembourserCotisationAnnulation,
        getTransactions,
        getLedger,
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

function rowToWallet(row: Record<string, unknown>): Wallet {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    solde: parseFloat(row.solde as string) || 0,
    soldeBloquer: parseFloat(row.solde_bloque as string) || 0,
    devise: (row.devise as string) || "EUR",
    dateCreation: (row.created_at as string) || new Date().toISOString(),
    derniereMaj: (row.updated_at as string) || new Date().toISOString(),
  };
}

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    walletId: row.wallet_id as string,
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
