import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/clerk";
import { notFound, redirect } from "next/navigation";
import { FlightConfirmation } from "@/components/flights/booking/flight-confirmation";
import { DownloadButtons } from "@/components/flights/booking/download-buttons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking || booking.userId !== user.id) {
    notFound();
  }

  // Only show confirmation if payment is completed
  if (booking.paymentStatus !== "PAID" && booking.status !== "CONFIRMED") {
    redirect(`/bookings/${id}`);
  }

  const isFlightBooking = booking.bookingType === "FLIGHT" && booking.flightOfferData;
  
  if (!isFlightBooking) {
    // For non-flight bookings, show simple confirmation
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-green-800">Booking Confirmed!</h2>
              <p className="text-green-700 mt-2">
                Your booking has been confirmed. A confirmation email has been sent.
              </p>
            </CardContent>
          </Card>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/bookings">View My Bookings</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Flight booking confirmation
  const flightData = booking.flightOfferData as any;
  const outbound = flightData.outbound || flightData;
  const returnOffer = flightData.return;
  const guestDetails = booking.guestDetails as any;
  const passengers = guestDetails?.passengers || [];
  const contact = guestDetails?.contact || { email: "", phone: "" };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <FlightConfirmation
          bookingId={booking.id}
          flightOffer={outbound}
          returnOffer={returnOffer}
          passengers={passengers}
          contact={contact}
          totalAmount={Number(booking.totalAmount)}
          currency={booking.currency}
          bookingDate={booking.bookingDate}
          travelDate={booking.travelDate || undefined}
        />

        <DownloadButtons bookingId={booking.id} />

        <div className="flex gap-4 pt-4">
          <Button asChild className="flex-1">
            <Link href="/bookings">View My Bookings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/flights">Book Another Flight</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

