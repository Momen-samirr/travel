"use client";

import { useState, useEffect } from "react";
import { PassengerForm } from "./passenger-form";
import { ContactInformationForm } from "./contact-information-form";
import { Button } from "@/components/ui/button";
import type { PassengerInput, ContactInformationInput } from "@/lib/validations/passenger";

interface PassengerFormListProps {
  adults: number;
  children: number;
  infants: number;
  defaultPassengers?: PassengerInput[];
  defaultContact?: ContactInformationInput;
  onComplete: (passengers: PassengerInput[], contact: ContactInformationInput) => void;
}

export function PassengerFormList({
  adults,
  children,
  infants,
  defaultPassengers,
  defaultContact,
  onComplete,
}: PassengerFormListProps) {
  const [passengers, setPassengers] = useState<PassengerInput[]>(
    defaultPassengers || []
  );
  const [contact, setContact] = useState<ContactInformationInput>(
    defaultContact || { email: "", phone: "" }
  );

  const totalPassengers = adults + children + infants;

  // Initialize passengers array
  useEffect(() => {
    if (passengers.length === 0) {
      const initialPassengers: PassengerInput[] = [];
      
      // Add adults
      for (let i = 0; i < adults; i++) {
        initialPassengers.push({
          title: "Mr",
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          passengerType: "adult",
        } as PassengerInput);
      }
      
      // Add children
      for (let i = 0; i < children; i++) {
        initialPassengers.push({
          title: "Mr",
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          passengerType: "child",
        } as PassengerInput);
      }
      
      // Add infants
      for (let i = 0; i < infants; i++) {
        initialPassengers.push({
          title: "Mr",
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          passengerType: "infant",
        } as PassengerInput);
      }
      
      setPassengers(initialPassengers);
    }
  }, [adults, children, infants]);

  const handlePassengerUpdate = (index: number, data: PassengerInput) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index] = data;
      return updated;
    });
  };

  const handleContactUpdate = (data: ContactInformationInput) => {
    setContact(data);
  };

  const validateAll = (): boolean => {
    // Check all passengers have required fields
    for (const passenger of passengers) {
      if (!passenger.firstName || !passenger.lastName) {
        return false;
      }
      if (passenger.passengerType !== "adult" && !passenger.dateOfBirth) {
        return false;
      }
    }
    
    // Check contact information
    if (!contact.email || !contact.phone) {
      return false;
    }
    
    return true;
  };

  const handleContinue = () => {
    if (validateAll()) {
      onComplete(passengers, contact);
    }
  };

  let passengerIndex = 0;

  return (
    <div className="space-y-6">
      {/* Passenger Forms */}
      <div className="space-y-4">
        {adults > 0 && (
          <>
            <h3 className="font-semibold text-lg">Adults</h3>
            {Array.from({ length: adults }).map((_, i) => {
              const index = passengerIndex++;
              return (
                <PassengerForm
                  key={`adult-${i}`}
                  passengerNumber={i + 1}
                  passengerType="adult"
                  defaultValues={passengers[index]}
                  onUpdate={(data) => handlePassengerUpdate(index, data)}
                />
              );
            })}
          </>
        )}

        {children > 0 && (
          <>
            <h3 className="font-semibold text-lg mt-6">Children (2-11 years)</h3>
            {Array.from({ length: children }).map((_, i) => {
              const index = passengerIndex++;
              return (
                <PassengerForm
                  key={`child-${i}`}
                  passengerNumber={i + 1}
                  passengerType="child"
                  defaultValues={passengers[index]}
                  onUpdate={(data) => handlePassengerUpdate(index, data)}
                />
              );
            })}
          </>
        )}

        {infants > 0 && (
          <>
            <h3 className="font-semibold text-lg mt-6">Infants (under 2 years)</h3>
            {Array.from({ length: infants }).map((_, i) => {
              const index = passengerIndex++;
              return (
                <PassengerForm
                  key={`infant-${i}`}
                  passengerNumber={i + 1}
                  passengerType="infant"
                  defaultValues={passengers[index]}
                  onUpdate={(data) => handlePassengerUpdate(index, data)}
                />
              );
            })}
          </>
        )}
      </div>

      {/* Contact Information */}
      <ContactInformationForm
        defaultValues={contact}
        onUpdate={handleContactUpdate}
      />

      {/* Continue Button */}
      <div className="flex gap-4 pt-4">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          Back
        </Button>
        <Button
          className="flex-1"
          size="lg"
          onClick={handleContinue}
          disabled={!validateAll()}
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
}

