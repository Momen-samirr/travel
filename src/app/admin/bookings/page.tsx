import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { BookingsList } from "@/components/admin/bookings-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    paymentStatus?: string;
    bookingType?: string;
    userId?: string;
  }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.paymentStatus) {
    where.paymentStatus = params.paymentStatus;
  }

  if (params.bookingType) {
    where.bookingType = params.bookingType;
  }

  if (params.userId) {
    where.userId = params.userId;
  }

  const [bookingsData, total] = await Promise.all([
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

  const bookings = bookingsData.map((booking) => ({
    ...booking,
    totalAmount: booking.totalAmount ? Number(booking.totalAmount) : 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Booking Management</h1>
      </div>
      <BookingsList
        initialBookings={bookings}
        total={total}
        page={page}
        limit={limit}
        status={params.status}
        paymentStatus={params.paymentStatus}
        bookingType={params.bookingType}
      />
    </div>
  );
}

