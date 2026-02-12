import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { logActivity, ActivityActions } from "@/lib/activity-log";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const bookingType = searchParams.get("bookingType");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (bookingType) {
      where.bookingType = bookingType;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.bookingDate = {};
      if (startDate) {
        where.bookingDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.bookingDate.lte = new Date(endDate);
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          tour: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          flight: {
            select: {
              id: true,
              flightNumber: true,
              origin: true,
              destination: true,
            },
          },
          hotel: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          visa: {
            select: {
              id: true,
              country: true,
              type: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch bookings", details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { bookingId, status, paymentStatus } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const currentBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!currentBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    const changes: string[] = [];
    if (status && status !== currentBooking.status) {
      changes.push(`status: ${currentBooking.status} → ${status}`);
      await logActivity({
        userId: admin.id,
        action: ActivityActions.BOOKING_UPDATED,
        entityType: "Booking",
        entityId: bookingId,
        details: { oldStatus: currentBooking.status, newStatus: status },
      });
    }

    if (paymentStatus && paymentStatus !== currentBooking.paymentStatus) {
      changes.push(`paymentStatus: ${currentBooking.paymentStatus} → ${paymentStatus}`);
    }

    return NextResponse.json(booking);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update booking", details: err.message },
      { status: 500 }
    );
  }
}

