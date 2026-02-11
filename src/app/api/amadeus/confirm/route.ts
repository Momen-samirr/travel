import { NextRequest, NextResponse } from "next/server";
import { confirmFlightPrice } from "@/lib/amadeus";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offerId, flightOffer, flightOffers } = body;

    console.log("[API /amadeus/confirm] Received request:", {
      hasOfferId: !!offerId,
      hasFlightOffer: !!flightOffer,
      hasFlightOffers: !!flightOffers,
    });

    // Accept either offerId (string) or flightOffer/flightOffers (object/array)
    let offerData: string | any;
    
    if (flightOffers && Array.isArray(flightOffers)) {
      offerData = flightOffers;
    } else if (flightOffer) {
      offerData = flightOffer;
    } else if (offerId) {
      offerData = offerId;
    } else {
      return NextResponse.json(
        { error: "Either offerId, flightOffer, or flightOffers is required" },
        { status: 400 }
      );
    }

    const result = await confirmFlightPrice(offerData);

    // Compare prices if original offer was provided
    let priceChanged = false;
    let priceDifference = 0;
    let originalPrice = 0;
    let confirmedPrice = 0;

    if (flightOffer || (flightOffers && Array.isArray(flightOffers))) {
      const originalOffers = Array.isArray(flightOffers) ? flightOffers : [flightOffer];
      const confirmedOffers = result.data?.flightOffers || [];

      if (originalOffers.length > 0 && confirmedOffers.length > 0) {
        originalPrice = parseFloat(originalOffers[0].price?.total || "0");
        confirmedPrice = parseFloat(confirmedOffers[0].price?.total || "0");
        priceDifference = confirmedPrice - originalPrice;
        priceChanged = Math.abs(priceDifference) > 0.01; // Allow small floating point differences
      }
    }

    return NextResponse.json({
      ...result,
      priceComparison: {
        priceChanged,
        priceDifference,
        originalPrice,
        confirmedPrice,
        currency: result.data?.flightOffers?.[0]?.price?.currency || "EGP",
      },
    });
  } catch (error: any) {
    console.error("[API /amadeus/confirm] Error confirming flight price:", error);
    return NextResponse.json(
      { error: error.message || "Failed to confirm flight price" },
      { status: 500 }
    );
  }
}

