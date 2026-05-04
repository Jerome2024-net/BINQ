import crypto from "crypto";

const getSignSecret = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY || "binq-default-hmac-secret";

const FEDAPAY_BASE_URL = "https://api.fedapay.com/v1";

export function isFedaPayConfigured(): boolean {
  return !!process.env.FEDAPAY_SECRET_KEY;
}

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

interface FedaPayInitParams {
  transaction_id: string;
  amount: number;
  currency?: string;
  description: string;
  return_url: string;
  notify_url: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone_number?: string;
}

function getBearerHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
  };
}

function extractAnyUrl(payload: any): string | null {
  return (
    payload?.["v1/transaction"]?.payment_url ||
    payload?.["v1/transaction"]?.url ||
    payload?.v1?.url ||
    payload?.v1?.token?.url ||
    payload?.v1?.transaction?.payment_url ||
    payload?.url ||
    payload?.token?.url ||
    payload?.data?.url ||
    payload?.data?.payment_url ||
    payload?.payment_url ||
    null
  );
}

function extractAnyTransactionId(payload: any): string | null {
  const value =
    payload?.["v1/transaction"]?.id ||
    payload?.v1?.transaction?.id ||
    payload?.v1?.id ||
    payload?.id ||
    payload?.transaction?.id ||
    payload?.data?.id ||
    null;
  return value ? String(value) : null;
}

function splitName(fullName?: string): { firstname: string; lastname: string } {
  const safe = (fullName || "Client Binq").trim();
  const parts = safe.split(/\s+/);
  if (parts.length <= 1) return { firstname: parts[0] || "Client", lastname: "Binq" };
  return {
    firstname: parts.slice(0, -1).join(" "),
    lastname: parts.slice(-1).join(" "),
  };
}

export async function createFedaPayPayment(
  params: FedaPayInitParams
): Promise<{ payment_url: string; provider_transaction_id: string }> {
  const { firstname, lastname } = splitName(params.customer_name);

  const initBody = {
    description: params.description,
    amount: Math.max(1, Math.round(params.amount)),
    callback_url: params.return_url,
    currency: { iso: (params.currency || "XOF").toUpperCase() },
    metadata: {
      transaction_id: params.transaction_id,
      notify_url: params.notify_url,
      source: "binq_ticketing",
    },
    custom_metadata: {
      transaction_id: params.transaction_id,
      notify_url: params.notify_url,
      source: "binq_ticketing",
    },
    customer: {
      firstname,
      lastname,
      email: params.customer_email || undefined,
      ...(params.customer_phone_number
        ? {
            phone_number: {
              number: params.customer_phone_number.replace(/^\+?229/, "").replace(/\D/g, ""),
              country: "BJ",
            },
          }
        : {}),
    },
  };

  const initRes = await fetch(`${FEDAPAY_BASE_URL}/transactions`, {
    method: "POST",
    headers: getBearerHeaders(),
    body: JSON.stringify(initBody),
  });

  const initJson = await initRes.json().catch(() => ({}));
  if (!initRes.ok) {
    const message =
      initJson?.message ||
      initJson?.error ||
      Object.values(initJson?.errors || {}).flat().join(", ") ||
      "Erreur initialisation FedaPay";
    console.error("FedaPay init error body:", JSON.stringify(initJson));
    throw new Error(message);
  }

  const providerTransactionId = extractAnyTransactionId(initJson);
  if (!providerTransactionId) {
    console.error("FedaPay init response (no ID):", JSON.stringify(initJson));
    throw new Error("Transaction FedaPay introuvable");
  }

  const tokenRes = await fetch(
    `${FEDAPAY_BASE_URL}/transactions/${providerTransactionId}/token`,
    {
      method: "POST",
      headers: getBearerHeaders(),
      body: JSON.stringify({}),
    }
  );

  const tokenJson = await tokenRes.json().catch(() => ({}));
  const paymentUrl = extractAnyUrl(tokenJson) || extractAnyUrl(initJson);

  if (!tokenRes.ok || !paymentUrl) {
    const message =
      tokenJson?.message ||
      tokenJson?.error ||
      Object.values(tokenJson?.errors || {}).flat().join(", ") ||
      "Erreur génération lien FedaPay";
    console.error("FedaPay token error body:", JSON.stringify(tokenJson));
    throw new Error(message);
  }

  return {
    payment_url: paymentUrl,
    provider_transaction_id: providerTransactionId,
  };
}

export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(6).toString("hex");
  return `BQ${timestamp}${random}`;
}

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
