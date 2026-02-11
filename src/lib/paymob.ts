import crypto from "crypto";

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY!;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID!;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET!;

interface PaymobAuthResponse {
  token: string;
}

interface PaymobOrderResponse {
  id: number;
}

export async function getPaymobAuthToken(): Promise<string> {
  if (!PAYMOB_API_KEY) {
    throw new Error("PAYMOB_API_KEY is not configured");
  }

  const response = await fetch("https://accept.paymob.com/api/auth/tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: PAYMOB_API_KEY,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Failed to authenticate with Paymob";
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorData.detail || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    console.error("Paymob auth error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
    });
    
    throw new Error(`Failed to authenticate with Paymob: ${errorMessage}`);
  }

  const data: PaymobAuthResponse = await response.json();
  return data.token;
}

export async function createPaymobOrder(
  authToken: string,
  amount: number,
  currency: string = "EGP"
): Promise<number> {
  const amountCents = Math.round(amount * 100);
  
  const requestBody = {
    auth_token: authToken,
    delivery_needed: "false",
    amount_cents: amountCents,
    currency: currency || "EGP",
    items: [],
  };

  const response = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Failed to create Paymob order";
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorData.detail || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    console.error("Paymob order creation error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
      requestBody,
    });
    
    throw new Error(`Failed to create Paymob order: ${errorMessage}`);
  }

  const data: PaymobOrderResponse = await response.json();
  return data.id;
}

export async function getPaymentKey(
  authToken: string,
  orderId: number,
  amountCents: number,
  currency: string,
  billingData: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  }
): Promise<string> {
  // Validate required fields
  if (!billingData.first_name || !billingData.last_name || !billingData.email) {
    throw new Error("Billing data is incomplete: first_name, last_name, and email are required");
  }

  // Format phone number - Paymob expects Egyptian format (01XXXXXXXXX)
  let phoneNumber = billingData.phone_number?.replace(/\s+/g, "") || "";
  // Remove +20 prefix if present and ensure it starts with 0
  if (phoneNumber.startsWith("+20")) {
    phoneNumber = "0" + phoneNumber.substring(3);
  } else if (phoneNumber.startsWith("20")) {
    phoneNumber = "0" + phoneNumber.substring(2);
  } else if (!phoneNumber.startsWith("0") && phoneNumber.length > 0) {
    phoneNumber = "0" + phoneNumber;
  }
  
  // Ensure phone number is not empty (Paymob requires it)
  if (!phoneNumber || phoneNumber.length < 10) {
    phoneNumber = "01000000000"; // Default fallback
  }

  // Paymob billing_data - all fields are required by Paymob API
  const billingDataPayload = {
    first_name: billingData.first_name.trim(),
    last_name: billingData.last_name.trim(),
    email: billingData.email.trim(),
    phone_number: phoneNumber,
    country: "EG", // Required by Paymob
    city: "Cairo", // Required by Paymob
    street: "N/A", // Required by Paymob (can be placeholder if not available)
    building: "N/A", // Required by Paymob (can be placeholder if not available)
    floor: "N/A", // Required by Paymob (can be placeholder if not available)
    apartment: "N/A", // Required by Paymob (can be placeholder if not available)
  };

  const requestBody = {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: orderId,
    billing_data: billingDataPayload,
    currency: currency || "EGP",
    integration_id: parseInt(PAYMOB_INTEGRATION_ID),
  };

  const response = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorMessage = "Failed to get payment key";
    let errorDetails: any = null;
    
    try {
      const contentType = response.headers.get("content-type");
      const errorText = await response.text();
      
      // Try to parse as JSON if content-type suggests it
      if (contentType?.includes("application/json") || errorText.trim().startsWith("{")) {
        try {
          errorDetails = JSON.parse(errorText);
          console.log("Paymob error response (parsed):", errorDetails);
          
          // Paymob error responses can have different structures
          if (typeof errorDetails === 'string') {
            errorMessage = errorDetails;
          } else if (errorDetails.message) {
            errorMessage = errorDetails.message;
          } else if (errorDetails.detail) {
            errorMessage = errorDetails.detail;
          } else if (errorDetails.error) {
            errorMessage = typeof errorDetails.error === 'string' 
              ? errorDetails.error 
              : JSON.stringify(errorDetails.error);
          } else if (errorDetails.error_description) {
            errorMessage = errorDetails.error_description;
          }
          
          // If it's an object with nested error info
          if (errorDetails.errors) {
            if (Array.isArray(errorDetails.errors)) {
              errorMessage = errorDetails.errors.map((e: any) => 
                typeof e === 'string' ? e : (e.message || JSON.stringify(e))
              ).join(", ");
            } else if (typeof errorDetails.errors === 'object') {
              errorMessage = Object.entries(errorDetails.errors)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ");
            }
          }
          
          // If errorMessage is still default, try to stringify the whole object
          if (errorMessage === "Failed to get payment key" && errorDetails) {
            errorMessage = JSON.stringify(errorDetails);
          }
        } catch (parseError) {
          // If JSON parsing fails, use the raw text
          errorMessage = errorText || errorMessage;
          errorDetails = errorText;
          console.log("Failed to parse error as JSON, using raw text:", errorText);
        }
      } else {
        // Not JSON, use the text directly
        errorMessage = errorText || response.statusText || errorMessage;
        errorDetails = errorText;
        console.log("Paymob error response (text):", errorText);
      }
    } catch (e) {
      // If we can't read the response, use status text
      errorMessage = response.statusText || errorMessage;
      console.error("Failed to read error response:", e);
    }
    
    console.error("Paymob payment key error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
      errorDetails,
      requestBody: {
        ...requestBody,
        auth_token: requestBody.auth_token ? "[REDACTED]" : undefined,
      },
    });
    
    throw new Error(`Paymob API Error (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();
  return data.token;
}

export function verifyPaymobWebhook(
  obj: Record<string, any>,
  hmac: string
): boolean {
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

