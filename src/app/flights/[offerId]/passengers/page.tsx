"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getFlightBookingData, updatePassengers, isFlightBookingExpired } from "@/lib/flight-booking";
import { PassengerFormList } from "@/components/flights/booking/passenger-form-list";
import { ProgressIndicator } from "@/components/flights/booking/progress-indicator";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PassengerInput, ContactInformationInput } from "@/lib/validations/passenger";

export default function PassengerInformationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const offerId = params.offerId as string;
  const { user, isLoaded } = useUser();

  const [searchParams, setSearchParams] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [defaultPassengers, setDefaultPassengers] = useState<PassengerInput[]>([]);
  const [defaultContact, setDefaultContact] = useState<ContactInformationInput | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue with your booking.",
        variant: "default",
      });
      router.push(`/sign-in?redirect=/flights/${offerId}/passengers`);
      return;
    }

    const loadFlightData = () => {
      try {
        const bookingData = getFlightBookingData(offerId);

        if (!bookingData) {
          toast({
            title: "Flight offer not found",
            description: "Please search for flights again.",
            variant: "destructive",
          });
          router.push("/flights");
          return;
        }

        if (isFlightBookingExpired(offerId)) {
          toast({
            title: "Flight offer expired",
            description: "Flight offers expire after 30 minutes. Please search again.",
            variant: "destructive",
          });
          router.push("/flights");
          return;
        }

        setSearchParams(bookingData.searchParams);
        
        // Pre-fill contact from user data
        if (user.emailAddresses?.[0]?.emailAddress) {
          setDefaultContact({
            email: user.emailAddresses[0].emailAddress,
            phone: user.phoneNumbers?.[0]?.phoneNumber || "",
            countryCode: "+20",
          });
        }

        // Restore saved passengers if available
        if (bookingData.passengers) {
          setDefaultPassengers(bookingData.passengers);
        }
        if (bookingData.contact) {
          setDefaultContact(bookingData.contact);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading flight data:", error);
        toast({
          title: "Error",
          description: "Failed to load flight details. Please try again.",
          variant: "destructive",
        });
        router.push("/flights");
      }
    };

    loadFlightData();
  }, [offerId, isLoaded, user, router, toast]);

  const handleComplete = (passengers: PassengerInput[], contact: ContactInformationInput) => {
    // Save to sessionStorage
    updatePassengers(offerId, passengers, contact);

    // Navigate to final confirmation page
    router.push(`/flights/${offerId}/confirm`);
  };

  if (loading || !isLoaded || !user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!searchParams) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={2}
          totalSteps={4}
          steps={["Review", "Passengers", "Extras", "Confirm"]}
        />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Passenger Information</h1>
          <p className="text-gray-600">
            Please provide details for all passengers as they appear on travel documents
          </p>
        </div>

        {/* Important Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2 text-blue-800">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div className="text-sm">
                <strong>Important:</strong> All passenger names must match exactly as they appear on passports or ID cards. 
                Incorrect information may result in additional fees or denied boarding.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passenger Forms */}
        <PassengerFormList
          adults={searchParams.adults || 1}
          children={searchParams.children || 0}
          infants={searchParams.infants || 0}
          defaultPassengers={defaultPassengers}
          defaultContact={defaultContact || undefined}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}

