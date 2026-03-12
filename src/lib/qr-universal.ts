/**
 * QR Universel — Helper pour generer et resoudre les codes QR universels Binq.
 *
 * Format: /q/{CODE}
 * Un seul code court = un routage automatique vers boutique, produit, paiement, vendeur, commande.
 */

import crypto from "crypto";

/** Genere un code court unique (8 chars alphanumeriques) */
export function generateQRCode(): string {
  return crypto.randomBytes(4).toString("hex"); // 8 chars hex
}

/** Types de QR supportes */
export type QRType = "boutique" | "produit" | "paiement" | "vendeur" | "commande";

/** Map type → destination URL */
export function getRedirectUrl(qr: {
  type: QRType;
  boutique_id?: string | null;
  produit_id?: string | null;
  user_id?: string | null;
  commande_id?: string | null;
  payment_link_id?: string | null;
  // Extra data from joins
  boutique_slug?: string | null;
}): string {
  switch (qr.type) {
    case "boutique":
      return qr.boutique_slug
        ? `/boutique/${qr.boutique_slug}`
        : `/boutique/${qr.boutique_id}`;
    case "produit":
      return `/produit/${qr.produit_id}`;
    case "paiement":
      return `/pay/${qr.payment_link_id}`;
    case "vendeur":
      return `/pay/user/${qr.user_id}`;
    case "commande":
      return `/commandes?id=${qr.commande_id}`;
    default:
      return "/dashboard";
  }
}
