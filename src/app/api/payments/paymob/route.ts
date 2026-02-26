import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { createPaymobIframeSession } from "@/lib/paymob";

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

    const guestDetails = booking.guestDetails as Record<string, unknown>;

    const { iframeUrl, orderId } = await createPaymobIframeSession({
      amountCents: Math.round(Number(booking.totalAmount) * 100),
      currency: booking.currency || "EGP",
      merchantReference: bookingId,
      customer: {
        first_name: (guestDetails?.firstName as string) || user.name?.split(" ")[0] || "",
        last_name: (guestDetails?.lastName as string) || user.name?.split(" ").slice(1).join(" ") || "",
        email: (guestDetails?.email as string) || user.email || "",
        phone_number: (guestDetails?.phone as string) || user.phone || "",
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentTransactionId: orderId,
        paymentMethod: "PAYMOB",
      },
    });

    return NextResponse.json({ paymentUrl: iframeUrl });
  } catch (error: unknown) {
    console.error("Error creating Paymob payment:", error);
    const message = error instanceof Error ? error.message : "Failed to create payment";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
