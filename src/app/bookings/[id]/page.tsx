import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/clerk";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function BookingDetailPage({
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
      charterPackage: {
        select: {
          name: true,
          slug: true,
        },
      },
      charterHotelOption: {
        include: {
          hotel: {
            select: {
              name: true,
              city: true,
              country: true,
            },
          },
        },
      },
      charterDepartureOption: {
        select: {
          departureAirport: true,
          arrivalAirport: true,
          departureDate: true,
          returnDate: true,
          priceModifier: true,
        },
      },
    },
  });

  if (!booking || booking.userId !== user.id) {
    notFound();
  }

  const getBookingTitle = () => {
    if (booking.charterPackage) return booking.charterPackage.name;
    if (booking.tour) return booking.tour.title;
    if (booking.flight)
      return `${booking.flight.origin} → ${booking.flight.destination}`;
    if (booking.bookingType === "FLIGHT" && booking.flightOfferData) {
      const flightData = booking.flightOfferData as any;
      const outbound = flightData.outbound || flightData;
      const itinerary = outbound?.itineraries?.[0];
      if (itinerary?.segments) {
        const origin = itinerary.segments[0]?.departure?.iataCode;
        const destination = itinerary.segments[itinerary.segments.length - 1]?.arrival?.iataCode;
        if (origin && destination) {
          return `${origin} → ${destination}`;
        }
      }
      return "Flight Booking";
    }
    if (booking.hotel) return booking.hotel.name;
    if (booking.visa)
      return `${booking.visa.country} - ${booking.visa.type} Visa`;
    return "Booking";
  };

  const guestDetails = booking.guestDetails as any;
  
  // Handle flight bookings with multiple passengers
  const isFlightBooking = booking.bookingType === "FLIGHT" && booking.flightOfferData;
  const flightPassengers = isFlightBooking && guestDetails?.passengers ? guestDetails.passengers : null;
  const flightContact = isFlightBooking && guestDetails?.contact ? guestDetails.contact : null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Booking Confirmation</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{getBookingTitle()}</CardTitle>
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
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Booking ID</div>
                <div className="font-mono">{booking.id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Booking Date</div>
                <div>{formatDate(booking.bookingDate)}</div>
              </div>
              {booking.travelDate && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Travel Date</div>
                  <div>{formatDate(booking.travelDate)}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(Number(booking.totalAmount), booking.currency)}
                </div>
              </div>
            </CardContent>
          </Card>

          {booking.bookingType === "CHARTER_PACKAGE" && (
            <Card>
              <CardHeader>
                <CardTitle>Package Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.charterHotelOption && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Selected Hotel</div>
                    <div className="font-semibold">
                      {booking.charterHotelOption.hotel.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {booking.charterHotelOption.hotel.city}, {booking.charterHotelOption.hotel.country}
                    </div>
                  </div>
                )}
                {booking.roomType && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Room Type</div>
                    <div>{booking.roomType === "SINGLE" ? "Single Room" : "Double Room"}</div>
                  </div>
                )}
                {booking.charterDepartureOption && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Departure</div>
                    <div className="font-semibold">
                      {booking.charterDepartureOption.departureAirport} → {booking.charterDepartureOption.arrivalAirport}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(booking.charterDepartureOption.departureDate)} - {formatDate(booking.charterDepartureOption.returnDate)}
                    </div>
                    {booking.charterDepartureOption.priceModifier && (
                      <div className="text-sm">
                        Price Modifier:{" "}
                        {Number(booking.charterDepartureOption.priceModifier) > 0 ? "+" : ""}
                        {formatCurrency(Number(booking.charterDepartureOption.priceModifier), booking.currency)}
                      </div>
                    )}
                  </div>
                )}
                {(booking.numberOfAdults || booking.numberOfChildren || booking.numberOfInfants) && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Travelers</div>
                    <div>
                      {booking.numberOfAdults && `${booking.numberOfAdults} Adult${booking.numberOfAdults > 1 ? "s" : ""}`}
                      {booking.numberOfChildren && ` • ${booking.numberOfChildren} Child${booking.numberOfChildren > 1 ? "ren" : ""}`}
                      {booking.numberOfInfants && ` • ${booking.numberOfInfants} Infant${booking.numberOfInfants > 1 ? "s" : ""}`}
                    </div>
                  </div>
                )}
                {booking.selectedAddonIds && Array.isArray(booking.selectedAddonIds) && booking.selectedAddonIds.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Selected Add-ons</div>
                    <div className="text-sm">
                      {booking.selectedAddonIds.length} add-on{booking.selectedAddonIds.length > 1 ? "s" : ""} selected
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{isFlightBooking ? "Passenger Information" : "Guest Information"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isFlightBooking && flightPassengers ? (
                <>
                  {flightPassengers.map((passenger: any, index: number) => (
                    <div key={index} className="pb-3 border-b last:border-0">
                      <div className="font-semibold">
                        Passenger {index + 1}: {passenger.title} {passenger.firstName} {passenger.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Type: {passenger.passengerType}
                        {passenger.passportNumber && ` • Passport: ${passenger.passportNumber}`}
                      </div>
                    </div>
                  ))}
                  {flightContact && (
                    <div className="pt-3 border-t">
                      <div className="text-sm text-gray-600">Contact Email: {flightContact.email}</div>
                      <div className="text-sm text-gray-600">Contact Phone: {flightContact.countryCode} {flightContact.phone}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <span className="text-sm text-gray-600">Name: </span>
                    <span>
                      {guestDetails.firstName} {guestDetails.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Email: </span>
                    <span>{guestDetails.email}</span>
                  </div>
                  {guestDetails.phone && (
                    <div>
                      <span className="text-sm text-gray-600">Phone: </span>
                      <span>{guestDetails.phone}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {booking.paymentStatus === "PENDING" && (
            <div className="flex gap-4">
              <Button asChild>
                <Link href={`/bookings/${booking.id}/payment`}>
                  Proceed to Payment
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

