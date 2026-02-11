"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getFlightBookingData, isFlightBookingExpired } from "@/lib/flight-booking";
import { BookingSummary } from "@/components/flights/booking/booking-summary";
import { TermsAndConditions } from "@/components/flights/booking/terms-and-conditions";
import { ProgressIndicator } from "@/components/flights/booking/progress-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { FlightOffer } from "@/lib/flight-utils";
import type { PassengerInput, ContactInformationInput } from "@/lib/validations/passenger";

export default function BookingConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const offerId = params.offerId as string;
  const { user, isLoaded } = useUser();

  const [flightOffer, setFlightOffer] = useState<FlightOffer | null>(null);
  const [returnOffer, setReturnOffer] = useState<FlightOffer | null>(null);
  const [passengers, setPassengers] = useState<PassengerInput[]>([]);
  const [contact, setContact] = useState<ContactInformationInput | null>(null);
  const [searchParams, setSearchParams] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingPrice, setConfirmingPrice] = useState(false);
  const [priceConfirmed, setPriceConfirmed] = useState(false);
  const [priceChanged, setPriceChanged] = useState(false);
  const [priceDifference, setPriceDifference] = useState(0);
  const [confirmedPrice, setConfirmedPrice] = useState<number | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue with your booking.",
        variant: "default",
      });
      router.push(`/sign-in?redirect=/flights/${offerId}/confirm`);
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

        if (!bookingData.passengers || bookingData.passengers.length === 0) {
          toast({
            title: "Passenger information required",
            description: "Please complete passenger information first.",
            variant: "destructive",
          });
          router.push(`/flights/${offerId}/passengers`);
          return;
        }

        setFlightOffer(bookingData.flightOffer);
        setReturnOffer(bookingData.returnOffer || null);
        setPassengers(bookingData.passengers);
        setContact(bookingData.contact || null);
        setSearchParams(bookingData.searchParams);
        setLoading(false);
      } catch (error) {
        console.error("Error loading flight data:", error);
        toast({
          title: "Error",
          description: "Failed to load booking details. Please try again.",
          variant: "destructive",
        });
        router.push("/flights");
      }
    };

    loadFlightData();
  }, [offerId, isLoaded, user, router, toast]);

  const handleConfirmPrice = async () => {
    if (!flightOffer) return;

    setConfirmingPrice(true);
    try {
      const response = await fetch("/api/amadeus/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightOffer: flightOffer,
          flightOffers: returnOffer ? [flightOffer, returnOffer] : [flightOffer],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to confirm price");
      }

      const result = await response.json();
      const priceComparison = result.priceComparison;

      if (priceComparison.priceChanged) {
        setPriceChanged(true);
        setPriceDifference(priceComparison.priceDifference);
        
        if (priceComparison.priceDifference > 0) {
          toast({
            title: "Price has increased",
            description: `The flight price has increased by ${priceComparison.priceDifference.toFixed(2)} ${priceComparison.currency}. Please review and confirm.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Price has decreased",
            description: `Great news! The flight price has decreased by ${Math.abs(priceComparison.priceDifference).toFixed(2)} ${priceComparison.currency}.`,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Price confirmed",
          description: "The flight price has been confirmed and is still valid.",
          variant: "default",
        });
      }

      const confirmedOffer = result.data?.flightOffers?.[0];
      if (confirmedOffer?.price?.total) {
        setConfirmedPrice(parseFloat(confirmedOffer.price.total));
      }

      setPriceConfirmed(true);
    } catch (error: any) {
      console.error("Error confirming price:", error);
      toast({
        title: "Price confirmation failed",
        description: error.message || "Unable to confirm price. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirmingPrice(false);
    }
  };

  const handleCreateBooking = async () => {
    if (!flightOffer || !passengers.length || !contact || !termsAccepted) {
      toast({
        title: "Missing information",
        description: "Please complete all required fields and accept terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    if (!priceConfirmed) {
      toast({
        title: "Price not confirmed",
        description: "Please confirm the flight price before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setCreatingBooking(true);
    try {
      const totalPassengers = passengers.length;
      const basePrice = confirmedPrice || parseFloat(flightOffer.price.total);
      const returnPrice = returnOffer ? parseFloat(returnOffer.price.total) : 0;
      const totalAmount = (basePrice + returnPrice) * totalPassengers;

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType: "FLIGHT",
          flightOfferId: flightOffer.id,
          flightOfferData: {
            outbound: flightOffer,
            return: returnOffer,
          },
          numberOfGuests: totalPassengers,
          guestDetails: {
            passengers,
            contact,
          },
          totalAmount,
          currency: flightOffer.price.currency,
          travelDate: new Date(flightOffer.itineraries[0].segments[0].departure.at),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create booking");
      }

      const booking = await response.json();

      toast({
        title: "Booking created successfully!",
        description: "Redirecting to payment...",
        variant: "default",
      });

      router.push(`/bookings/${booking.id}/payment`);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast({
        title: "Booking failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingBooking(false);
    }
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

  if (!flightOffer || !passengers.length || !contact) {
    return null;
  }

  const totalPassengers = passengers.length;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={4}
          totalSteps={4}
          steps={["Review", "Passengers", "Extras", "Confirm"]}
        />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Review & Confirm Booking</h1>
          <p className="text-gray-600">
            Please review all details before confirming your booking
          </p>
        </div>

        {/* Expiry Warning */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <div className="text-sm">
                <strong>Important:</strong> Complete your booking within the next few minutes to secure this price.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Summary */}
        <BookingSummary
          flightOffer={flightOffer}
          returnOffer={returnOffer || undefined}
          passengers={passengers}
          contact={contact}
          numberOfPassengers={totalPassengers}
          confirmedPrice={confirmedPrice || undefined}
          priceChanged={priceChanged}
          priceDifference={priceDifference}
        />

        {/* Price Confirmation */}
        {!priceConfirmed && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Confirm Flight Price</h3>
                  <p className="text-sm text-gray-600">
                    Verify the current price with the airline before booking
                  </p>
                </div>
                <Button
                  onClick={handleConfirmPrice}
                  disabled={confirmingPrice}
                >
                  {confirmingPrice ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    "Confirm Price"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {priceConfirmed && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <div className="text-sm font-semibold">
                  Price confirmed and ready for booking
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Terms and Conditions */}
        <TermsAndConditions
          accepted={termsAccepted}
          onAcceptChange={setTermsAccepted}
        />

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/flights/${offerId}/passengers`)}
            disabled={creatingBooking}
          >
            Back
          </Button>
          <Button
            className="flex-1"
            size="lg"
            onClick={handleCreateBooking}
            disabled={!priceConfirmed || !termsAccepted || creatingBooking}
          >
            {creatingBooking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Booking...
              </>
            ) : (
              "Proceed to Payment"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

