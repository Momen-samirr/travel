import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const { optionId } = await params;

    const departureOption = await prisma.charterDepartureOption.findUnique({
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
                    address: true,
                    latitude: true,
                    longitude: true,
                    placeId: true,
                  },
                },
              },
            },
            roomTypePricings: {
              orderBy: {
                roomType: "asc",
              },
            },
          },
        },
      },
    });

    if (!departureOption) {
      return NextResponse.json(
        { error: "Departure option not found" },
        { status: 404 }
      );
    }

    // Map hotel pricings to hotel options with pricing data
    const hotelOptions = departureOption.hotelPricings
      .filter((hp) => hp.hotelOption && hp.hotelOption.isActive)
      .map((hp) => ({
        ...hp.hotelOption,
        roomTypePricings: hp.roomTypePricings,
        currency: hp.currency,
      }));

    console.log(`Found ${hotelOptions.length} hotels with pricing for departure option ${optionId}`);

    return NextResponse.json(hotelOptions);
  } catch (error) {
    console.error("Error fetching hotels for departure option:", error);
    return NextResponse.json(
      { error: "Failed to fetch hotels" },
      { status: 500 }
    );
  }
}

