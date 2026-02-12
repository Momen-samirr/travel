import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { logActivity } from "@/lib/activity-log";
import { z } from "zod";

const updateBookingSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: true,
      tour: true,
      flight: true,
      hotel: true,
      visa: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json(booking);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const validated = updateBookingSchema.parse(body);

    const oldBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!oldBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: validated,
    });

    await logActivity({
      userId: user.id,
      action: "BOOKING_UPDATED",
      entityType: "Booking",
      entityId: id,
      details: {
        oldStatus: oldBooking.status,
        newStatus: updated.status,
        oldPaymentStatus: oldBooking.paymentStatus,
        newPaymentStatus: updated.paymentStatus,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating booking:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update booking" },
      { status: 500 }
    );
  }
}

