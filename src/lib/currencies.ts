/**
 * Gestion des devises Binq.
 * XOF (Franc CFA) est arrimé à l'EUR au taux fixe : 1 EUR = 655.957 XOF.
 */

export type DeviseCode = "EUR" | "XOF";

export const TAUX_EUR_XOF = 655.957; // Parité fixe garantie par le Trésor français

export interface DeviseConfig {
  code: DeviseCode;
  label: string;
  symbol: string;
  flag: string;
  decimals: number; // 2 pour EUR, 0 pour XOF
  locale: string;
  stripeCurrency: string; // Stripe facture toujours en EUR
  minDeposit: number; // Montant minimum de dépôt dans cette devise
  minTransfer: number; // Montant minimum de transfert
}

export const DEVISES: Record<DeviseCode, DeviseConfig> = {
  EUR: {
    code: "EUR",
    label: "Euro",
    symbol: "€",
    flag: "🇪🇺",
    decimals: 2,
    locale: "fr-FR",
    stripeCurrency: "eur",
    minDeposit: 1,
    minTransfer: 1,
  },
  XOF: {
    code: "XOF",
    label: "Franc CFA",
    symbol: "FCFA",
    flag: "🇸🇳",
    decimals: 0,
    locale: "fr-FR",
    stripeCurrency: "eur", // On facture en EUR puis on convertit
    minDeposit: 500, // 500 FCFA minimum
    minTransfer: 100, // 100 FCFA minimum
  },
};

export const DEVISE_LIST: DeviseCode[] = ["XOF", "EUR"];
export const DEFAULT_DEVISE: DeviseCode = "XOF"; // Par défaut FCFA pour l'Afrique

/**
 * Convertir EUR → XOF au taux fixe.
 */
export function eurToXof(eur: number): number {
  return Math.round(eur * TAUX_EUR_XOF);
}

/**
 * Convertir XOF → EUR au taux fixe.
 */
export function xofToEur(xof: number): number {
  return Math.round((xof / TAUX_EUR_XOF) * 100) / 100;
}

/**
 * Convertir un montant d'une devise à une autre.
 */
export function convertAmount(
  amount: number,
  from: DeviseCode,
  to: DeviseCode
): number {
  if (from === to) return amount;
  if (from === "EUR" && to === "XOF") return eurToXof(amount);
  if (from === "XOF" && to === "EUR") return xofToEur(amount);
  return amount;
}

/**
 * Formater un montant selon la devise.
 */
export function formatMontant(
  amount: number,
  devise: DeviseCode = "XOF"
): string {
  const config = DEVISES[devise];
  if (devise === "XOF") {
    // FCFA : pas de décimales, séparateur milliers, symbole après
    return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
  }
  // EUR
  return `${amount.toLocaleString(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  })} ${config.symbol}`;
}

/**
 * Formater un montant court (sans symbole, pour les inputs).
 */
export function formatMontantShort(
  amount: number,
  devise: DeviseCode = "XOF"
): string {
  const config = DEVISES[devise];
  return amount.toLocaleString(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
}

/**
 * Calculer le montant EUR à facturer pour un dépôt en XOF via Stripe.
 * Stripe facture en EUR, on crédite en XOF.
 */
export function calcDepositStripeAmount(
  montantDevise: number,
  devise: DeviseCode
): { montantCredite: number; montantEur: number; fraisEur: number; totalEur: number } {
  const TAUX_FRAIS = 0.01; // 1%
  const montantEur = devise === "XOF" ? xofToEur(montantDevise) : montantDevise;
  const fraisEur = Math.round(montantEur * TAUX_FRAIS * 100) / 100;
  const totalEur = Math.round((montantEur + fraisEur) * 100) / 100;
  return {
    montantCredite: devise === "XOF" ? Math.round(montantDevise) : montantDevise,
    montantEur,
    fraisEur,
    totalEur,
  };
}
