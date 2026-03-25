import crypto from "crypto";

const getSignSecret = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY || "binq-default-hmac-secret";

// ═══════════════════════════════════════════
// CONFIG CinetPay
// ═══════════════════════════════════════════

const CINETPAY_BASE_URL = "https://api-checkout.cinetpay.com/v2/payment";

export function isCinetPayConfigured(): boolean {
  return !!(process.env.CINETPAY_APIKEY && process.env.CINETPAY_SITE_ID);
}

// ═══════════════════════════════════════════
// CINETPAY API
// ═══════════════════════════════════════════

interface CinetPayInitParams {
  transaction_id: string;
  amount: number;
  currency?: string;
  description: string;
  return_url: string;
  notify_url: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone_number?: string;
  channels?: string;
  metadata?: string;
}

interface CinetPayInitResponse {
  code: string;
  message: string;
  description: string;
  data: {
    payment_token: string;
    payment_url: string;
  };
  api_response_id: string;
}

/** Initialise un paiement CinetPay et retourne l'URL de paiement */
export async function createCinetPayPayment(
  params: CinetPayInitParams
): Promise<{ payment_url: string; payment_token: string }> {
  const body: Record<string, unknown> = {
    apikey: process.env.CINETPAY_APIKEY!,
    site_id: process.env.CINETPAY_SITE_ID!,
    transaction_id: params.transaction_id,
    amount: params.amount,
    currency: params.currency || "XOF",
    description: params.description,
    return_url: params.return_url,
    notify_url: params.notify_url,
    channels: params.channels || "ALL",
  };

  if (params.customer_name) body.customer_name = params.customer_name;
  if (params.customer_email) body.customer_email = params.customer_email;
  if (params.customer_phone_number)
    body.customer_phone_number = params.customer_phone_number;
  if (params.metadata) body.metadata = params.metadata;

  const res = await fetch(CINETPAY_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json: CinetPayInitResponse = await res.json();

  if (json.code !== "201") {
    throw new Error(
      `CinetPay init error: ${json.description || json.message || "Erreur inconnue"}`
    );
  }

  return {
    payment_url: json.data.payment_url,
    payment_token: json.data.payment_token,
  };
}

interface CinetPayCheckResponse {
  code: string;
  message: string;
  data: {
    amount: string;
    currency: string;
    status: string; // "ACCEPTED" | "REFUSED"
    payment_method: string;
    description: string;
    metadata: string | null;
    operator_id: string | null;
    payment_date: string;
  };
  api_response_id: string;
}

/** Vérifie le statut d'un paiement CinetPay */
export async function verifyCinetPayPayment(
  transactionId: string
): Promise<{
  paid: boolean;
  status: string;
  amount: number;
  payment_method: string;
}> {
  const res = await fetch(`${CINETPAY_BASE_URL}/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_APIKEY!,
      site_id: process.env.CINETPAY_SITE_ID!,
      transaction_id: transactionId,
    }),
  });

  const json: CinetPayCheckResponse = await res.json();

  if (json.code !== "00") {
    return {
      paid: false,
      status: json.data?.status || "UNKNOWN",
      amount: parseInt(json.data?.amount) || 0,
      payment_method: json.data?.payment_method || "",
    };
  }

  return {
    paid: json.data.status === "ACCEPTED",
    status: json.data.status,
    amount: parseInt(json.data.amount) || 0,
    payment_method: json.data.payment_method || "",
  };
}

/** Génère un transaction_id unique pour CinetPay */
export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(6).toString("hex");
  return `BQ${timestamp}${random}`;
}

// ═══════════════════════════════════════════
// ORDER DATA (HMAC signing — inchangé)
// ═══════════════════════════════════════════

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

// ═══════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════

/** Deterministic reference from transaction ID (for idempotency) */
export function generatePaymentRef(
  transactionId: string | number,
  index: number
): string {
  const hash = crypto
    .createHash("sha256")
    .update(`cp-${transactionId}-${index}`)
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
