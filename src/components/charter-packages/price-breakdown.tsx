"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PriceBreakdownProps {
  basePrice: number;
  departureModifier: number;
  hotelRoomCost: number;
  children6to12Cost: number;
  children2to6Cost: number;
  infantsCost: number;
  addonsCost: number;
  subtotal: number;
  discount: number;
  total: number;
  totalPerPerson: number;
  currency: string;
  numberOfAdults: number;
  numberOfChildren6to12: number;
  numberOfChildren2to6: number;
  numberOfInfants: number;
  selectedAddons?: Array<{ id: string; name: string; price: number }>;
}

export function PriceBreakdown({
  basePrice,
  departureModifier,
  hotelRoomCost,
  children6to12Cost,
  children2to6Cost,
  infantsCost,
  addonsCost,
  subtotal,
  discount,
  total,
  totalPerPerson,
  currency,
  numberOfAdults,
  numberOfChildren6to12,
  numberOfChildren2to6,
  numberOfInfants,
  selectedAddons = [],
}: PriceBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalTravelers = numberOfAdults + numberOfChildren6to12 + numberOfChildren2to6 + numberOfInfants;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Price Breakdown</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-2xl font-bold text-primary">
          <span>Total</span>
          <span>{formatCurrency(total, currency)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatCurrency(totalPerPerson, currency)} per person × {totalTravelers}{" "}
          {totalTravelers === 1 ? "traveler" : "travelers"}
        </div>

        {isExpanded && (
          <div className="pt-3 border-t space-y-2 text-sm">
            {basePrice > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Price</span>
                <span>{formatCurrency(basePrice, currency)}</span>
              </div>
            )}

            {departureModifier !== 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Departure Modifier</span>
                <span>
                  {departureModifier > 0 ? "+" : ""}
                  {formatCurrency(departureModifier, currency)}
                </span>
              </div>
            )}

            {hotelRoomCost > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Adults ({numberOfAdults} {numberOfAdults === 1 ? "adult" : "adults"})
                </span>
                <span>{formatCurrency(hotelRoomCost, currency)}</span>
              </div>
            )}

            {children6to12Cost > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Children (6-12 Years) ({numberOfChildren6to12})
                </span>
                <span>{formatCurrency(children6to12Cost, currency)}</span>
              </div>
            )}

            {children2to6Cost > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Children (2-6 Years) ({numberOfChildren2to6})
                </span>
                <span>{formatCurrency(children2to6Cost, currency)}</span>
              </div>
            )}

            {infantsCost > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Infants (0-2 Years) ({numberOfInfants})
                </span>
                <span>{formatCurrency(infantsCost, currency)}</span>
              </div>
            )}

            {addonsCost > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Add-ons ({totalTravelers} {totalTravelers === 1 ? "person" : "people"})
                  </span>
                  <span>{formatCurrency(addonsCost, currency)}</span>
                </div>
                {selectedAddons.length > 0 && (
                  <div className="pl-4 space-y-1 text-xs text-muted-foreground">
                    {selectedAddons.map((addon) => (
                      <div key={addon.id} className="flex justify-between">
                        <span>{addon.name}</span>
                        <span>
                          {formatCurrency(addon.price, currency)} × {totalTravelers} = {formatCurrency(addon.price * totalTravelers, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(subtotal, currency)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(discount, currency)}</span>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

