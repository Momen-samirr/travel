import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { createPaymobIframeSession, PaymobValidationError } from "@/lib/paymob";
import { createPayinCheckout, PayinValidationError } from "@/lib/payin";
import { ensureProviderSupportsCurrency, resolveOnlineProvider } from "@/lib/payment-policy";

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

    const amount = Number(booking.totalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid booking amount for payment" }, { status: 400 });
    }

    const currency = (booking.currency || "EGP").trim().toUpperCase();
    const provider = resolveOnlineProvider(currency);
    const guestDetails = (booking.guestDetails || {}) as Record<string, unknown>;
    const firstName = (guestDetails.firstName as string) || user.name?.split(" ")[0] || "Guest";
    const lastName =
      (guestDetails.lastName as string) || user.name?.split(" ").slice(1).join(" ") || "Customer";
    const email = (guestDetails.email as string) || user.email || "";
    const phoneNumber = (guestDetails.phone as string) || user.phone || "";

    if (provider === "PAYIN") {
      ensureProviderSupportsCurrency("PAYIN", currency);
      const { checkoutUrl, invoiceId } = await createPayinCheckout({
        orderTitle: `Booking ${booking.id}`,
        orderAmount: amount,
        currency,
        customer: {
          firstName,
          lastName,
          email,
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

      return NextResponse.json({ paymentUrl: checkoutUrl, provider: "PAYIN" });
    }

    ensureProviderSupportsCurrency("PAYMOB", currency);
    const amountCents = Math.round(amount * 100);
    const { iframeUrl, orderId } = await createPaymobIframeSession({
      amountCents,
      currency,
      merchantReference: booking.id,
      customer: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber,
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentTransactionId: orderId,
        paymentMethod: "PAYMOB",
      },
    });

    return NextResponse.json({ paymentUrl: iframeUrl, provider: "PAYMOB" });
  } catch (error: unknown) {
    console.error("Error creating online payment:", error);
    if (error instanceof PaymobValidationError || error instanceof PayinValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create payment";
    const status = message.startsWith("Paymob:") || message.startsWith("PayIn init failed:") ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
