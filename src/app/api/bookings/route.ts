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
    } else if (data.bookingType === "CHARTER_PACKAGE" && data.charterPackageId) {
      const pkg = await prisma.charterTravelPackage.findUnique({
        where: { id: data.charterPackageId },
        include: {
          hotelOptions: true,
          departureOptions: true,
          addons: true,
        },
      });
      if (!pkg) {
        return NextResponse.json(
          { error: "Charter package not found" },
          { status: 404 }
        );
      }

      // Validate required fields for charter package booking
      if (!data.charterHotelOptionId || !data.charterDepartureOptionId || !data.roomType) {
        return NextResponse.json(
          { error: "Hotel option, departure option, and room type are required", message: "Hotel option, departure option, and room type are required" },
          { status: 400 }
        );
      }

      // Validate hotel option belongs to package
      const hotelOption = pkg.hotelOptions.find(
        (opt) => opt.id === data.charterHotelOptionId
      );
      if (!hotelOption) {
        return NextResponse.json(
          { error: "Invalid hotel option selected", message: "Invalid hotel option selected" },
          { status: 400 }
        );
      }

      // Validate departure option belongs to package
      const departureOption = pkg.departureOptions.find(
        (opt) => opt.id === data.charterDepartureOptionId
      );
      if (!departureOption) {
        return NextResponse.json(
          { error: "Invalid departure option selected", message: "Invalid departure option selected" },
          { status: 400 }
        );
      }

      // Fetch pricing for the selected departure and hotel combination
      const departureHotelPricing = await prisma.departureHotelPricing.findFirst({
        where: {
          departureOptionId: data.charterDepartureOptionId,
          hotelOptionId: data.charterHotelOptionId,
        },
        include: {
          roomTypePricings: true,
        },
      });

      if (!departureHotelPricing) {
        return NextResponse.json(
          { error: "Selected hotel is not available for the chosen departure option", message: "Selected hotel is not available for the chosen departure option" },
          { status: 400 }
        );
      }

      // Validate add-ons
      if (data.selectedAddonIds && Array.isArray(data.selectedAddonIds)) {
        const invalidAddons = data.selectedAddonIds.filter(
          (addonId) => !pkg.addons.some((addon) => addon.id === addonId && addon.isActive)
        );
        if (invalidAddons.length > 0) {
          return NextResponse.json(
            { error: "Invalid add-ons selected", message: "Invalid add-ons selected" },
            { status: 400 }
          );
        }
      }

      // Calculate base price (optional, used as fallback only)
      let basePrice = 0;
      if (pkg.basePrice) {
        basePrice = Number(pkg.basePrice);
      } else if (pkg.priceRangeMin && pkg.priceRangeMax) {
        basePrice =
          (Number(pkg.priceRangeMin) + Number(pkg.priceRangeMax)) / 2;
      }
      // Note: basePrice can be 0 if not configured - we'll use room type pricing instead

      // Calculate departure modifier
      let departureModifier = 0;
      if (departureOption.priceModifier) {
        departureModifier = Number(departureOption.priceModifier);
      }

      // Calculate hotel room cost from RoomTypePricing
      const numberOfAdults = data.numberOfAdults || data.numberOfGuests || 1;
      const numberOfChildren = data.numberOfChildren || 0;
      const numberOfInfants = data.numberOfInfants || 0;

      let hotelRoomCost = 0;
      let childrenCost = 0;
      let infantsCost = 0;

      if (data.roomType) {
        const roomTypePricing = departureHotelPricing.roomTypePricings.find(
          (rtp) => rtp.roomType === data.roomType
        );

        if (!roomTypePricing) {
          return NextResponse.json(
            { error: `Room type ${data.roomType} pricing not configured for this hotel and departure combination`, message: `Room type ${data.roomType} pricing not configured for this hotel and departure combination` },
            { status: 400 }
          );
        }

        // Calculate number of rooms based on room type
        let numberOfRooms = 1;
        if (data.roomType === "SINGLE") {
          numberOfRooms = numberOfAdults;
        } else if (data.roomType === "DOUBLE") {
          numberOfRooms = Math.ceil(numberOfAdults / 2);
        } else if (data.roomType === "TRIPLE") {
          numberOfRooms = Math.ceil(numberOfAdults / 3);
        } else if (data.roomType === "QUAD") {
          numberOfRooms = Math.ceil(numberOfAdults / 4);
        }

        hotelRoomCost = Number(roomTypePricing.price) * numberOfRooms;

        // Calculate children cost from room type pricing
        if (numberOfChildren > 0 && roomTypePricing.childPrice) {
          childrenCost = Number(roomTypePricing.childPrice) * numberOfChildren;
        }

        // Calculate infants cost from room type pricing
        if (numberOfInfants > 0 && roomTypePricing.infantPrice) {
          infantsCost = Number(roomTypePricing.infantPrice) * numberOfInfants;
        }
      } else {
        return NextResponse.json(
          { error: "Room type is required", message: "Room type is required" },
          { status: 400 }
        );
      }

      // Calculate add-ons cost
      let addonsCost = 0;
      if (data.selectedAddonIds && Array.isArray(data.selectedAddonIds)) {
        data.selectedAddonIds.forEach((addonId) => {
          const addon = pkg.addons.find((a) => a.id === addonId);
          if (addon) {
            addonsCost += Number(addon.price);
          }
        });
      }

      // Calculate subtotal per person
      const totalTravelers = numberOfAdults + numberOfChildren + numberOfInfants;
      // Base price is optional - only add if configured
      // With new pricing architecture, room type pricing is the primary source
      const subtotalPerPerson =
        (basePrice || 0) +
        departureModifier +
        (hotelRoomCost / Math.max(numberOfAdults, 1)) +
        (childrenCost / Math.max(numberOfAdults, 1)) +
        (infantsCost / Math.max(numberOfAdults, 1)) +
        (addonsCost / Math.max(numberOfAdults, 1));

      // Apply discount
      let discount = 0;
      if (pkg.discount) {
        discount = (subtotalPerPerson * Number(pkg.discount)) / 100;
      }

      const totalPerPerson = subtotalPerPerson - discount;
      totalAmount = totalPerPerson * totalTravelers;
      currency = pkg.currency;
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        bookingType: data.bookingType,
        tourId: data.tourId,
        flightId: data.flightId,
        hotelId: data.hotelId,
        visaId: data.visaId,
        charterPackageId: data.charterPackageId,
        charterHotelOptionId: data.charterHotelOptionId || null,
        charterDepartureOptionId: data.charterDepartureOptionId || null,
        roomType: data.roomType || null,
        numberOfAdults: data.numberOfAdults || null,
        numberOfChildren: data.numberOfChildren || null,
        numberOfInfants: data.numberOfInfants || null,
        selectedAddonIds: data.selectedAddonIds ? (data.selectedAddonIds as any) : null,
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
        { error: "Validation error", message: error.errors?.[0]?.message || "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create booking", message: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

