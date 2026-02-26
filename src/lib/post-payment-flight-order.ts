import { prisma } from "@/lib/prisma";

const MAX_AMADEUS_RETRY_COUNT = 5;

export type IdempotencyOutcome = "processed" | "duplicate";

/**
 * Record webhook event for idempotency. Returns "processed" if this is the first time
 * we see this eventId for the source; "duplicate" if already processed.
 */
export async function ensureWebhookIdempotency(
  source: "PAYMOB" | "BANK",
  eventId: string,
  bookingId?: string
): Promise<IdempotencyOutcome> {
  try {
    await prisma.webhookIdempotency.create({
      data: {
        source,
        eventId,
        bookingId: bookingId ?? null,
      },
    });
    return "processed";
  } catch (e: any) {
    if (e?.code === "P2002") {
      return "duplicate";
    }
    throw e;
  }
}

export interface CreateAmadeusOrderResult {
  success: boolean;
  amadeusOrderId?: string | null;
  pnr?: string | null;
  error?: string;
}

/**
 * For a PAID FLIGHT booking: no-op. Flight search and booking use AOS redirect;
 * no Amadeus API is called. Kept for webhook compatibility (returns success).
 */
export async function createAmadeusOrderForBooking(booking: {
  id: string;
  bookingType: string;
  flightOfferData: any;
  guestDetails: any;
  amadeusOrderId?: string | null;
  amadeusStatus?: string | null;
  amadeusRetryCount?: number;
}): Promise<CreateAmadeusOrderResult> {
  if (booking.bookingType !== "FLIGHT") {
    return { success: true };
  }
  // AOS redirect: no Amadeus API; no order creation on our side
  return { success: true };
}

/** Check if a booking is eligible for Amadeus retry (kept for compatibility; no API retry with AOS). */
export function isEligibleForAmadeusRetry(booking: {
  paymentStatus: string;
  bookingType: string;
  amadeusOrderId?: string | null;
  amadeusStatus?: string | null;
  amadeusRetryCount?: number;
}): boolean {
  if (booking.paymentStatus !== "PAID" || booking.bookingType !== "FLIGHT") return false;
  if (booking.amadeusOrderId) return false;
  const count = booking.amadeusRetryCount ?? 0;
  return count < MAX_AMADEUS_RETRY_COUNT;
}
