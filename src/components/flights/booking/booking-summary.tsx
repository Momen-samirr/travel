"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FlightDetailsSummary } from "./flight-details-summary";
import { PassengerSummary } from "./passenger-summary";
import { FinalPriceBreakdown } from "./final-price-breakdown";
import type { FlightOffer } from "@/lib/flight-utils";
import type { PassengerInput, ContactInformationInput } from "@/lib/validations/passenger";

interface BookingSummaryProps {
  flightOffer: FlightOffer;
  returnOffer?: FlightOffer;
  passengers: PassengerInput[];
  contact: ContactInformationInput;
  numberOfPassengers: number;
  addOnsTotal?: number;
  confirmedPrice?: number;
  priceChanged?: boolean;
  priceDifference?: number;
  compact?: boolean;
}

export function BookingSummary({
  flightOffer,
  returnOffer,
  passengers,
  contact,
  numberOfPassengers,
  addOnsTotal = 0,
  confirmedPrice,
  priceChanged,
  priceDifference,
  compact = false,
}: BookingSummaryProps) {
  if (compact) {
    return (
      <div className="space-y-4">
        <FlightDetailsSummary
          flightOffer={flightOffer}
          returnOffer={returnOffer}
          compact={true}
        />
        <PassengerSummary
          passengers={passengers}
          contact={contact}
          compact={true}
        />
        <FinalPriceBreakdown
          flightOffer={flightOffer}
          returnOffer={returnOffer}
          numberOfPassengers={numberOfPassengers}
          addOnsTotal={addOnsTotal}
          confirmedPrice={confirmedPrice}
          priceChanged={priceChanged}
          priceDifference={priceDifference}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FlightDetailsSummary
        flightOffer={flightOffer}
        returnOffer={returnOffer}
      />
      <PassengerSummary
        passengers={passengers}
        contact={contact}
      />
      <FinalPriceBreakdown
        flightOffer={flightOffer}
        returnOffer={returnOffer}
        numberOfPassengers={numberOfPassengers}
        addOnsTotal={addOnsTotal}
        confirmedPrice={confirmedPrice}
        priceChanged={priceChanged}
        priceDifference={priceDifference}
      />
    </div>
  );
}

