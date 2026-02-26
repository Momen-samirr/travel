/**
 * Bank transfer (inbound / manual) integration.
 * Uses BANK_PROFILE_ID, BANK_ACCESS_KEY, BANK_SECRET_KEY only on the backend.
 * No Paymob keys or logic. No redirect checkout — display account details and rely on admin confirmation.
 */

import crypto from "crypto";

const BANK_SECRET_KEY = process.env.BANK_SECRET_KEY!;

export interface BankAccountDetails {
  accountName: string;
  iban: string;
  bankName: string;
  referenceFormat: string;
  amount: number;
  currency: string;
  bookingReference: string;
}

/**
 * Returns displayable bank account details from env (backend-only).
 * Used when user chooses bank transfer: show details, booking stays PENDING until admin confirms.
 */
export function getBankAccountDetails(
  amount: number,
  currency: string,
  bookingReference: string
): BankAccountDetails {
  return {
    accountName: process.env.BANK_ACCOUNT_NAME || "Company Account",
    iban: process.env.BANK_IBAN || "—",
    bankName: process.env.BANK_NAME || "—",
    referenceFormat: process.env.BANK_REFERENCE_FORMAT || `Booking ${bookingReference}`,
    amount,
    currency,
    bookingReference,
  };
}

/**
 * Verifies bank webhook signature using BANK_SECRET_KEY.
 * Use only when a real bank API sends verified callbacks.
 */
export function verifyBankWebhookSignature(payload: string, signature: string): boolean {
  if (!BANK_SECRET_KEY) {
    return false;
  }
  const expectedSignature = crypto
    .createHmac("sha256", BANK_SECRET_KEY)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch {
    return false;
  }
}
