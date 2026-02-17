import { NextRequest, NextResponse } from "next/server";
import { getHotelOffers } from "@/lib/amadeus";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hotelId = searchParams.get("hotelId");
    const checkInDate = searchParams.get("checkInDate");
    const checkOutDate = searchParams.get("checkOutDate");
    const adults = searchParams.get("adults") || "1";
    const children = searchParams.get("children");
    const currencyCode = searchParams.get("currencyCode") || "EGP";

    console.log("[API /amadeus/hotels/offers] Received request with params:", {
      hotelId,
      checkInDate,
      checkOutDate,
      adults,
      children,
      currencyCode,
    });

    // Validation
    if (!hotelId) {
      return NextResponse.json(
        { error: "hotelId is required" },
        { status: 400 }
      );
    }

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: "checkInDate and checkOutDate are required" },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkInDate) || !dateRegex.test(checkOutDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validate check-out is after check-in
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      return NextResponse.json(
        { error: "checkOutDate must be after checkInDate" },
        { status: 400 }
      );
    }

    const response = await getHotelOffers({
      hotelId,
      checkInDate,
      checkOutDate,
      adults: parseInt(adults),
      children: children ? parseInt(children) : undefined,
      currencyCode,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[API /amadeus/hotels/offers] Error getting hotel offers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get hotel offers" },
      { status: 500 }
    );
  }
}

