"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { formatTime, formatDuration, formatStops, getCabinClass, getBaggageInfo, getAirlineName, calculateLayover, formatLayover } from "@/lib/flight-utils";
import { formatCurrency } from "@/lib/utils";
import type { FlightOffer } from "@/lib/flight-utils";
import { storeFlightBookingData } from "@/lib/flight-booking";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface FlightResultCardProps {
  flight: FlightOffer;
  onSelect?: (flight: FlightOffer) => void;
  showDetails?: boolean;
}

export function FlightResultCard({ flight, onSelect, showDetails: initialShowDetails = false }: FlightResultCardProps) {
  const [showDetails, setShowDetails] = useState(initialShowDetails);
  const router = useRouter();
  const { toast } = useToast();

  const outbound = flight.itineraries[0];
  const returnFlight = flight.itineraries[1];

  const price = parseFloat(flight.price.total);
  const currency = flight.price.currency;

  const renderItinerary = (itinerary: typeof outbound, label: string) => {
    if (!itinerary) return null;

    const segments = itinerary.segments;
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Departure */}
            <div className="text-center">
              <div className="text-2xl font-bold">{formatTime(firstSegment.departure.at)}</div>
              <div className="text-sm font-semibold text-primary">{firstSegment.departure.iataCode}</div>
              <div className="text-xs text-gray-500">{firstSegment.departure.terminal && `Terminal ${firstSegment.departure.terminal}`}</div>
            </div>

            {/* Route */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-px bg-gray-300"></div>
                <Plane className="h-4 w-4 text-gray-400" />
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">{formatDuration(itinerary.duration)}</div>
                <div className="text-xs text-gray-500">{formatStops(itinerary)}</div>
              </div>
            </div>

            {/* Arrival */}
            <div className="text-center">
              <div className="text-2xl font-bold">{formatTime(lastSegment.arrival.at)}</div>
              <div className="text-sm font-semibold text-primary">{lastSegment.arrival.iataCode}</div>
              <div className="text-xs text-gray-500">{lastSegment.arrival.terminal && `Terminal ${lastSegment.arrival.terminal}`}</div>
            </div>
          </div>
        </div>

        {/* Airline and Cabin */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="font-medium">{getAirlineName(firstSegment.carrierCode)}</span>
            <Badge variant="outline">{getCabinClass(flight)}</Badge>
            <span className="text-gray-500">{getBaggageInfo(flight)}</span>
          </div>
        </div>

        {/* Segments Details */}
        {showDetails && segments.length > 1 && (
          <div className="border-t pt-4 space-y-3">
            {segments.map((segment, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">{formatTime(segment.departure.at)}</div>
                      <div className="text-xs text-gray-500">{segment.departure.iataCode}</div>
                    </div>
                    <Plane className="h-3 w-3 text-gray-400" />
                    <div>
                      <div className="font-medium">{formatTime(segment.arrival.at)}</div>
                      <div className="text-xs text-gray-500">{segment.arrival.iataCode}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {segment.carrierCode} {segment.number} • {formatDuration(segment.duration)}
                  </div>
                </div>
                {index < segments.length - 1 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 pl-8">
                    <Clock className="h-3 w-3" />
                    <span>
                      Layover in {segment.arrival.iataCode}: {formatLayover(calculateLayover(segment, segments[index + 1]))}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <Card className="card-hover border-2 hover:border-primary/50">
        <CardContent className="p-6">
        <div className="space-y-6">
          {/* Outbound Flight */}
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-3">OUTBOUND</div>
            {renderItinerary(outbound, "Outbound")}
          </div>

          {/* Return Flight */}
          {returnFlight && (
            <div className="border-t pt-6">
              <div className="text-xs font-semibold text-gray-500 mb-3">RETURN</div>
              {renderItinerary(returnFlight, "Return")}
            </div>
          )}

          {/* Price and Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(price, currency)}
              </div>
              <div className="text-sm text-gray-500">per person</div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    View Details
                  </>
                )}
              </Button>
              {onSelect ? (
                <Button onClick={() => onSelect(flight)}>
                  Select
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    // Store flight offer in sessionStorage
                    const offerId = flight.id;
                    storeFlightBookingData(offerId, {
                      offerId,
                      flightOffer: flight,
                      searchParams: {
                        origin: flight.itineraries[0]?.segments[0]?.departure.iataCode || "",
                        destination: flight.itineraries[0]?.segments[flight.itineraries[0].segments.length - 1]?.arrival.iataCode || "",
                        departureDate: flight.itineraries[0]?.segments[0]?.departure.at?.split("T")[0] || "",
                        returnDate: flight.itineraries[1]?.segments[0]?.departure.at?.split("T")[0],
                        adults: 1, // Default, will be updated from search params
                        children: 0,
                        infants: 0,
                      },
                      timestamp: Date.now(),
                    });
                    
                    // Navigate to flight review page
                    router.push(`/flights/${offerId}/review`);
                  }}
                >
                  Select
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      </Card>
    </motion.div>
  );
}

