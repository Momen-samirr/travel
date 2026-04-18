import crypto from "crypto";

const PAYIN_BASE_URL = (process.env.PAYIN_BASE_URL || "https://pay.getpayin.com").replace(
  /\/+$/,
  ""
);
const PAYIN_PUBLIC_TOKEN = process.env.PAYIN_PUBLIC_TOKEN || "";
const PAYIN_HASH_TOKEN = process.env.PAYIN_HASH_TOKEN || "";

export class PayinValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayinValidationError";
  }
}

export interface PayinCustomer {
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface CreatePayinCheckoutParams {
  orderTitle: string;
  orderAmount: number;
  currency: string;
    redirectUrl: string; // ✅ ADD THIS
  customer: PayinCustomer;
}

export interface PayinCheckoutResult {
  checkoutUrl: string;
  invoiceId: string;
  expiresAt: string | null;
}

interface PayinInitResponse {
  success: boolean;
  message?: string;
  data?: {
    checkout_url?: string;
    invoice_id?: number | string;
    expires_at?: string;
  };
}

function normalizeUsdCurrency(currency?: string | null): string {
  const normalized = (currency || "").trim().toUpperCase();
  if (normalized !== "USD") {
    throw new PayinValidationError(
      `PayIn supports USD only in this integration. Received "${currency ?? ""}".`
    );
  }
  return normalized;
}

function requirePayinConfig() {
  if (!PAYIN_PUBLIC_TOKEN) {
    throw new Error("PAYIN_PUBLIC_TOKEN is not configured");
  }
  if (!PAYIN_HASH_TOKEN) {
    throw new Error("PAYIN_HASH_TOKEN is not configured");
  }
}

function buildInitSignature(values: {
  firstName: string;
  lastName: string;
  email: string;
  orderTitle: string;
  orderAmount: string;
  address: string;
  city: string;
  country: string;
  currency: string;
}): string {
  const concatenated = [
    values.firstName,
    values.lastName,
    values.email,
    values.orderTitle,
    values.orderAmount,
    values.address,
    values.city,
    values.country,
    values.currency,
  ].join("");

  return crypto.createHmac("sha256", PAYIN_HASH_TOKEN).update(concatenated).digest("base64");
}

export async function createPayinCheckout(

  params: CreatePayinCheckoutParams
  
): Promise<PayinCheckoutResult> {
      const redirectUrl = params.redirectUrl;

  requirePayinConfig();

  const currency = normalizeUsdCurrency(params.currency);
  const orderAmount = Number(params.orderAmount);
  if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
    throw new PayinValidationError("Invalid order amount for PayIn");
  }

  const firstName = params.customer.firstName.trim();
  const lastName = params.customer.lastName.trim();
  const email = params.customer.email.trim();
  const orderTitle = params.orderTitle.trim();
  const address = (params.customer.address || "").trim();
  const city = (params.customer.city || "").trim();
  const country = (params.customer.country || "").trim();

  if (!firstName || !lastName || !email || !orderTitle) {
    throw new PayinValidationError("Missing required customer/order fields for PayIn");
  }

  const signature = buildInitSignature({
    firstName,
    lastName,
    email,
    orderTitle,
    orderAmount: orderAmount.toFixed(2),
    address,
    city,
    country,
    currency,
  });

  const form = new FormData();
  form.append("token", PAYIN_PUBLIC_TOKEN);
  form.append("first_name", firstName);
  form.append("last_name", lastName);
  form.append("email", email);
  form.append("order_title", orderTitle);
  form.append("merchant_reference_id", orderTitle); // ✅ ADD THIS

  form.append("order_amount", orderAmount.toFixed(2));
  form.append("address", address);
  form.append("city", city);
  form.append("country", country);
  form.append("currency", currency);
  form.append("redirect_url", redirectUrl); // ✅ ADD THIS

  form.append("signature", signature);

  const response = await fetch(`${PAYIN_BASE_URL}/api/integration/init`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: form,
  });

  const rawText = await response.text();
  let payload: PayinInitResponse | null = null;
  try {
    payload = JSON.parse(rawText) as PayinInitResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    const reason = payload?.message || rawText || response.statusText;
    throw new Error(`PayIn init failed: ${reason}`);
  }

  const checkoutUrl = payload.data?.checkout_url || "";
const invoiceId = String(payload.data?.invoice_id ?? "").trim();
console.log("💳 PAYIN raw invoice_id:", payload.data?.invoice_id);
  if (!checkoutUrl || !invoiceId) {
    throw new Error("PayIn init response is missing checkout_url or invoice_id");
  }

  return {
    checkoutUrl,
    invoiceId,
    expiresAt: payload.data?.expires_at || null,
  };
}

export interface PayinWebhookPayload {
  success: boolean;
  invoice_id: number | string;
  invoice_status: string;
  message?: string;
  signature: string;
}

function buildWebhookSignatureString(payload: Omit<PayinWebhookPayload, "signature">): string {
  return `${payload.invoice_id}${payload.invoice_status}${payload.message || ""}`;
}

export function verifyPayinWebhook(payload: PayinWebhookPayload): boolean {
  if (!PAYIN_HASH_TOKEN || !payload.signature) {
    return false;
  }

  const signatureBase = buildWebhookSignatureString({
    success: payload.success,
    invoice_id: payload.invoice_id,
    invoice_status: payload.invoice_status,
    message: payload.message || "",
  });

  const expectedHex = crypto.createHmac("sha256", PAYIN_HASH_TOKEN).update(signatureBase).digest("hex");
  const expectedBase64 = crypto
    .createHmac("sha256", PAYIN_HASH_TOKEN)
    .update(signatureBase)
    .digest("base64");
  const provided = payload.signature.trim();

  return provided === expectedHex || provided === expectedBase64;
}
