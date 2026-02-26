import { NextRequest, NextResponse } from "next/server";
import { searchAirports } from "@/lib/airports-data";

/**
 * Airport/city autocomplete. Uses static data only; no Amadeus API.
 * Response shape matches previous /api/amadeus/airports for AirportAutocomplete.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const locations = searchAirports(query).map((loc) => ({
      iataCode: loc.iataCode,
      name: loc.name,
      cityName: loc.cityName,
      countryName: loc.countryName,
      type: loc.type,
    }));

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("[API /airports] Error:", error);
    return NextResponse.json(
      { error: "Failed to search airports" },
      { status: 500 }
    );
  }
}
