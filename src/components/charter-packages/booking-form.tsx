"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SignInButton } from "@clerk/nextjs";
import { LogIn } from "lucide-react";

interface CharterPackageBookingFormProps {
  packageId: string;
}

export function CharterPackageBookingForm({
  packageId,
}: CharterPackageBookingFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isSignedIn, isLoaded } = useUser();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleBooking = async () => {
    if (!isLoaded) {
      toast({
        title: "Please wait",
        description: "Checking authentication...",
        variant: "default",
      });
      return;
    }

    if (!isSignedIn || !user) {
      const redirectUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      toast({
        title: "Sign In Required",
        description: "Please sign in to complete your booking.",
        variant: "default",
      });
      router.push(`/sign-in?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType: "CHARTER_PACKAGE",
          charterPackageId: packageId,
          numberOfGuests: 1,
          guestDetails: {
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.emailAddresses[0]?.emailAddress || "",
            phone: user.phoneNumbers[0]?.phoneNumber || "",
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create booking");
      }

      const booking = await response.json();
      toast({
        title: "Booking created!",
        description: "Your booking has been created successfully.",
        variant: "success",
      });
      router.push(`/bookings/${booking.id}`);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast({
        title: "Failed to create booking",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <Button disabled className="w-full">
        Loading...
      </Button>
    );
  }

  if (!isSignedIn) {
    return (
      <SignInButton
        mode="modal"
        fallbackRedirectUrl={pathname}
      >
        <Button className="w-full">
          <LogIn className="h-4 w-4 mr-2" />
          Sign In to Book
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button
      onClick={handleBooking}
      disabled={submitting}
      className="w-full"
      size="lg"
    >
      {submitting ? "Processing..." : "Book Now"}
    </Button>
  );
}

