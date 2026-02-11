"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { FlightOffer } from "@/lib/flight-utils";

interface PriceBreakdownProps {
  flightOffer: FlightOffer;
  returnOffer?: FlightOffer;
  numberOfPassengers?: number;
  addOnsTotal?: number;
}

export function PriceBreakdown({
  flightOffer,
  returnOffer,
  numberOfPassengers = 1,
  addOnsTotal = 0,
}: PriceBreakdownProps) {
  const basePrice = parseFloat(flightOffer.price.total);
  const returnPrice = returnOffer ? parseFloat(returnOffer.price.total) : 0;
  const totalBasePrice = (basePrice + returnPrice) * numberOfPassengers;
  const currency = flightOffer.price.currency;
  const totalAmount = totalBasePrice + addOnsTotal;

  // Try to extract taxes and fees from price breakdown if available
  const travelerPricing = flightOffer.travelerPricings?.[0];
  const fareDetails = travelerPricing?.fareDetailsBySegment?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Base Fare ({numberOfPassengers} {numberOfPassengers === 1 ? "passenger" : "passengers"})</span>
            <span>{formatCurrency(totalBasePrice, currency)}</span>
          </div>
          
          {returnOffer && (
            <div className="flex justify-between text-sm text-gray-600 pl-4">
              <span>Outbound</span>
              <span>{formatCurrency(basePrice * numberOfPassengers, currency)}</span>
            </div>
          )}
          
          {returnOffer && (
            <div className="flex justify-between text-sm text-gray-600 pl-4">
              <span>Return</span>
              <span>{formatCurrency(returnPrice * numberOfPassengers, currency)}</span>
            </div>
          )}

          {addOnsTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Add-ons</span>
              <span>{formatCurrency(addOnsTotal, currency)}</span>
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(totalAmount, currency)}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Price per person: {formatCurrency((basePrice + returnPrice), currency)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

