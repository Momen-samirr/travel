"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SignInButton } from "@clerk/nextjs";
import { LogIn, Users, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { DEFAULT_CURRENCY, normalizeCurrency } from "@/lib/currency";

interface InboundBookingFormProps {
  packageData: any;
}

export function InboundBookingForm({ packageData }: InboundBookingFormProps) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { toast } = useToast();

  const [numberOfAdults, setNumberOfAdults] = useState(1);
  const [numberOfChildren, setNumberOfChildren] = useState(0);
  const [numberOfInfants, setNumberOfInfants] = useState(0);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [pickupLocation, setPickupLocation] = useState<string>("");
  const [transferOptions, setTransferOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const packageCurrency = normalizeCurrency(packageData.currency || DEFAULT_CURRENCY);

  const offerPrice =
    Number(packageData.typeConfig?.offer?.currentPrice) ||
    Number(packageData.basePrice || packageData.priceRangeMin || 0);

  const transferOptionsConfig = packageData.typeConfig?.transferOptions || [];
  const pickupLocations = packageData.typeConfig?.pickupLocations || [];
  const totalTravelers = numberOfAdults + numberOfChildren + numberOfInfants;

  const selectedAddonsTotal = useMemo(() => {
    if (!Array.isArray(packageData.addons)) return 0;
    return packageData.addons.reduce((sum: number, addon: any) => {
      if (!selectedAddonIds.includes(addon.id)) return sum;
      return sum + Number(addon.price || 0) * totalTravelers;
    }, 0);
  }, [packageData.addons, selectedAddonIds, totalTravelers]);

  const selectedTransfersTotal = useMemo(() => {
    if (!Array.isArray(transferOptionsConfig)) return 0;
    return transferOptionsConfig.reduce((sum: number, option: any, index: number) => {
      const optionId = option?.id || `transfer-${index}`;
      if (!transferOptions.includes(optionId)) return sum;
      return sum + Number(option?.price || 0);
    }, 0);
  }, [transferOptions, transferOptionsConfig]);

  const baseComponentTotal = offerPrice * totalTravelers;
  const grandTotal = baseComponentTotal + selectedAddonsTotal + selectedTransfersTotal;

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

    setSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType: "CHARTER_PACKAGE",
          charterPackageId: packageData.id,
          numberOfGuests: numberOfAdults + numberOfChildren + numberOfInfants,
          numberOfAdults,
          numberOfChildren6to12: numberOfChildren,
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
            <Users className="h-5 w-5" />
            Book This Inbound Package
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Offer starts from</p>
            <p className="text-xl font-semibold">
              {formatCurrency(offerPrice, packageCurrency)}
            </p>
          </div>

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
                    <SelectItem
                      key={(location?.id || location) as string}
                      value={(location?.id || location) as string}
                    >
                      {location?.name || location}
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
                {transferOptionsConfig.map((option: any, index: number) => {
                  const optionId = option?.id || `transfer-${index}`;
                  const optionName = option?.name || optionId;
                  return (
                  <div key={optionId} className="flex items-center space-x-2">
                    <Checkbox
                      id={optionId}
                      checked={transferOptions.includes(optionId)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTransferOptions([...transferOptions, optionId]);
                        } else {
                          setTransferOptions(
                            transferOptions.filter((id) => id !== optionId)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={optionId}
                      className="font-normal cursor-pointer flex-1"
                    >
                      {optionName}
                      {option.price && (
                        <span className="text-muted-foreground ml-2">
                          (+{formatCurrency(option.price, packageCurrency)})
                        </span>
                      )}
                    </Label>
                  </div>
                )})}
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
                        {formatCurrency(
                          Number(addon.price),
                          normalizeCurrency(addon.currency || packageCurrency)
                        )}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Base ({totalTravelers} traveler{totalTravelers === 1 ? "" : "s"})
              </span>
              <span>{formatCurrency(baseComponentTotal, packageCurrency)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Add-ons</span>
              <span>{formatCurrency(selectedAddonsTotal, packageCurrency)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Transfers</span>
              <span>{formatCurrency(selectedTransfersTotal, packageCurrency)}</span>
            </div>
            <div className="border-t pt-2 flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(grandTotal, packageCurrency)}</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
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

