import { NextRequest, NextResponse } from "next/server";

/**
 * Bank payment return/cancel URL handler (redirect only).
 * Webhook is the source of truth for payment state; this only redirects the user.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const status = request.nextUrl.searchParams.get("status")?.toLowerCase();

  const base = request.nextUrl.origin;
  const confirmationUrl = `${base}/bookings/${bookingId}/confirmation`;
  const paymentUrl = `${base}/bookings/${bookingId}/payment`;

  if (status === "success") {
    return NextResponse.redirect(confirmationUrl);
  }

  const cancelUrl = new URL(paymentUrl);
  cancelUrl.searchParams.set("cancelled", "1");
  return NextResponse.redirect(cancelUrl);
}
