import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { charterDepartureOptionSchema } from "@/lib/validations/charter-package";
import { requireAdmin } from "@/lib/clerk";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const options = await prisma.charterDepartureOption.findMany({
      where: { packageId: id },
      orderBy: { departureDate: "asc" },
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error("Error fetching departure options:", error);
    return NextResponse.json(
      { error: "Failed to fetch departure options" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { hotelPricings, ...departureData } = body;
    const data = charterDepartureOptionSchema.parse(departureData);

    // Validate hotel options belong to the same package
    if (hotelPricings && Array.isArray(hotelPricings) && hotelPricings.length > 0) {
      const hotelOptionIds = hotelPricings.map((hp: any) => hp.hotelOptionId);
      const hotelOptions = await prisma.charterPackageHotelOption.findMany({
        where: {
          id: { in: hotelOptionIds },
          packageId: id,
        },
      });

      if (hotelOptions.length !== hotelOptionIds.length) {
        return NextResponse.json(
          { error: "Some hotel options do not belong to this package" },
          { status: 400 }
        );
      }
    }

    const option = await prisma.charterDepartureOption.create({
      data: {
        departureAirport: data.departureAirport,
        arrivalAirport: data.arrivalAirport,
        departureDate: data.departureDate,
        returnDate: data.returnDate,
        flightInfo: data.flightInfo,
        priceModifier: data.priceModifier,
        currency: data.currency,
        isActive: data.isActive,
        packageId: id,
      },
    });

    // Create hotel pricing records with room type pricings
    if (hotelPricings && Array.isArray(hotelPricings) && hotelPricings.length > 0) {
      for (const hotelPricing of hotelPricings) {
        const departureHotelPricing = await prisma.departureHotelPricing.create({
          data: {
            departureOptionId: option.id,
            hotelOptionId: hotelPricing.hotelOptionId,
            currency: hotelPricing.currency || "EGP",
          },
        });

        // Create room type pricing records
        if (hotelPricing.roomTypePricings && Array.isArray(hotelPricing.roomTypePricings)) {
          await prisma.roomTypePricing.createMany({
            data: hotelPricing.roomTypePricings.map((rtp: any) => ({
              departureHotelPricingId: departureHotelPricing.id,
              roomType: rtp.roomType,
              price: rtp.price,
              childPrice: rtp.childPrice || null,
              infantPrice: rtp.infantPrice || null,
              currency: rtp.currency || hotelPricing.currency || "EGP",
            })),
          });
        }
      }
      console.log(`Created ${hotelPricings.length} hotel pricing records for departure option ${option.id}`);
    }

    const createdOption = await prisma.charterDepartureOption.findUnique({
      where: { id: option.id },
      include: {
        hotelPricings: {
          include: {
            hotelOption: {
              include: {
                hotel: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                    country: true,
                  },
                },
              },
            },
            roomTypePricings: true,
          },
        },
      },
    });

    return NextResponse.json(createdOption, { status: 201 });
  } catch (error: any) {
    console.error("Error creating departure option:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create departure option" },
      { status: 500 }
    );
  }
}

