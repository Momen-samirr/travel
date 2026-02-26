import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { getBankAccountDetails } from "@/lib/bank-payment";

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

    const amount = Number(booking.totalAmount);
    const currency = booking.currency || "EGP";

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentMethod: "BANK",
        paymentStatus: "PENDING",
        paymentTransactionId: `${bookingId}-bank`,
      },
    });

    const bankDetails = getBankAccountDetails(amount, currency, bookingId);

    return NextResponse.json({
      success: true,
      message: "Please transfer the amount to the account below. Your booking will be confirmed after we receive and verify the payment.",
      bankDetails: {
        accountName: bankDetails.accountName,
        iban: bankDetails.iban,
        bankName: bankDetails.bankName,
        referenceFormat: bankDetails.referenceFormat,
        amount: bankDetails.amount,
        currency: bankDetails.currency,
        bookingReference: bankDetails.bookingReference,
      },
    });
  } catch (error: unknown) {
    console.error("Error initiating bank transfer:", error);
    const message = error instanceof Error ? error.message : "Failed to initiate bank transfer";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
