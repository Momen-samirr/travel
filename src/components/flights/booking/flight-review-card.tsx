"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, MapPin } from "lucide-react";
import { formatTime, formatDuration, formatStops, getCabinClass, getBaggageInfo, getAirlineName } from "@/lib/flight-utils";
import type { FlightOffer } from "@/lib/flight-utils";

interface FlightReviewCardProps {
  flightOffer: FlightOffer;
  label?: string;
}

export function FlightReviewCard({ flightOffer, label }: FlightReviewCardProps) {
  const itinerary = flightOffer.itineraries[0];
  const segments = itinerary.segments;
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{label || "Flight Details"}</CardTitle>
          <Badge variant="outline">{getCabinClass(flightOffer)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route and Times */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-2xl font-bold">{formatTime(firstSegment.departure.at)}</div>
            <div className="text-sm font-semibold text-primary">{firstSegment.departure.iataCode}</div>
            <div className="text-xs text-gray-500">
              {firstSegment.departure.terminal && `Terminal ${firstSegment.departure.terminal}`}
            </div>
            <div className="text-xs text-gray-500 mt-1">
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
            <div className="text-2xl font-bold">{formatTime(lastSegment.arrival.at)}</div>
            <div className="text-sm font-semibold text-primary">{lastSegment.arrival.iataCode}</div>
            <div className="text-xs text-gray-500">
              {lastSegment.arrival.terminal && `Terminal ${lastSegment.arrival.terminal}`}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(lastSegment.arrival.at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Airline and Baggage */}
        <div className="flex items-center justify-between text-sm pt-3 border-t">
          <div className="flex items-center gap-4">
            <span className="font-medium">{getAirlineName(firstSegment.carrierCode)}</span>
            <span className="text-gray-500">
              {firstSegment.carrierCode} {firstSegment.number}
            </span>
          </div>
          <div className="text-gray-600">{getBaggageInfo(flightOffer)}</div>
        </div>

        {/* Segments (if multiple) */}
        {segments.length > 1 && (
          <div className="pt-3 border-t space-y-2">
            <div className="text-xs font-semibold text-gray-500 mb-2">Flight Segments:</div>
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{segment.departure.iataCode}</span>
                  <Plane className="h-3 w-3 text-gray-400" />
                  <span className="font-medium">{segment.arrival.iataCode}</span>
                </div>
                <div className="text-gray-500">
                  {formatTime(segment.departure.at)} - {formatTime(segment.arrival.at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

