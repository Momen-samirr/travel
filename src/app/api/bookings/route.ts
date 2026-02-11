import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingSchema, type BookingInput } from "@/lib/validations/booking";
import { getCurrentUser } from "@/lib/clerk";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: any = { userId: user.id };
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        tour: {
          select: {
            title: true,
            slug: true,
            images: true,
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
            images: true,
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

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = bookingSchema.parse(body);

    // Calculate total amount based on booking type
    let totalAmount = 0;
    let currency = "EGP";

    if (data.bookingType === "TOUR" && data.tourId) {
      const tour = await prisma.tour.findUnique({
        where: { id: data.tourId },
      });
      if (!tour) {
        return NextResponse.json(
          { error: "Tour not found" },
          { status: 404 }
        );
      }
      totalAmount = Number(tour.discountPrice || tour.price) * data.numberOfGuests;
      currency = tour.currency;
    } else if (data.bookingType === "FLIGHT") {
      // For flight bookings, we use Amadeus offers (not stored in DB)
      // Price should come from confirmed flight offer or be provided
      const bookingData = data as BookingInput & { totalAmount?: number; currency?: string };
      
      if (bookingData.totalAmount && bookingData.totalAmount > 0) {
        // Use provided totalAmount (from frontend after price confirmation)
        totalAmount = bookingData.totalAmount;
        currency = bookingData.currency || "EGP";
      } else if (data.flightOfferData) {
        // Fallback: Extract price from flight offer data
        // Structure can be: { outbound: {...}, return: {...} } or direct offer
        const offerData = data.flightOfferData as { outbound?: any; return?: any; price?: any; [key: string]: any };
        const outbound = offerData.outbound || offerData;
        const returnOffer = offerData.return;
        
        // Calculate total price (outbound + return if exists) * number of passengers
        const outboundPrice = parseFloat(outbound?.price?.total || outbound?.price || "0");
        const returnPrice = returnOffer ? parseFloat(returnOffer.price?.total || returnOffer.price || "0") : 0;
        const pricePerPerson = outboundPrice + returnPrice;
        
        if (pricePerPerson > 0) {
          totalAmount = pricePerPerson * data.numberOfGuests;
          currency = outbound?.price?.currency || "EGP";
        } else {
          return NextResponse.json(
            { error: "Flight price could not be determined. Please try again." },
            { status: 400 }
          );
        }
        
        // Extract travel date from flight offer
        const outboundItinerary = outbound?.itineraries?.[0];
        if (outboundItinerary?.segments?.[0]?.departure?.at) {
          data.travelDate = new Date(outboundItinerary.segments[0].departure.at);
        }
      } else if (data.flightId) {
        // Fallback to database flight (for manually created flights)
        const flight = await prisma.flight.findUnique({
          where: { id: data.flightId },
        });
        if (!flight) {
          return NextResponse.json(
            { error: "Flight not found" },
            { status: 404 }
          );
        }
        totalAmount = Number(flight.price) * data.numberOfGuests;
        currency = flight.currency;
      } else {
        return NextResponse.json(
          { error: "Flight offer data or flight ID is required for flight bookings" },
          { status: 400 }
        );
      }
    } else if (data.bookingType === "HOTEL" && data.hotelId) {
      const hotel = await prisma.hotel.findUnique({
        where: { id: data.hotelId },
      });
      if (!hotel) {
        return NextResponse.json(
          { error: "Hotel not found" },
          { status: 404 }
        );
      }
      // Calculate based on number of nights (assuming 1 night for now)
      totalAmount = Number(hotel.pricePerNight) * data.numberOfGuests;
      currency = hotel.currency;
    } else if (data.bookingType === "VISA" && data.visaId) {
      const visa = await prisma.visa.findUnique({
        where: { id: data.visaId },
      });
      if (!visa) {
        return NextResponse.json(
          { error: "Visa not found" },
          { status: 404 }
        );
      }
      totalAmount = Number(visa.price) * data.numberOfGuests;
      currency = visa.currency;
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        bookingType: data.bookingType,
        tourId: data.tourId,
        flightId: data.flightId,
        hotelId: data.hotelId,
        visaId: data.visaId,
        travelDate: data.travelDate,
        totalAmount,
        currency,
        guestDetails: data.guestDetails as any,
        flightOfferData: data.flightOfferData || null,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

