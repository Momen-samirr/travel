import { NextRequest, NextResponse } from "next/server";
import { getAirportCityCodes } from "@/lib/amadeus";

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

    const results = await getAirportCityCodes(query);

    const locations = results.data?.map((location: any) => ({
      iataCode: location.iataCode,
      name: location.name,
      cityName: location.address?.cityName,
      countryName: location.address?.countryName,
      type: location.subType,
    })) || [];

    return NextResponse.json({ locations });
  } catch (error: any) {
    console.error("Error searching airports:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search airports" },
      { status: 500 }
    );
  }
}

