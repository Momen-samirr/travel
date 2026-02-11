"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PassengerInput, ContactInformationInput } from "@/lib/validations/passenger";
import { Users, Mail, Phone } from "lucide-react";

interface PassengerSummaryProps {
  passengers: PassengerInput[];
  contact: ContactInformationInput;
  compact?: boolean;
}

export function PassengerSummary({
  passengers,
  contact,
  compact = false,
}: PassengerSummaryProps) {
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="font-semibold text-sm mb-2">Passengers</div>
        {passengers.map((passenger, index) => (
          <div key={index} className="text-sm">
            {passenger.title} {passenger.firstName} {passenger.lastName}
            {passenger.passengerType !== "adult" && (
              <span className="text-gray-500 ml-2">
                ({passenger.passengerType})
              </span>
            )}
          </div>
        ))}
        <div className="pt-2 border-t mt-2">
          <div className="text-sm">
            <Mail className="h-3 w-3 inline mr-1" />
            {contact.email}
          </div>
          <div className="text-sm">
            <Phone className="h-3 w-3 inline mr-1" />
            {contact.countryCode} {contact.phone}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passenger Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {passengers.map((passenger, index) => (
            <div key={index} className="pb-3 border-b last:border-0">
              <div className="font-semibold">
                Passenger {index + 1}: {passenger.title} {passenger.firstName} {passenger.lastName}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Type: {passenger.passengerType}
                {passenger.dateOfBirth && (
                  <> • DOB: {new Date(passenger.dateOfBirth).toLocaleDateString()}</>
                )}
                {passenger.passportNumber && (
                  <> • Passport: {passenger.passportNumber}</>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="font-semibold mb-2">Contact Information</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{contact.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{contact.countryCode} {contact.phone}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

