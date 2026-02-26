import crypto from "crypto";

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY!;
/** Classic Paymob iframe integration ID from the Paymob dashboard (used for payment_keys). */
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID!;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET!;
/** Classic Paymob iframe ID from the Paymob dashboard, used to build the iframe URL. */
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID!;

const PAYMOB_BASE_URL = "https://accept.paymob.com";

export interface PaymobCustomer {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

export interface CreatePaymobIframeSessionParams {
  amountCents: number;
  currency: string;
  merchantReference: string; // bookingId
  customer: PaymobCustomer;
}

export interface PaymobIframeSessionResult {
  iframeUrl: string;
  /** Store in booking.paymentTransactionId for webhook correlation (Paymob sends as order.id). */
  orderId: string;
}

/**
 * Creates a Paymob classic iframe payment session: gets auth token, registers order,
 * then requests a payment key tied to the classic/iframe integration and builds
 * the iframe URL. All secrets stay on the backend.
 */
export async function createPaymobIframeSession(
  params: CreatePaymobIframeSessionParams
): Promise<PaymobIframeSessionResult> {
  if (!PAYMOB_API_KEY) {
    throw new Error("PAYMOB_API_KEY is not configured");
  }
  if (!PAYMOB_INTEGRATION_ID) {
    throw new Error("PAYMOB_INTEGRATION_ID is not configured (classic Paymob iframe integration)");
  }
  if (!PAYMOB_IFRAME_ID) {
    throw new Error("PAYMOB_IFRAME_ID is not configured");
  }

  const { amountCents, currency, merchantReference, customer } = params;

  let phoneNumber = customer.phone_number?.replace(/\s+/g, "") || "";
  if (phoneNumber.startsWith("+20")) {
    phoneNumber = "0" + phoneNumber.substring(3);
  } else if (phoneNumber.startsWith("20")) {
    phoneNumber = "0" + phoneNumber.substring(2);
  } else if (!phoneNumber.startsWith("0") && phoneNumber.length > 0) {
    phoneNumber = "0" + phoneNumber;
  }
  if (!phoneNumber || phoneNumber.length < 10) {
    phoneNumber = "01000000000";
  }

  const billingData = {
    first_name: customer.first_name.trim(),
    last_name: customer.last_name.trim(),
    email: customer.email.trim(),
    phone_number: phoneNumber,
    country: "EG",
    city: "Cairo",
    street: "N/A",
    building: "N/A",
    floor: "N/A",
    apartment: "N/A",
  };

  // 1. Auth token
  const authRes = await fetch(`${PAYMOB_BASE_URL}/api/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
  });
  if (!authRes.ok) {
    const errText = await authRes.text();
    throw new Error(`Paymob auth failed: ${errText || authRes.statusText}`);
  }
  const { token: authToken } = (await authRes.json()) as { token: string };

  // 2. Register order (for webhook we need order.id)
  const orderRes = await fetch(`${PAYMOB_BASE_URL}/api/ecommerce/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: "false",
      amount_cents: amountCents,
      currency: currency || "EGP",
      merchant_order_id: merchantReference,
      items: [],
    }),
  });
  if (!orderRes.ok) {
    const errText = await orderRes.text();
    throw new Error(`Paymob order failed: ${errText || orderRes.statusText}`);
  }
  const { id: orderId } = (await orderRes.json()) as { id: number };

  // 3. Payment key (classic/iframe integration)
  const keyRes = await fetch(`${PAYMOB_BASE_URL}/api/acceptance/payment_keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: billingData,
      currency: currency || "EGP",
      integration_id: parseInt(PAYMOB_INTEGRATION_ID, 10),
    }),
  });
  if (!keyRes.ok) {
    const errText = await keyRes.text();

    // Log as much detail as possible from Paymob for easier debugging
    console.error("[Paymob] payment_keys failed", {
      status: keyRes.status,
      statusText: keyRes.statusText,
      rawBody: errText,
    });

    let msg = "Paymob payment key failed";

    try {
      const errJson = JSON.parse(errText);
      console.error("[Paymob] payment_keys error JSON", errJson);
      msg =
        errJson.message ||
        errJson.detail ||
        errJson.error_description ||
        msg;
    } catch {
      if (errText) {
        msg = errText;
      }
    }

    throw new Error(`Paymob: ${msg}`);
  }
  const { token: paymentToken } = (await keyRes.json()) as { token: string };

  // 4. Classic iframe URL
  const iframeUrl = `${PAYMOB_BASE_URL}/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${encodeURIComponent(
    paymentToken
  )}`;

  return {
    iframeUrl,
    orderId: orderId.toString(),
  };
}

/**
 * Verifies Paymob webhook HMAC using PAYMOB_HMAC_SECRET.
 */
export function verifyPaymobWebhook(obj: Record<string, unknown>, hmac: string): boolean {
  if (!PAYMOB_HMAC_SECRET) {
    return false;
  }
  const orderedItems = Object.keys(obj)
    .sort()
    .map((key) => `${key}=${obj[key]}`)
    .join("&");
  const hash = crypto
    .createHmac("sha512", PAYMOB_HMAC_SECRET)
    .update(orderedItems)
    .digest("hex");
  return hash === hmac;
}
