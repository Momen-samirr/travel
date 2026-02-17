import { NextRequest, NextResponse } from "next/server";
import { AmadeusHotelService } from "@/services/hotels/amadeusHotelService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cityCode = searchParams.get("cityCode");
    const checkInDate = searchParams.get("checkInDate");
    const checkOutDate = searchParams.get("checkOutDate");
    const adults = searchParams.get("adults") || "1";
    const children = searchParams.get("children");
    const currencyCode = searchParams.get("currencyCode") || "EGP";

    console.log("[API /amadeus/hotels/search] Received request with params:", {
      cityCode,
      checkInDate,
      checkOutDate,
      adults,
      children,
      currencyCode,
    });

    // Validation
    if (!cityCode) {
      return NextResponse.json(
        { error: "cityCode is required" },
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

    const service = new AmadeusHotelService();
    const result = await service.searchHotels({
      cityCode,
      checkInDate,
      checkOutDate,
      adults: parseInt(adults),
      children: children ? parseInt(children) : undefined,
      currencyCode,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API /amadeus/hotels/search] Error searching hotels:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search hotels" },
      { status: 500 }
    );
  }
}

