"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Download, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { FlightOffer } from "@/lib/flight-utils";
import { formatTime, formatDuration, formatStops, getCabinClass, getAirlineName } from "@/lib/flight-utils";
import type { PassengerInput, ContactInformationInput } from "@/lib/validations/passenger";

interface FlightConfirmationProps {
  bookingId: string;
  flightOffer: FlightOffer;
  returnOffer?: FlightOffer;
  passengers: PassengerInput[];
  contact: ContactInformationInput;
  totalAmount: number;
  currency: string;
  bookingDate: Date;
  travelDate?: Date;
}

export function FlightConfirmation({
  bookingId,
  flightOffer,
  returnOffer,
  passengers,
  contact,
  totalAmount,
  currency,
  bookingDate,
  travelDate,
}: FlightConfirmationProps) {
  const itinerary = flightOffer.itineraries[0];
  const segments = itinerary.segments;
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-green-800">Booking Confirmed!</h2>
              <p className="text-green-700">
                Your flight booking has been confirmed. A confirmation email has been sent to {contact.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Booking ID</div>
              <div className="text-2xl font-mono font-bold">{bookingId}</div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Confirmed
            </Badge>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div>Booking Date: {formatDate(bookingDate)}</div>
            {travelDate && <div>Travel Date: {formatDate(travelDate)}</div>}
          </div>
        </CardContent>
      </Card>

      {/* Flight Details */}
      <Card>
        <CardHeader>
          <CardTitle>Flight Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Outbound */}
          <div>
            <div className="font-semibold mb-3">Outbound Flight</div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-xl font-bold">{formatTime(firstSegment.departure.at)}</div>
                <div className="text-sm font-semibold text-primary">{firstSegment.departure.iataCode}</div>
                <div className="text-xs text-gray-500">
                  {new Date(firstSegment.departure.at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="flex-1 px-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <div className="text-sm text-gray-500">{formatDuration(itinerary.duration)}</div>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
                <div className="text-center text-xs text-gray-500">
                  {formatStops(itinerary)} • {getAirlineName(firstSegment.carrierCode)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{formatTime(lastSegment.arrival.at)}</div>
                <div className="text-sm font-semibold text-primary">{lastSegment.arrival.iataCode}</div>
                <div className="text-xs text-gray-500">
                  {new Date(lastSegment.arrival.at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Return */}
          {returnOffer && (
            <div className="border-t pt-4">
              <div className="font-semibold mb-3">Return Flight</div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {formatTime(returnOffer.itineraries[0].segments[0].departure.at)}
                  </div>
                  <div className="text-sm font-semibold text-primary">
                    {returnOffer.itineraries[0].segments[0].departure.iataCode}
                  </div>
                </div>
                <div className="flex-1 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <div className="text-sm text-gray-500">
                      {formatDuration(returnOffer.itineraries[0].duration)}
                    </div>
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {formatTime(
                      returnOffer.itineraries[0].segments[
                        returnOffer.itineraries[0].segments.length - 1
                      ].arrival.at
                    )}
                  </div>
                  <div className="text-sm font-semibold text-primary">
                    {
                      returnOffer.itineraries[0].segments[
                        returnOffer.itineraries[0].segments.length - 1
                      ].arrival.iataCode
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Passengers */}
      <Card>
        <CardHeader>
          <CardTitle>Passengers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {passengers.map((passenger, index) => (
              <div key={index} className="pb-3 border-b last:border-0">
                <div className="font-semibold">
                  {passenger.title} {passenger.firstName} {passenger.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {passenger.passengerType} • {passenger.passportNumber && `Passport: ${passenger.passportNumber}`}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total Paid</span>
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(totalAmount, currency)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

