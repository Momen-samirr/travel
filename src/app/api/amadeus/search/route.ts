import { NextRequest, NextResponse } from "next/server";
import { searchFlightOffers } from "@/lib/amadeus";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    const departureDate = searchParams.get("departureDate");
    const returnDate = searchParams.get("returnDate");
    const adults = searchParams.get("adults") || "1";
    const children = searchParams.get("children");
    const infants = searchParams.get("infants");
    const currencyCode = searchParams.get("currencyCode") || "EGP";
    const travelClass = searchParams.get("travelClass") as "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST" | null;

    console.log("[API /amadeus/search] Received request with params:", {
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      currencyCode,
      travelClass,
    });

    if (!origin || !destination || !departureDate) {
      console.error("[API /amadeus/search] Missing required parameters:", {
        hasOrigin: !!origin,
        hasDestination: !!destination,
        hasDepartureDate: !!departureDate,
      });
      return NextResponse.json(
        { error: "Missing required parameters: origin, destination, and departureDate are required" },
        { status: 400 }
      );
    }

    if (origin.length !== 3 || destination.length !== 3) {
      console.error("[API /amadeus/search] Invalid IATA codes:", { origin, destination });
      return NextResponse.json(
        { error: "Invalid airport codes. Origin and destination must be 3-character IATA codes." },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(departureDate)) {
      return NextResponse.json(
        { error: "Invalid departure date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (returnDate && !dateRegex.test(returnDate)) {
      return NextResponse.json(
        { error: "Invalid return date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (returnDate && new Date(returnDate) <= new Date(departureDate)) {
      return NextResponse.json(
        { error: "Return date must be after departure date" },
        { status: 400 }
      );
    }

    console.log("[API /amadeus/search] Calling searchFlightOffers with:", {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      returnDate: returnDate || undefined,
      adults: parseInt(adults),
      children: children ? parseInt(children) : undefined,
      infants: infants ? parseInt(infants) : undefined,
      currencyCode,
      travelClass: travelClass || undefined,
    });

    const results = await searchFlightOffers({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      returnDate: returnDate || undefined,
      adults: parseInt(adults),
      children: children ? parseInt(children) : undefined,
      infants: infants ? parseInt(infants) : undefined,
      currencyCode,
      travelClass: travelClass || undefined,
    });

    console.log("[API /amadeus/search] Amadeus API response structure:", {
      hasData: !!results.data,
      dataType: typeof results.data,
      dataIsArray: Array.isArray(results.data),
      dataLength: Array.isArray(results.data) ? results.data.length : "N/A",
      responseKeys: Object.keys(results),
    });

    if (Array.isArray(results.data) && results.data.length > 0) {
      console.log("[API /amadeus/search] First flight offer structure:", {
        hasId: !!results.data[0].id,
        hasPrice: !!results.data[0].price,
        hasItineraries: !!results.data[0].itineraries,
        itinerariesLength: Array.isArray(results.data[0].itineraries) ? results.data[0].itineraries.length : "N/A",
      });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("[API /amadeus/search] Error searching flights:", error);
    console.error("[API /amadeus/search] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { error: error.message || "Failed to search flights" },
      { status: 500 }
    );
  }
}

