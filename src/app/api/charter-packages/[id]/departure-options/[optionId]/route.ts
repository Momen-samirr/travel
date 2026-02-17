import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { charterDepartureOptionSchema } from "@/lib/validations/charter-package";
import { requireAdmin } from "@/lib/clerk";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const { optionId } = await params;

    const option = await prisma.charterDepartureOption.findUnique({
      where: { id: optionId },
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

    if (!option) {
      return NextResponse.json(
        { error: "Departure option not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(option);
  } catch (error) {
    console.error("Error fetching departure option:", error);
    return NextResponse.json(
      { error: "Failed to fetch departure option" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    await requireAdmin();
    const { optionId, id: packageId } = await params;
    const body = await request.json();
    const { hotelPricings, ...departureData } = body;
    const data = charterDepartureOptionSchema.parse(departureData);

    // Validate hotel options belong to the same package
    if (hotelPricings && Array.isArray(hotelPricings) && hotelPricings.length > 0) {
      const hotelOptionIds = hotelPricings.map((hp: any) => hp.hotelOptionId);
      const hotelOptions = await prisma.charterPackageHotelOption.findMany({
        where: {
          id: { in: hotelOptionIds },
          packageId,
        },
      });

      if (hotelOptions.length !== hotelOptionIds.length) {
        return NextResponse.json(
          { error: "Some hotel options do not belong to this package" },
          { status: 400 }
        );
      }
    }

    const option = await prisma.charterDepartureOption.update({
      where: { id: optionId },
      data: {
        departureAirport: data.departureAirport,
        arrivalAirport: data.arrivalAirport,
        departureDate: data.departureDate,
        returnDate: data.returnDate,
        flightInfo: data.flightInfo,
        priceModifier: data.priceModifier,
        currency: data.currency,
        isActive: data.isActive,
      },
    });

    // Update hotel pricing records
    if (hotelPricings !== undefined) {
      // Delete existing pricing records (cascade will delete room type pricings)
      await prisma.departureHotelPricing.deleteMany({
        where: { departureOptionId: optionId },
      });

      // Create new pricing records
      if (Array.isArray(hotelPricings) && hotelPricings.length > 0) {
        for (const hotelPricing of hotelPricings) {
          const departureHotelPricing = await prisma.departureHotelPricing.create({
            data: {
              departureOptionId: optionId,
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
      }
    }

    const updatedOption = await prisma.charterDepartureOption.findUnique({
      where: { id: optionId },
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

    return NextResponse.json(updatedOption);
  } catch (error: any) {
    console.error("Error updating departure option:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update departure option" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    await requireAdmin();
    const { optionId } = await params;
    await prisma.charterDepartureOption.delete({
      where: { id: optionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting departure option:", error);
    return NextResponse.json(
      { error: "Failed to delete departure option" },
      { status: 500 }
    );
  }
}

