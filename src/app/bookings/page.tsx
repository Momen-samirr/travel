import { getCurrentUser } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: {
      tour: {
        select: {
          title: true,
          slug: true,
        },
      },
      flight: {
        select: {
          flightNumber: true,
          origin: true,
          destination: true,
        },
      },
      hotel: {
        select: {
          name: true,
          slug: true,
        },
      },
      visa: {
        select: {
          country: true,
          type: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const getBookingTitle = (booking: any) => {
    if (booking.tour) return booking.tour.title;
    if (booking.flight)
      return `${booking.flight.origin} → ${booking.flight.destination}`;
    if (booking.hotel) return booking.hotel.name;
    if (booking.visa)
      return `${booking.visa.country} - ${booking.visa.type} Visa`;
    return "Booking";
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">You have no bookings yet.</p>
            <Button asChild>
              <Link href="/tours">Browse Tours</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{getBookingTitle(booking)}</CardTitle>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        booking.status === "CONFIRMED"
                          ? "default"
                          : booking.status === "CANCELLED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {booking.status}
                    </Badge>
                    <Badge
                      variant={
                        booking.paymentStatus === "PAID"
                          ? "default"
                          : booking.paymentStatus === "FAILED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">
                      Booking Date: {formatDate(booking.bookingDate)}
                    </div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(Number(booking.totalAmount), booking.currency)}
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/bookings/${booking.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

