"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Search, Loader2, MapPin } from "lucide-react";
import { AirportAutocomplete } from "@/components/flights/airport-autocomplete";
import { useToast } from "@/hooks/use-toast";
import { Hotel } from "@/services/hotels/types";

interface AmadeusHotelSearchProps {
  onHotelsFound: (hotels: Hotel[]) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function AmadeusHotelSearch({
  onHotelsFound,
  onLoadingChange,
}: AmadeusHotelSearchProps) {
  const { toast } = useToast();
  const [cityCode, setCityCode] = useState("");
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [loading, setLoading] = useState(false);

  // Set default dates (today + 1 day for check-in, today + 2 days for check-out)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const dayAfterStr = dayAfter.toISOString().split("T")[0];
    
    if (!checkInDate) {
      setCheckInDate(tomorrowStr);
    }
    if (!checkOutDate) {
      setCheckOutDate(dayAfterStr);
    }
  }, []);

  const handleSearch = async () => {
    if (!cityCode) {
      toast({
        title: "City Required",
        description: "Please select a city",
        variant: "destructive",
      });
      return;
    }

    if (!checkInDate || !checkOutDate) {
      toast({
        title: "Dates Required",
        description: "Please select check-in and check-out dates",
        variant: "destructive",
      });
      return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      toast({
        title: "Invalid Dates",
        description: "Check-out date must be after check-in date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    onLoadingChange?.(true);

    try {
      const params = new URLSearchParams({
        cityCode,
        checkInDate,
        checkOutDate,
        adults: adults.toString(),
        currencyCode: "EGP",
      });

      if (children > 0) {
        params.append("children", children.toString());
      }

      const response = await fetch(`/api/amadeus/hotels/search?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to search hotels");
      }

      const data = await response.json();
      onHotelsFound(data.hotels || []);
      
      if (data.hotels && data.hotels.length === 0) {
        toast({
          title: "No Hotels Found",
          description: "No hotels found for your search criteria",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Error searching hotels:", error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search hotels. Please try again.",
        variant: "destructive",
      });
      onHotelsFound([]);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <AirportAutocomplete
              value={cityCode}
              onChange={setCityCode}
              onSelect={(airport) => {
                setSelectedCity(airport);
                setCityCode(airport.iataCode);
              }}
              placeholder="Search city"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkIn">
              <Calendar className="inline h-4 w-4 mr-1" />
              Check-in
            </Label>
            <Input
              id="checkIn"
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkOut">
              <Calendar className="inline h-4 w-4 mr-1" />
              Check-out
            </Label>
            <Input
              id="checkOut"
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              min={checkInDate || new Date().toISOString().split("T")[0]}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests">
              <Users className="inline h-4 w-4 mr-1" />
              Guests
            </Label>
            <div className="flex gap-2">
              <Input
                id="adults"
                type="number"
                min="1"
                value={adults}
                onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="Adults"
                disabled={loading}
                className="flex-1"
              />
              <Input
                id="children"
                type="number"
                min="0"
                value={children}
                onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Children"
                disabled={loading}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSearch}
            disabled={loading || !cityCode || !checkInDate || !checkOutDate}
            className="w-full md:w-auto"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Hotels
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

