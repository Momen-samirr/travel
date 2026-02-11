import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import {
  getPaymobAuthToken,
  createPaymobOrder,
  getPaymentKey,
} from "@/lib/paymob";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { bookingId } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
      },
    });

    if (!booking || booking.userId !== user.id) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Booking already paid" },
        { status: 400 }
      );
    }

    // Get auth token
    const authToken = await getPaymobAuthToken();

    // Create order
    const orderId = await createPaymobOrder(
      authToken,
      Number(booking.totalAmount),
      booking.currency
    );

    // Get payment key
    const guestDetails = booking.guestDetails as any;
    const amountCents = Math.round(Number(booking.totalAmount) * 100);
    const paymentKey = await getPaymentKey(
      authToken,
      orderId,
      amountCents,
      booking.currency,
      {
        first_name: guestDetails.firstName || user.name?.split(" ")[0] || "",
        last_name: guestDetails.lastName || user.name?.split(" ").slice(1).join(" ") || "",
        email: guestDetails.email || user.email || "",
        phone_number: guestDetails.phone || user.phone || "",
      }
    );

    // Update booking with order ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentTransactionId: orderId.toString(),
      },
    });

    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

    return NextResponse.json({ paymentUrl, orderId });
  } catch (error: any) {
    console.error("Error creating Paymob payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}

