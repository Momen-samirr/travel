import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { createPayinCheckout, PayinValidationError } from "@/lib/payin";
import { ensureProviderSupportsCurrency } from "@/lib/payment-policy";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking || booking.userId !== user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Booking already paid" }, { status: 400 });
    }

    const currency = (booking.currency || "").trim().toUpperCase();
    try {
      ensureProviderSupportsCurrency("PAYIN", currency);
    } catch {
      return NextResponse.json(
        { error: `PayIn is enabled for USD only. Booking currency is "${booking.currency}".` },
        { status: 400 }
      );
    }

    const amount = Number(booking.totalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid booking amount for payment" }, { status: 400 });
    }

    const guestDetails = (booking.guestDetails || {}) as Record<string, unknown>;
    const redirectUrl = `https://www.tishourytours.com/bookings/confirmation`;
    const { checkoutUrl, invoiceId } = await createPayinCheckout({
      orderTitle: `Booking ${booking.id}`,
      orderAmount: amount,
      currency,
        redirectUrl, // ✅ ADD THIS

      customer: {
        firstName: (guestDetails.firstName as string) || user.name?.split(" ")[0] || "Guest",
        lastName: (guestDetails.lastName as string) || user.name?.split(" ").slice(1).join(" ") || "Customer",
        email: (guestDetails.email as string) || user.email || "",
        address: (guestDetails.address as string) || "",
        city: (guestDetails.city as string) || "",
        country: (guestDetails.country as string) || "",
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentTransactionId: invoiceId,
        paymentMethod: "PAYIN",
      },
    });

    return NextResponse.json({ paymentUrl: checkoutUrl });
  } catch (error: unknown) {
    console.error("Error creating PayIn payment:", error);
    if (error instanceof PayinValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create payment";
    const status = message.startsWith("PayIn init failed:") ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
