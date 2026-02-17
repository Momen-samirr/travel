import { NextRequest, NextResponse } from "next/server";
import { AmadeusHotelService } from "@/services/hotels/amadeusHotelService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const checkInDate = searchParams.get("checkInDate");
    const checkOutDate = searchParams.get("checkOutDate");
    const adults = searchParams.get("adults") || "1";
    const children = searchParams.get("children");
    const currencyCode = searchParams.get("currencyCode") || "EGP";

    console.log("[API /amadeus/hotels/details] Received request for hotelId:", hotelId);

    if (!hotelId) {
      return NextResponse.json(
        { error: "hotelId is required" },
        { status: 400 }
      );
    }

    const service = new AmadeusHotelService();
    const hotel = await service.getHotelById(hotelId, {
      checkInDate: checkInDate || undefined,
      checkOutDate: checkOutDate || undefined,
      adults: parseInt(adults),
      children: children ? parseInt(children) : undefined,
      currencyCode,
    });

    if (!hotel) {
      return NextResponse.json(
        { error: "Hotel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(hotel);
  } catch (error: any) {
    console.error("[API /amadeus/hotels/details] Error getting hotel details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get hotel details" },
      { status: 500 }
    );
  }
}

