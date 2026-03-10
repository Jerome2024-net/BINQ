/**
 * Payment Gateway — Configuration des méthodes de paiement universelles Binq.
 *
 * Méthodes supportées :
 * - Binq Wallet (gratuit, 0%)
 * - Carte bancaire via Stripe (2%)
 * - Orange Money via PayDunya (1%)
 * - MTN MoMo via PayDunya (1%)
 * - Moov Money via PayDunya (1%)
 *
 * ⛔ PAS de Wave (concurrent direct)
 * ⛔ PAS de CinetPay (mauvaise presse)
 */

export type PaymentMethodId =
  | "binq_wallet"
  | "card_stripe"
  | "orange_money"
  | "mtn_momo"
  | "moov_money";

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  description: string;
  icon: string; // emoji
  provider: "binq" | "stripe" | "paydunya";
  feePercent: number;
  requiresAuth: boolean; // true = needs Binq account
  available: boolean;
  color: string; // tailwind bg color
  textColor: string;
  countries: string[]; // ISO codes
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "binq_wallet",
    label: "Binq Wallet",
    description: "Paiement instantané, 0% de frais",
    icon: "💳",
    provider: "binq",
    feePercent: 0,
    requiresAuth: true,
    available: true,
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    countries: ["SN", "CI", "ML", "BF", "BJ", "TG", "NE", "GW", "FR", "BE"],
  },
  {
    id: "card_stripe",
    label: "Carte bancaire",
    description: "Visa, Mastercard — Paiement sécurisé",
    icon: "💳",
    provider: "stripe",
    feePercent: 2,
    requiresAuth: false,
    available: true,
    color: "bg-blue-500",
    textColor: "text-blue-600",
    countries: ["*"], // Mondial
  },
  {
    id: "orange_money",
    label: "Orange Money",
    description: "Paiement mobile Orange",
    icon: "🟠",
    provider: "paydunya",
    feePercent: 1,
    requiresAuth: false,
    available: true,
    color: "bg-orange-500",
    textColor: "text-orange-600",
    countries: ["SN", "CI", "ML", "BF", "GW", "NE"],
  },
  {
    id: "mtn_momo",
    label: "MTN MoMo",
    description: "Paiement mobile MTN",
    icon: "🟡",
    provider: "paydunya",
    feePercent: 1,
    requiresAuth: false,
    available: true,
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    countries: ["CI", "BJ", "GH", "CM"],
  },
  {
    id: "moov_money",
    label: "Moov Money",
    description: "Paiement mobile Moov",
    icon: "🔵",
    provider: "paydunya",
    feePercent: 1,
    requiresAuth: false,
    available: true,
    color: "bg-cyan-500",
    textColor: "text-cyan-600",
    countries: ["CI", "BJ", "TG", "NE", "BF"],
  },
];

/**
 * Calcul des frais pour un montant donné.
 */
export function calculateFees(
  amount: number,
  methodId: PaymentMethodId
): { frais: number; totalPayeur: number; netMarchand: number } {
  const method = PAYMENT_METHODS.find((m) => m.id === methodId);
  if (!method) {
    return { frais: 0, totalPayeur: amount, netMarchand: amount };
  }
  const frais = Math.ceil(amount * (method.feePercent / 100));
  return {
    frais,
    totalPayeur: amount + frais,
    netMarchand: amount,
  };
}

/**
 * Récupérer une méthode par ID.
 */
export function getPaymentMethod(id: PaymentMethodId): PaymentMethod | undefined {
  return PAYMENT_METHODS.find((m) => m.id === id);
}

/**
 * Méthodes disponibles (filtrées par activation).
 */
export function getAvailableMethods(): PaymentMethod[] {
  return PAYMENT_METHODS.filter((m) => m.available);
}

/**
 * PayDunya channel mapping.
 * Maps our method IDs to PayDunya's expected channel names.
 */
export function getPayDunyaChannel(
  methodId: PaymentMethodId
): string | null {
  switch (methodId) {
    case "orange_money":
      return "orange-money-senegal";
    case "mtn_momo":
      return "mtn-ci";
    case "moov_money":
      return "moov-ci";
    default:
      return null;
  }
}

/**
 * Vérifie si la méthode est un paiement mobile money (PayDunya).
 */
export function isMobileMoneyMethod(methodId: PaymentMethodId): boolean {
  return ["orange_money", "mtn_momo", "moov_money"].includes(methodId);
}
