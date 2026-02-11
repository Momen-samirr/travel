"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime, formatDuration, formatStops, getCabinClass, getBaggageInfo, getAirlineName } from "@/lib/flight-utils";
import type { FlightOffer } from "@/lib/flight-utils";
import { Plane, Clock } from "lucide-react";

interface FlightDetailsSummaryProps {
  flightOffer: FlightOffer;
  returnOffer?: FlightOffer;
  label?: string;
  compact?: boolean;
}

export function FlightDetailsSummary({
  flightOffer,
  returnOffer,
  label,
  compact = false,
}: FlightDetailsSummaryProps) {
  const renderItinerary = (offer: FlightOffer, title: string) => {
    const itinerary = offer.itineraries[0];
    const segments = itinerary.segments;
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];

    if (compact) {
      return (
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <div>
              <div className="font-semibold">{formatTime(firstSegment.departure.at)}</div>
              <div className="text-sm text-gray-500">{firstSegment.departure.iataCode}</div>
            </div>
            <Plane className="h-4 w-4 text-gray-400" />
            <div>
              <div className="font-semibold">{formatTime(lastSegment.arrival.at)}</div>
              <div className="text-sm text-gray-500">{lastSegment.arrival.iataCode}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {formatDuration(itinerary.duration)} • {formatStops(itinerary)}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="font-semibold text-sm text-gray-600 mb-2">{title}</div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-xl font-bold">{formatTime(firstSegment.departure.at)}</div>
            <div className="text-sm font-semibold text-primary">{firstSegment.departure.iataCode}</div>
            <div className="text-xs text-gray-500">
              {new Date(firstSegment.departure.at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>

          <div className="flex-1 px-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-px bg-gray-300"></div>
              <Plane className="h-4 w-4 text-gray-400" />
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium flex items-center justify-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(itinerary.duration)}
              </div>
              <div className="text-xs text-gray-500">{formatStops(itinerary)}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-xl font-bold">{formatTime(lastSegment.arrival.at)}</div>
            <div className="text-sm font-semibold text-primary">{lastSegment.arrival.iataCode}</div>
            <div className="text-xs text-gray-500">
              {new Date(lastSegment.arrival.at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="text-gray-600">
            {getAirlineName(firstSegment.carrierCode)} • {getCabinClass(offer)}
          </div>
          <div className="text-gray-600">{getBaggageInfo(offer)}</div>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {renderItinerary(flightOffer, "Outbound")}
        {returnOffer && renderItinerary(returnOffer, "Return")}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label || "Flight Details"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderItinerary(flightOffer, "Outbound Flight")}
        {returnOffer && (
          <div className="border-t pt-4">
            {renderItinerary(returnOffer, "Return Flight")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

