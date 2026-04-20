import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, status, success } = await req.json();

    if (!invoiceId) {
      return NextResponse.json({ error: "NO_INVOICE_ID" });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        paymentTransactionId: invoiceId,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "BOOKING_NOT_FOUND" });
    }

    const isSuccess =
      status === "PAID" || success === "1";

    if (isSuccess) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      });

      return NextResponse.json({
        success: true,
        bookingId: booking.id,
      });
    }

    return NextResponse.json({ error: "PAYMENT_FAILED" });
  } catch (err: any) {
    return NextResponse.json({
      error: "CRASH",
      message: err.message,
    });
  }
}