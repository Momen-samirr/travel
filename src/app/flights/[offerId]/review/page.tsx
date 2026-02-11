"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getFlightBookingData, isFlightBookingExpired } from "@/lib/flight-booking";
import { FlightReviewCard } from "@/components/flights/booking/flight-review-card";
import { PriceBreakdown } from "@/components/flights/booking/price-breakdown";
import { ProgressIndicator } from "@/components/flights/booking/progress-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, AlertCircle } from "lucide-react";
import type { FlightOffer } from "@/lib/flight-utils";

export default function FlightReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const offerId = params.offerId as string;
  
  const [flightOffer, setFlightOffer] = useState<FlightOffer | null>(null);
  const [returnOffer, setReturnOffer] = useState<FlightOffer | null>(null);
  const [searchParams, setSearchParams] = useState<{
    adults?: number;
    children?: number;
    infants?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue with your booking.",
        variant: "default",
      });
      router.push(`/sign-in?redirect=/flights/${offerId}/review`);
      return;
    }
  }, [isLoaded, user, offerId, router, toast]);

  useEffect(() => {
    if (!isLoaded || !user) return;

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

        setFlightOffer(bookingData.flightOffer);
        setReturnOffer(bookingData.returnOffer || null);
        setSearchParams(bookingData.searchParams);
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

  if (loading || !isLoaded || !user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!flightOffer) {
    return null;
  }

  const totalPassengers = (searchParams?.adults || 1) + (searchParams?.children || 0) + (searchParams?.infants || 0);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={1}
          totalSteps={4}
          steps={["Review", "Passengers", "Extras", "Confirm"]}
        />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Review Your Flight</h1>
          <p className="text-gray-600">
            Please review your flight details before proceeding
          </p>
        </div>

        {/* Expiry Warning */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <div className="text-sm">
                <strong>Important:</strong> Flight prices are valid for 30 minutes. Complete your booking soon to secure this price.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outbound Flight */}
        <FlightReviewCard flightOffer={flightOffer} label="Outbound Flight" />

        {/* Return Flight */}
        {returnOffer && (
          <FlightReviewCard flightOffer={returnOffer} label="Return Flight" />
        )}

        {/* Passenger Count */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-semibold">{totalPassengers} Passenger{totalPassengers !== 1 ? "s" : ""}</div>
                <div className="text-sm text-gray-600">
                  {searchParams?.adults || 1} Adult{(searchParams?.adults || 1) !== 1 ? "s" : ""}
                  {searchParams && searchParams.children && searchParams.children > 0 && `, ${searchParams.children} Child${searchParams.children !== 1 ? "ren" : ""}`}
                  {searchParams && searchParams.infants && searchParams.infants > 0 && `, ${searchParams.infants} Infant${searchParams.infants !== 1 ? "s" : ""}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <PriceBreakdown
          flightOffer={flightOffer}
          returnOffer={returnOffer || undefined}
          numberOfPassengers={totalPassengers}
        />

        {/* Continue Button */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/flights")}
          >
            Back to Search
          </Button>
          <Button
            className="flex-1"
            size="lg"
            onClick={() => {
              router.push(`/flights/${offerId}/passengers`);
            }}
          >
            Continue to Passenger Information
          </Button>
        </div>
      </div>
    </div>
  );
}

