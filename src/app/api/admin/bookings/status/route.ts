import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const bookingIds = searchParams.get("ids");

    if (!bookingIds) {
      return NextResponse.json(
        { error: "Booking IDs are required" },
        { status: 400 }
      );
    }

    const ids = bookingIds.split(",").filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ bookings: [] });
    }

    // Fetch only status and payment status for efficiency
    const bookings = await prisma.booking.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        updatedAt: true,
      },
    });

    // Return as map for easy lookup
    const statusMap = bookings.reduce((acc, booking) => {
      acc[booking.id] = {
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        updatedAt: booking.updatedAt.toISOString(),
      };
      return acc;
    }, {} as Record<string, { status: string; paymentStatus: string; updatedAt: string }>);

    return NextResponse.json({ bookings: statusMap });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch booking statuses", details: err.message },
      { status: 500 }
    );
  }
}

