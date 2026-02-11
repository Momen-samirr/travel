import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { createBankPayment } from "@/lib/bank-payment";

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

    const guestDetails = booking.guestDetails as any;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const payment = await createBankPayment({
      amount: Number(booking.totalAmount),
      currency: booking.currency,
      orderId: booking.id,
      customerInfo: {
        name: `${guestDetails.firstName || ""} ${guestDetails.lastName || ""}`.trim(),
        email: guestDetails.email || user.email,
        phone: guestDetails.phone || "",
      },
      returnUrl: `${baseUrl}/bookings/${booking.id}/payment/callback?status=success`,
      cancelUrl: `${baseUrl}/bookings/${booking.id}/payment/callback?status=cancel`,
    });

    // Update booking with transaction ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentTransactionId: payment.transactionId,
        paymentMethod: "BANK",
      },
    });

    return NextResponse.json({ paymentUrl: payment.paymentUrl });
  } catch (error: any) {
    console.error("Error creating bank payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}

