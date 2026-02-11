"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { FlightOffer } from "@/lib/flight-utils";

interface FinalPriceBreakdownProps {
  flightOffer: FlightOffer;
  returnOffer?: FlightOffer;
  numberOfPassengers: number;
  addOnsTotal?: number;
  confirmedPrice?: number;
  priceChanged?: boolean;
  priceDifference?: number;
}

export function FinalPriceBreakdown({
  flightOffer,
  returnOffer,
  numberOfPassengers,
  addOnsTotal = 0,
  confirmedPrice,
  priceChanged,
  priceDifference,
}: FinalPriceBreakdownProps) {
  const basePrice = confirmedPrice 
    ? confirmedPrice / numberOfPassengers
    : parseFloat(flightOffer.price.total);
  const returnPrice = returnOffer ? parseFloat(returnOffer.price.total) : 0;
  const totalBasePrice = (basePrice + returnPrice) * numberOfPassengers;
  const currency = flightOffer.price.currency;
  const totalAmount = totalBasePrice + addOnsTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {priceChanged && priceDifference !== undefined && (
          <div className={`p-3 rounded-md ${priceDifference > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="text-sm font-semibold">
              {priceDifference > 0 ? (
                <>⚠️ Price increased by {formatCurrency(Math.abs(priceDifference) * numberOfPassengers, currency)}</>
              ) : (
                <>✓ Price decreased by {formatCurrency(Math.abs(priceDifference) * numberOfPassengers, currency)}</>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Base Fare ({numberOfPassengers} {numberOfPassengers === 1 ? "passenger" : "passengers"})</span>
            <span>{formatCurrency(totalBasePrice, currency)}</span>
          </div>
          
          {returnOffer && (
            <>
              <div className="flex justify-between text-sm text-gray-600 pl-4">
                <span>Outbound</span>
                <span>{formatCurrency(basePrice * numberOfPassengers, currency)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 pl-4">
                <span>Return</span>
                <span>{formatCurrency(returnPrice * numberOfPassengers, currency)}</span>
              </div>
            </>
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
            <span className="font-semibold text-lg">Total</span>
            <span className="text-3xl font-bold text-primary">
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

