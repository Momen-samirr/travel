import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookingStatusUpdate } from "@/components/admin/booking-status-update";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
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
  });

  if (!booking) {
    notFound();
  }

  const getBookingTitle = () => {
    if (booking.tour) return booking.tour.title;
    if (booking.flight)
      return `${booking.flight.origin} → ${booking.flight.destination}`;
    if (booking.hotel) return booking.hotel.name;
    if (booking.visa) return `${booking.visa.country} - ${booking.visa.type}`;
    return "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/bookings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Booking Details</h1>
            <p className="text-muted-foreground">ID: {booking.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <div className="font-medium">{booking.bookingType}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Item</div>
              <div className="font-medium">{getBookingTitle()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge variant="outline">{booking.status}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Payment Status</div>
              <Badge
                variant={booking.paymentStatus === "PAID" ? "default" : "secondary"}
              >
                {booking.paymentStatus}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="font-medium text-lg">
                {formatCurrency(Number(booking.totalAmount), booking.currency)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Booking Date</div>
              <div className="font-medium">{formatDate(booking.bookingDate)}</div>
            </div>
            {booking.travelDate && (
              <div>
                <div className="text-sm text-muted-foreground">Travel Date</div>
                <div className="font-medium">{formatDate(booking.travelDate)}</div>
              </div>
            )}
            {booking.paymentMethod && (
              <div>
                <div className="text-sm text-muted-foreground">Payment Method</div>
                <div className="font-medium">{booking.paymentMethod}</div>
              </div>
            )}
            {booking.paymentTransactionId && (
              <div>
                <div className="text-sm text-muted-foreground">Transaction ID</div>
                <div className="font-mono text-sm">{booking.paymentTransactionId}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-medium">
                {booking.user.name || "Not provided"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{booking.user.email}</div>
            </div>
            {booking.user.phone && (
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium">{booking.user.phone}</div>
              </div>
            )}
            <div className="pt-4">
              <Button variant="outline" asChild>
                <Link href={`/admin/users/${booking.user.id}`}>
                  View Customer Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {booking.guestDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Guest Details</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(booking.guestDetails, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <BookingStatusUpdate booking={booking} />
    </div>
  );
}

