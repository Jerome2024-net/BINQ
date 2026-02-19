"use client";

import React, { createContext, useContext, useCallback, useState } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

// ========================
// Types du contexte
// ========================
export type SupportedCurrency = "eur" | "usd";

interface StripeAccountStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  balance: { available: number; pending: number };
}

interface PaymentContextType {
  // Dépôt simple via Stripe (pour wallet legacy ou top-up)
  createPaymentIntent: (montant: number, currency: SupportedCurrency, description?: string) => Promise<{ clientSecret: string; paymentIntentId: string } | null>;
  confirmDeposit: (montant: number, paymentIntentId: string) => void;

  // Stripe Connect — Comptes
  createConnectAccount: () => Promise<{ accountId: string } | null>;
  getOnboardingLink: () => Promise<string | null>;
  refreshAccountStatus: () => Promise<StripeAccountStatus | null>;

  // Stripe Connect — Cotisations
  createCotisationPayment: (
    montant: number,
    currency: SupportedCurrency,
    tontineId: string,
    tontineNom: string,
    tourId: string,
    tourNumero: number
  ) => Promise<{ clientSecret: string; paymentIntentId: string; applicationFee: number } | null>;

  // Stripe Connect — Distribution du pot
  distributePot: (
    montant: number,
    currency: SupportedCurrency,
    destinationAccountId: string,
    tontineNom: string,
    tourNumero: number
  ) => Promise<{ transferId: string } | null>;

  // Stripe Connect — Payout (retrait vers banque)
  createPayout: (montant: number, currency: SupportedCurrency) => Promise<{ payoutId: string; status: string } | null>;

  // Abonnement Stripe
  createSubscription: () => Promise<{ url: string } | null>;

  // Retrait via Stripe Payout
  initierRetrait: (montant: number, methode: string, destination: string) => void;

  // État
  isProcessing: boolean;
  isConfigured: boolean;
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  connectAccount: StripeAccountStatus | null;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

// ========================
// Provider
// ========================
export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState<SupportedCurrency>("eur");
  const [connectAccount, setConnectAccount] = useState<StripeAccountStatus | null>(null);

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const isConfigured =
    !!publishableKey &&
    publishableKey !== "pk_test_VOTRE_CLE_PUBLISHABLE_ICI" &&
    publishableKey.startsWith("pk_");

  // ========================
  // Dépôt simple (PaymentIntent direct)
  // ========================
  const createPaymentIntent = useCallback(
    async (montant: number, cur: SupportedCurrency, description?: string) => {
      if (!user) {
        showToast("error", "Erreur", "Vous devez être connecté");
        return null;
      }

      setIsProcessing(true);
      try {
        const response = await fetch("/api/payment/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: montant,
            currency: cur,
            description: description || `Dépôt portefeuille – ${user.prenom} ${user.nom}`,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erreur création paiement");

        return {
          clientSecret: data.clientSecret as string,
          paymentIntentId: data.paymentIntentId as string,
        };
      } catch (err) {
        showToast("error", "Erreur paiement", err instanceof Error ? err.message : "Impossible de créer le paiement");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [user, showToast]
  );

  const confirmDeposit = useCallback(
    async (montant: number, _paymentIntentId: string) => {
      if (!user) return;
      const deviseLabel = currency === "eur" ? "€" : "$";
      // Le webhook Stripe enregistre automatiquement la transaction dans Supabase
      showToast("success", "Dépôt confirmé ! ✅", `${montant.toLocaleString("fr-FR")} ${deviseLabel} traité par Stripe`);
    },
    [user, currency, showToast]
  );

  // ========================
  // Stripe Connect — Création de compte
  // ========================
  const createConnectAccount = useCallback(async () => {
    if (!user) {
      showToast("error", "Erreur", "Vous devez être connecté");
      return null;
    }

    if (user.stripeAccountId) {
      return { accountId: user.stripeAccountId };
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/stripe/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          firstName: user.prenom,
          lastName: user.nom,
          userId: user.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur création compte");

      await updateProfile({
        stripeAccountId: data.accountId,
        stripeOnboardingComplete: data.detailsSubmitted,
        stripeChargesEnabled: data.chargesEnabled,
        stripePayoutsEnabled: data.payoutsEnabled,
      });

      showToast("success", "Compte Stripe créé !", "Complétez la vérification d'identité pour recevoir des paiements");
      return { accountId: data.accountId };
    } catch (err) {
      showToast("error", "Erreur", err instanceof Error ? err.message : "Impossible de créer le compte Stripe");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [user, updateProfile, showToast]);

  // ========================
  // Stripe Connect — Lien d'onboarding
  // ========================
  const getOnboardingLink = useCallback(async () => {
    if (!user?.stripeAccountId) {
      showToast("error", "Erreur", "Créez d'abord votre compte Stripe Connect");
      return null;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/stripe/onboarding-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: user.stripeAccountId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur lien onboarding");

      return data.url as string;
    } catch (err) {
      showToast("error", "Erreur", err instanceof Error ? err.message : "Impossible de générer le lien");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [user, showToast]);

  // ========================
  // Stripe Connect — Statut du compte
  // ========================
  const refreshAccountStatus = useCallback(async () => {
    if (!user?.stripeAccountId) return null;

    try {
      const response = await fetch("/api/stripe/account-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: user.stripeAccountId }),
      });

      const data = await response.json();
      if (!response.ok) return null;

      const status: StripeAccountStatus = {
        accountId: data.accountId,
        chargesEnabled: data.chargesEnabled,
        payoutsEnabled: data.payoutsEnabled,
        detailsSubmitted: data.detailsSubmitted,
        balance: data.balance,
      };

      setConnectAccount(status);

      await updateProfile({
        stripeOnboardingComplete: data.detailsSubmitted,
        stripeChargesEnabled: data.chargesEnabled,
        stripePayoutsEnabled: data.payoutsEnabled,
      });

      return status;
    } catch {
      return null;
    }
  }, [user, updateProfile]);

  // ========================
  // Stripe Connect — Cotisation
  // ========================
  const createCotisationPayment = useCallback(
    async (
      montant: number,
      cur: SupportedCurrency,
      tontineId: string,
      tontineNom: string,
      tourId: string,
      tourNumero: number
    ) => {
      if (!user) {
        showToast("error", "Erreur", "Vous devez être connecté");
        return null;
      }

      setIsProcessing(true);
      try {
        const response = await fetch("/api/stripe/create-cotisation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: montant,
            currency: cur,
            tontineId,
            tontineNom,
            tourId,
            tourNumero,
            payerUserId: user.id,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erreur création cotisation");

        return {
          clientSecret: data.clientSecret as string,
          paymentIntentId: data.paymentIntentId as string,
          applicationFee: data.applicationFee as number,
        };
      } catch (err) {
        showToast("error", "Erreur paiement", err instanceof Error ? err.message : "Impossible de créer le paiement");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [user, showToast]
  );

  // ========================
  // Stripe Connect — Distribution du pot
  // ========================
  const distributePot = useCallback(
    async (
      montant: number,
      cur: SupportedCurrency,
      destinationAccountId: string,
      tontineNom: string,
      tourNumero: number
    ) => {
      setIsProcessing(true);
      try {
        const response = await fetch("/api/stripe/distribute-pot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: montant,
            currency: cur,
            destinationAccountId,
            tontineNom,
            tourNumero,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erreur distribution pot");

        showToast("success", "Pot distribué ! 🎉", `${montant.toLocaleString("fr-FR")} ${cur === "eur" ? "€" : "$"} transférés au bénéficiaire`);
        return { transferId: data.transferId as string };
      } catch (err) {
        showToast("error", "Erreur transfert", err instanceof Error ? err.message : "Impossible de distribuer le pot");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [showToast]
  );

  // ========================
  // Stripe Connect — Payout
  // ========================
  const createPayout = useCallback(
    async (montant: number, cur: SupportedCurrency) => {
      if (!user?.stripeAccountId) {
        showToast("error", "Erreur", "Vous devez avoir un compte Stripe Connect vérifié");
        return null;
      }

      setIsProcessing(true);
      try {
        const response = await fetch("/api/stripe/create-payout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: montant,
            currency: cur,
            accountId: user.stripeAccountId,
            description: `Retrait Binq – ${user.prenom} ${user.nom}`,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erreur payout");

        // Le webhook Stripe enregistre automatiquement la transaction
        showToast("success", "Retrait initié ! 💸", `${montant.toLocaleString("fr-FR")} ${cur === "eur" ? "€" : "$"} vers votre compte bancaire`);
        return { payoutId: data.payoutId as string, status: data.status as string };
      } catch (err) {
        showToast("error", "Erreur retrait", err instanceof Error ? err.message : "Impossible d'effectuer le retrait");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [user, showToast]
  );

  // ========================
  // Abonnement Stripe
  // ========================
  const createSubscription = useCallback(async () => {
    if (!user) {
      showToast("error", "Erreur", "Vous devez être connecté");
      return null;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur création abonnement");

      return { url: data.url as string };
    } catch (err) {
      showToast("error", "Erreur", err instanceof Error ? err.message : "Impossible de créer l'abonnement");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [user, showToast]);

  // ========================
  // Retrait local
  // ========================
  const initierRetrait = useCallback(
    async (montant: number, _methode: string, destination: string) => {
      if (!user) {
        showToast("error", "Erreur", "Vous devez être connecté");
        return;
      }

      // Utiliser Stripe Payout via le compte Connect
      const result = await createPayout(montant, currency);
      if (result) {
        const deviseLabel = currency === "eur" ? "€" : "$";
        showToast("success", "Retrait initié ! 📤", `${montant.toLocaleString("fr-FR")} ${deviseLabel} vers ${destination}. Traitement sous 24-48h.`);
      }
    },
    [user, currency, createPayout, showToast]
  );

  return (
    <PaymentContext.Provider
      value={{
        createPaymentIntent,
        confirmDeposit,
        createConnectAccount,
        getOnboardingLink,
        refreshAccountStatus,
        createCotisationPayment,
        distributePot,
        createPayout,
        createSubscription,
        initierRetrait,
        isProcessing,
        isConfigured,
        currency,
        setCurrency,
        connectAccount,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) throw new Error("usePayment must be used within PaymentProvider");
  return context;
}
