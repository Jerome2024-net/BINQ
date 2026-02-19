import { z } from "zod";

/** Schéma pour créer un PaymentIntent (dépôt portefeuille) */
export const createIntentSchema = z.object({
  amount: z.number().positive("Montant doit être positif").min(0.5, "Montant minimum: 0,50€"),
  currency: z.enum(["eur", "usd"]).default("eur"),
  description: z.string().optional(),
});

/** Schéma pour créer une cotisation */
export const createCotisationSchema = z.object({
  amount: z.number().positive("Montant doit être positif").min(0.5, "Montant minimum: 0,50€"),
  currency: z.enum(["eur", "usd"]).default("eur"),
  tontineId: z.string().uuid("tontineId invalide"),
  tontineNom: z.string().min(1, "Nom de tontine requis"),
  tourId: z.string().uuid("tourId invalide"),
  tourNumero: z.number().int().positive("Numéro de tour invalide"),
  payerUserId: z.string().uuid("payerUserId invalide").optional(),
});

/** Schéma pour distribuer un pot */
export const distributePotSchema = z.object({
  amount: z.number().positive("Montant doit être positif"),
  currency: z.enum(["eur", "usd"]).default("eur"),
  destinationAccountId: z.string().min(1, "Compte destination requis").startsWith("acct_", "ID compte Stripe invalide"),
  tontineNom: z.string().min(1, "Nom de tontine requis"),
  tourNumero: z.number().int().positive("Numéro de tour invalide"),
  tontineId: z.string().uuid("tontineId invalide").optional(),
  tourId: z.string().uuid("tourId invalide").optional(),
  beneficiaryUserId: z.string().uuid("beneficiaryUserId invalide").optional(),
});

/** Schéma pour l'abonnement */
export const createSubscriptionSchema = z.object({
  email: z.string().email("Email invalide").optional(),
});

/** Schéma pour créer un compte Stripe Connect */
export const createAccountSchema = z.object({
  email: z.string().email("Email invalide"),
});

/** Schéma pour l'onboarding link */
export const onboardingLinkSchema = z.object({
  accountId: z.string().min(1, "accountId requis").startsWith("acct_", "ID compte Stripe invalide"),
});

/** Schéma pour le payout */
export const createPayoutSchema = z.object({
  amount: z.number().positive("Montant doit être positif"),
  currency: z.enum(["eur", "usd"]).default("eur"),
  stripeAccountId: z.string().min(1, "stripeAccountId requis").startsWith("acct_", "ID compte Stripe invalide"),
});

/** Schéma pour upload d'image tontine */
export const uploadImageSchema = z.object({
  tontineId: z.string().min(1, "tontineId requis"),
});

/** Helper: valider un body avec un schéma Zod et retourner le résultat */
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return { success: false, error: firstError?.message || "Données invalides" };
  }
  return { success: true, data: result.data };
}
