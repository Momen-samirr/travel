import { NextRequest, NextResponse } from "next/server";
import { getHotelPhotos } from "@/lib/amadeus";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;

    console.log("[API /amadeus/hotels/photos] Received request for hotelId:", hotelId);

    if (!hotelId) {
      return NextResponse.json(
        { error: "hotelId is required" },
        { status: 400 }
      );
    }

    const response = await getHotelPhotos(hotelId);

    // Extract photo URLs from response
    const photos: string[] = [];
    const data = response.data || [];
    
    for (const item of data) {
      if (item.uri) {
        photos.push(item.uri);
      }
    }

    return NextResponse.json({ photos });
  } catch (error: any) {
    console.error("[API /amadeus/hotels/photos] Error getting hotel photos:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get hotel photos", photos: [] },
      { status: 500 }
    );
  }
}

