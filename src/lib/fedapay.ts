import crypto from "crypto";

const getSignSecret = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY || "binq-default-hmac-secret";

// ═══ CONFIG ═══

export function isFedaPayConfigured(): boolean {
  return !!process.env.FEDAPAY_SECRET_KEY;
}

export async function initFedaPay() {
  const fedapay = await import("fedapay");
  const FedaPayClass = fedapay.FedaPay || (fedapay as any).default?.FedaPay;
  if (FedaPayClass) {
    FedaPayClass.setApiKey(process.env.FEDAPAY_SECRET_KEY!);
    FedaPayClass.setEnvironment(process.env.FEDAPAY_ENV || "sandbox");
  }
}

// ═══ ORDER DATA ═══

export interface OrderData {
  ticket_type_id: string;
  buyer_name: string;
  buyer_email?: string;
  buyer_phone?: string;
  qty: number;
  event_id: string;
  montant_total: number;
  devise: string;
}

/** Sign order data into a base64url-encoded payload + HMAC signature */
export function signOrderData(data: OrderData): {
  encoded: string;
  signature: string;
} {
  const json = JSON.stringify(data);
  const encoded = Buffer.from(json).toString("base64url");
  const hmac = crypto.createHmac("sha256", getSignSecret());
  hmac.update(encoded);
  const signature = hmac.digest("hex");
  return { encoded, signature };
}

/** Verify HMAC and decode order data. Returns null if invalid. */
export function verifyAndDecodeOrder(
  encoded: string,
  signature: string
): OrderData | null {
  const hmac = crypto.createHmac("sha256", getSignSecret());
  hmac.update(encoded);
  const expected = hmac.digest("hex");

  // Timing-safe comparison
  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return null;
  }

  try {
    const json = Buffer.from(encoded, "base64url").toString();
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ═══ UTILS ═══

/** Deterministic reference from FedaPay transaction ID (for idempotency) */
export function generatePaymentRef(
  transactionId: string | number,
  index: number
): string {
  const hash = crypto
    .createHash("sha256")
    .update(`fp-${transactionId}-${index}`)
    .digest("hex")
    .substring(0, 8)
    .toUpperCase();
  return `BQ-${hash}`;
}

/** Generate random QR code string */
export function generateQR(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
