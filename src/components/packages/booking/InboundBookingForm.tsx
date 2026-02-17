"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SignInButton } from "@clerk/nextjs";
import { LogIn, Hotel, Users, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Decimal } from "@prisma/client/runtime/library";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface InboundBookingFormProps {
  packageData: any;
}

/**
 * Inbound Booking Form - For packages without international flights
 * Includes: Hotel selection, room type, pickup location, transfer options, travelers
 * Does NOT include: Departure selection
 */
export function InboundBookingForm({ packageData }: InboundBookingFormProps) {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const { toast } = useToast();

  const [hotelOptionId, setHotelOptionId] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<"SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD" | null>(null);
  const [numberOfAdults, setNumberOfAdults] = useState(1);
  const [numberOfChildren, setNumberOfChildren] = useState(0);
  const [numberOfInfants, setNumberOfInfants] = useState(0);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [pickupLocation, setPickupLocation] = useState<string>("");
  const [transferOptions, setTransferOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Get transfer options from typeConfig
  const transferOptionsConfig = packageData.typeConfig?.transferOptions || [];
  const pickupLocations = packageData.typeConfig?.pickupLocations || [];

  // Auto-select required add-ons
  useEffect(() => {
    const requiredAddons = packageData.addons
      .filter((addon: any) => addon.isRequired)
      .map((addon: any) => addon.id);
    setSelectedAddonIds((prev) => {
      const combined = [...new Set([...prev, ...requiredAddons])];
      return combined;
    });
  }, [packageData.addons]);

  // Reset room type when hotel changes
  useEffect(() => {
    setRoomType(null);
  }, [hotelOptionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to continue with your booking",
        variant: "destructive",
      });
      return;
    }

    if (!hotelOptionId || !roomType) {
      toast({
        title: "Missing information",
        description: "Please select a hotel and room type",
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
          hotelOptionId,
          roomType,
          numberOfAdults,
          numberOfChildren,
          numberOfInfants,
          selectedAddonIds,
          pickupLocation: pickupLocation || undefined,
          transferOptions: transferOptions.length > 0 ? transferOptions : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create booking");
      }

      const booking = await response.json();
      toast({
        title: "Booking created!",
        description: "Your booking has been created successfully",
      });
      router.push(`/bookings/${booking.id}`);
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Booking failed",
        description: error.message || "Failed to create booking. Please try again.",
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
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSignedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Sign in to Book
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Please sign in to continue with your booking
          </p>
          <SignInButton mode="modal">
            <Button className="w-full">Sign In</Button>
          </SignInButton>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            Book Your Package
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hotel Selection */}
          <div className="space-y-2">
            <Label>Select Hotel *</Label>
            <Select
              value={hotelOptionId || ""}
              onValueChange={setHotelOptionId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a hotel" />
              </SelectTrigger>
              <SelectContent>
                {packageData.hotelOptions.map((option: any) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.hotel.name} - {option.hotel.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Type Selection */}
          {hotelOptionId && (
            <div className="space-y-2">
              <Label>Room Type *</Label>
              <RadioGroup
                value={roomType || ""}
                onValueChange={(value) =>
                  setRoomType(value as "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD")
                }
              >
                <div className="flex flex-col gap-2">
                  {["SINGLE", "DOUBLE", "TRIPLE", "QUAD"].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <RadioGroupItem value={type} id={type} />
                      <Label htmlFor={type} className="font-normal cursor-pointer">
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Pickup Location (for Inbound) */}
          {pickupLocations.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="pickupLocation">
                <MapPin className="inline h-4 w-4 mr-1" />
                Pickup Location
              </Label>
              <Select value={pickupLocation} onValueChange={setPickupLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pickup location" />
                </SelectTrigger>
                <SelectContent>
                  {pickupLocations.map((location: any) => (
                    <SelectItem key={location.id || location} value={location.id || location}>
                      {location.name || location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Transfer Options (for Inbound) */}
          {transferOptionsConfig.length > 0 && (
            <div className="space-y-2">
              <Label>Transfer Options</Label>
              <div className="space-y-2">
                {transferOptionsConfig.map((option: any) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={transferOptions.includes(option.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTransferOptions([...transferOptions, option.id]);
                        } else {
                          setTransferOptions(
                            transferOptions.filter((id) => id !== option.id)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={option.id}
                      className="font-normal cursor-pointer flex-1"
                    >
                      {option.name}
                      {option.price && (
                        <span className="text-muted-foreground ml-2">
                          (+{formatCurrency(option.price, packageData.currency)})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Travelers */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Travelers
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adults">Adults *</Label>
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
                <Label htmlFor="children">Children</Label>
                <Input
                  id="children"
                  type="number"
                  min="0"
                  value={numberOfChildren}
                  onChange={(e) =>
                    setNumberOfChildren(Math.max(0, parseInt(e.target.value) || 0))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="infants">Infants</Label>
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
            </div>
          </div>

          {/* Add-ons */}
          {packageData.addons.length > 0 && (
            <div className="space-y-2">
              <Label>Add-ons</Label>
              <div className="space-y-2">
                {packageData.addons.map((addon: any) => (
                  <div key={addon.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={addon.id}
                      checked={selectedAddonIds.includes(addon.id)}
                      disabled={addon.isRequired}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAddonIds([...selectedAddonIds, addon.id]);
                        } else {
                          setSelectedAddonIds(
                            selectedAddonIds.filter((id) => id !== addon.id)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={addon.id}
                      className="font-normal cursor-pointer flex-1"
                    >
                      {addon.name}
                      {addon.isRequired && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Required
                        </Badge>
                      )}
                      <span className="text-muted-foreground ml-2">
                        {formatCurrency(Number(addon.price), addon.currency)}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting || !hotelOptionId || !roomType}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Book Now"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

