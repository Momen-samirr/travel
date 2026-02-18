"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { SignInButton } from "@clerk/nextjs";
import { LogIn, Hotel, Plane, Users, Package, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCharterPackagePricing } from "@/hooks/use-charter-package-pricing";
import { useDepartureHotels } from "@/hooks/use-departure-hotels";
import { PriceBreakdown } from "./price-breakdown";
import { Decimal } from "@prisma/client/runtime/library";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface PackageData {
  id: string;
  basePrice: Decimal | null;
  priceRangeMin: Decimal | null;
  priceRangeMax: Decimal | null;
  currency: string;
  discount: Decimal | null;
  hotelOptions: Array<{
    id: string;
    hotel: {
      id: string;
      name: string;
      city: string;
      country: string;
    };
    roomTypePricings?: Array<{
      roomType: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD";
      price: Decimal | number;
      childPrice: Decimal | number | null;
      infantPrice: Decimal | number | null;
      currency: string;
    }>;
    currency?: string;
    starRating: number | null;
    bookingRating: number | null;
  }>;
  departureOptions: Array<{
    id: string;
    departureAirport: string;
    arrivalAirport: string;
    departureDate: Date;
    returnDate: Date;
    priceModifier: Decimal | null;
    currency: string;
    flightInfo: string | null;
  }>;
  addons: Array<{
    id: string;
    name: string;
    description: string | null;
    price: Decimal;
    currency: string;
    isRequired: boolean;
  }>;
}

interface DynamicBookingFormProps {
  packageData: PackageData;
}

export function DynamicBookingForm({ packageData }: DynamicBookingFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isSignedIn, isLoaded } = useUser();
  const { toast } = useToast();

  const [hotelOptionId, setHotelOptionId] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<"SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD" | null>(null);
  const [departureOptionId, setDepartureOptionId] = useState<string | null>(null);
  const [numberOfAdults, setNumberOfAdults] = useState(1);
  const [numberOfChildren6to12, setNumberOfChildren6to12] = useState(0);
  const [numberOfChildren2to6, setNumberOfChildren2to6] = useState(0);
  const [numberOfInfants, setNumberOfInfants] = useState(0);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch hotels based on selected departure
  const {
    hotels: availableHotels,
    loading: hotelsLoading,
    error: hotelsError,
  } = useDepartureHotels(packageData.id, departureOptionId);

  // Auto-select required add-ons
  useEffect(() => {
    const requiredAddons = packageData.addons
      .filter((addon) => addon.isRequired)
      .map((addon) => addon.id);
    setSelectedAddonIds((prev) => {
      const combined = [...new Set([...prev, ...requiredAddons])];
      return combined;
    });
  }, [packageData.addons]);

  // Reset hotel and room type when departure changes
  useEffect(() => {
    setHotelOptionId(null);
    setRoomType(null);
  }, [departureOptionId]);

  // Reset room type when hotel changes
  useEffect(() => {
    setRoomType(null);
  }, [hotelOptionId]);

    // Use available hotels from hook if departure is selected, otherwise use all hotels
    const hotelsToUse = departureOptionId ? availableHotels : packageData.hotelOptions;

    const pricing = useCharterPackagePricing(
    {
      basePrice: packageData.basePrice,
      priceRangeMin: packageData.priceRangeMin,
      priceRangeMax: packageData.priceRangeMax,
      currency: packageData.currency,
      discount: packageData.discount,
      hotelOptions: hotelsToUse.map((opt: any) => ({
        id: opt.id,
        roomTypePricings: opt.roomTypePricings || [],
        currency: opt.currency || packageData.currency,
      })),
      departureOptions: packageData.departureOptions.map((opt) => ({
        id: opt.id,
        priceModifier: opt.priceModifier,
        currency: opt.currency,
      })),
      addons: packageData.addons.map((addon) => ({
        id: addon.id,
        price: addon.price,
        currency: addon.currency,
      })),
    },
    {
      hotelOptionId,
      departureOptionId,
      roomType,
      numberOfAdults,
      numberOfChildren6to12,
      numberOfChildren2to6,
      numberOfInfants,
      selectedAddonIds,
    }
  );

  const selectedAddons = packageData.addons.filter((addon) =>
    selectedAddonIds.includes(addon.id)
  );

  const handleAddonToggle = (addonId: string, isRequired: boolean) => {
    if (isRequired) return; // Can't uncheck required add-ons
    setSelectedAddonIds((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const validateSelections = (): string | null => {
    if (!hotelOptionId) return "Please select a hotel option";
    if (!roomType) return "Please select a room type";
    if (!departureOptionId) return "Please select a departure option";
    if (numberOfAdults < 1) return "At least one adult is required";
    return null;
  };

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

    const validationError = validateSelections();
    if (validationError) {
      toast({
        title: "Invalid Selection",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType: "CHARTER_PACKAGE",
          charterPackageId: packageData.id,
          charterHotelOptionId: hotelOptionId,
          charterDepartureOptionId: departureOptionId,
          roomType,
          numberOfAdults,
          numberOfChildren6to12,
          numberOfChildren2to6,
          numberOfInfants,
          selectedAddonIds,
          numberOfGuests: numberOfAdults + numberOfChildren6to12 + numberOfChildren2to6 + numberOfInfants,
          guestDetails: {
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.emailAddresses[0]?.emailAddress || "",
            phone: user.phoneNumbers[0]?.phoneNumber || user.emailAddresses[0]?.emailAddress || "N/A",
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
      <Card>
        <CardContent className="pt-6">
          <Button disabled className="w-full">
            Loading...
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isSignedIn) {
    return (
      <Card>
        <CardContent className="pt-6">
          <SignInButton mode="modal" fallbackRedirectUrl={pathname}>
            <Button className="w-full" size="lg">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to Book
            </Button>
          </SignInButton>
        </CardContent>
      </Card>
    );
  }

  const canBook =
    hotelOptionId &&
    roomType &&
    departureOptionId &&
    numberOfAdults >= 1;

  return (
    <div className="space-y-4">
      {packageData.departureOptions.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No departure options available for this package.
          </AlertDescription>
        </Alert>
      )}

      {packageData.departureOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plane className="h-5 w-5" />
              Select Departure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={departureOptionId || ""}
              onValueChange={setDepartureOptionId}
            >
              <div className="space-y-3">
                {packageData.departureOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-start space-x-3 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label
                      htmlFor={option.id}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="font-semibold">
                        {option.departureAirport} → {option.arrivalAirport}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(option.departureDate)} -{" "}
                        {formatDate(option.returnDate)}
                      </div>
                      {option.priceModifier && (
                        <div className="text-sm font-medium">
                          {Number(option.priceModifier) > 0 ? "+" : ""}
                          {formatCurrency(
                            Number(option.priceModifier),
                            option.currency
                          )}
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {departureOptionId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hotel className="h-5 w-5" />
              Select Hotel
              <span className="text-sm font-normal text-muted-foreground">
                (Available for selected departure)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hotelsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading available hotels...
                </span>
              </div>
            ) : hotelsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{hotelsError}</AlertDescription>
              </Alert>
            ) : availableHotels.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hotels available for the selected departure option.
                </AlertDescription>
              </Alert>
            ) : (
              <RadioGroup
                value={hotelOptionId || ""}
                onValueChange={setHotelOptionId}
              >
                <div className="space-y-3">
                  {availableHotels.map((option: any) => (
                    <div
                      key={option.id}
                      className="flex items-start space-x-3 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                    >
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label
                        htmlFor={option.id}
                        className="flex-1 cursor-pointer space-y-1"
                      >
                        <div className="font-semibold">
                          {option.hotel.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {option.hotel.city}, {option.hotel.country}
                        </div>
                        <div className="flex gap-2">
                          {option.starRating && (
                            <Badge variant="outline">
                              {option.starRating} stars
                            </Badge>
                          )}
                          {option.bookingRating && (
                            <Badge variant="outline">
                              {option.bookingRating}/10
                            </Badge>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      )}

      {!departureOptionId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              Please select a departure option first to see available hotels.
            </div>
          </CardContent>
        </Card>
      )}

      {hotelOptionId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hotel className="h-5 w-5" />
              Room Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={roomType || ""}
              onValueChange={(value) =>
                setRoomType(value as "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD")
              }
            >
              <div className="space-y-3">
                {availableHotels
                  .find((opt: any) => opt.id === hotelOptionId)
                  ?.roomTypePricings?.map((rtp: any) => {
                    const roomTypeLabels: Record<string, string> = {
                      SINGLE: "Single Room",
                      DOUBLE: "Double Room",
                      TRIPLE: "Triple Room",
                      QUAD: "Quad Room",
                    };
                    return (
                      <div
                        key={rtp.roomType}
                        className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                      >
                        <RadioGroupItem value={rtp.roomType} id={rtp.roomType.toLowerCase()} />
                        <Label htmlFor={rtp.roomType.toLowerCase()} className="flex-1 cursor-pointer">
                          <div className="font-semibold">{roomTypeLabels[rtp.roomType] || rtp.roomType}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(Number(rtp.adultPrice), rtp.currency || packageData.currency)}
                          </div>
                        </Label>
                      </div>
                    );
                  })}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Travelers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adults">Adults</Label>
            <Input
              id="adults"
              type="number"
              min="1"
              value={numberOfAdults}
              onChange={(e) =>
                setNumberOfAdults(Math.max(1, parseInt(e.target.value) || 1))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="children6to12">Children (6-12 Years)</Label>
            <Input
              id="children6to12"
              type="number"
              min="0"
              value={numberOfChildren6to12}
              onChange={(e) =>
                setNumberOfChildren6to12(
                  Math.max(0, parseInt(e.target.value) || 0)
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="children2to6">Children (2-6 Years)</Label>
            <Input
              id="children2to6"
              type="number"
              min="0"
              value={numberOfChildren2to6}
              onChange={(e) =>
                setNumberOfChildren2to6(
                  Math.max(0, parseInt(e.target.value) || 0)
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="infants">Infants (0-2 Years)</Label>
            <Input
              id="infants"
              type="number"
              min="0"
              value={numberOfInfants}
              onChange={(e) =>
                setNumberOfInfants(Math.max(0, parseInt(e.target.value) || 0))
              }
            />
          </div>
        </CardContent>
      </Card>

      {packageData.addons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Optional Add-ons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {packageData.addons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-start space-x-3 border rounded-lg p-3"
                >
                  <Checkbox
                    id={addon.id}
                    checked={selectedAddonIds.includes(addon.id)}
                    onCheckedChange={() =>
                      handleAddonToggle(addon.id, addon.isRequired)
                    }
                    disabled={addon.isRequired}
                  />
                  <Label
                    htmlFor={addon.id}
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{addon.name}</div>
                      <div className="font-semibold">
                        {formatCurrency(Number(addon.price), addon.currency)}
                      </div>
                    </div>
                    {addon.description && (
                      <div className="text-sm text-muted-foreground">
                        {addon.description}
                      </div>
                    )}
                    {addon.isRequired && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <PriceBreakdown
        {...pricing}
        numberOfAdults={numberOfAdults}
        numberOfChildren6to12={numberOfChildren6to12}
        numberOfChildren2to6={numberOfChildren2to6}
        numberOfInfants={numberOfInfants}
        selectedAddons={selectedAddons.map((addon) => ({
          id: addon.id,
          name: addon.name,
          price: Number(addon.price),
        }))}
      />

      <Button
        onClick={handleBooking}
        disabled={!canBook || submitting}
        className="w-full"
        size="lg"
      >
        {submitting ? "Processing..." : "Book Now"}
      </Button>

      {!canBook && (
        <p className="text-sm text-muted-foreground text-center">
          Please complete all selections to proceed with booking
        </p>
      )}
    </div>
  );
}

