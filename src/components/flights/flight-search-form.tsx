"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AirportAutocomplete } from "./airport-autocomplete";
import { Calendar, Users, Plane, Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Airport {
  iataCode: string;
  name: string;
  cityName?: string;
  countryName?: string;
  type: string;
}

interface FlightSearchFormProps {
  onSearch: (params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children: number;
    infants: number;
    travelClass?: string;
  }) => void;
  loading?: boolean;
  initialValues?: {
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    adults?: number;
    children?: number;
    infants?: number;
    travelClass?: string;
  };
}

export function FlightSearchForm({ onSearch, loading = false, initialValues }: FlightSearchFormProps) {
  const [tripType, setTripType] = useState<"round" | "oneway">(
    initialValues?.returnDate ? "round" : "oneway"
  );
  const [origin, setOrigin] = useState(initialValues?.origin || "");
  const [destination, setDestination] = useState(initialValues?.destination || "");
  const [departureDate, setDepartureDate] = useState(
    initialValues?.departureDate || ""
  );
  const [returnDate, setReturnDate] = useState(initialValues?.returnDate || "");
  const [adults, setAdults] = useState(initialValues?.adults?.toString() || "1");
  const [children, setChildren] = useState(initialValues?.children?.toString() || "0");
  const [infants, setInfants] = useState(initialValues?.infants?.toString() || "0");
  const [travelClass, setTravelClass] = useState(initialValues?.travelClass || "ECONOMY");

  const [originAirport, setOriginAirport] = useState<Airport | null>(null);
  const [destinationAirport, setDestinationAirport] = useState<Airport | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split("T")[0];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!origin) {
      newErrors.origin = "Origin is required";
    } else if (origin.length !== 3) {
      newErrors.origin = "Origin must be a valid 3-character airport code";
    }

    if (!destination) {
      newErrors.destination = "Destination is required";
    } else if (destination.length !== 3) {
      newErrors.destination = "Destination must be a valid 3-character airport code";
    }

    if (origin === destination) {
      newErrors.destination = "Destination must be different from origin";
    }

    if (!departureDate) {
      newErrors.departureDate = "Departure date is required";
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(departureDate)) {
        newErrors.departureDate = "Invalid date format. Use YYYY-MM-DD";
      } else if (new Date(departureDate) < new Date(today)) {
        newErrors.departureDate = "Departure date cannot be in the past";
      }
    }

    if (tripType === "round" && !returnDate) {
      newErrors.returnDate = "Return date is required for round trip";
    } else if (tripType === "round" && returnDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(returnDate)) {
        newErrors.returnDate = "Invalid date format. Use YYYY-MM-DD";
      } else if (new Date(returnDate) <= new Date(departureDate)) {
        newErrors.returnDate = "Return date must be after departure date";
      }
    }

    if (parseInt(adults) < 1) {
      newErrors.adults = "At least 1 adult is required";
    }

    if (parseInt(children) < 0) {
      newErrors.children = "Number of children cannot be negative";
    }

    if (parseInt(infants) < 0) {
      newErrors.infants = "Number of infants cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      console.log("[FlightSearchForm] Validation failed:", errors);
      return;
    }

    const searchParams = {
      origin,
      destination,
      departureDate,
      returnDate: tripType === "round" ? returnDate : undefined,
      adults: parseInt(adults),
      children: parseInt(children),
      infants: parseInt(infants),
      travelClass: travelClass !== "ECONOMY" ? travelClass : undefined,
    };

    console.log("[FlightSearchForm] Submitting search with params:", searchParams);
    console.log("[FlightSearchForm] Origin airport:", originAirport);
    console.log("[FlightSearchForm] Destination airport:", destinationAirport);

    onSearch(searchParams);
  };

  const swapAirports = () => {
    const tempOrigin = origin;
    const tempDestination = destination;
    const tempOriginAirport = originAirport;
    const tempDestinationAirport = destinationAirport;

    setOrigin(tempDestination);
    setDestination(tempOrigin);
    setOriginAirport(tempDestinationAirport);
    setDestinationAirport(tempOriginAirport);
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={tripType === "round" ? "default" : "outline"}
              onClick={() => {
                setTripType("round");
                if (!returnDate && departureDate) {
                  const depDate = new Date(departureDate);
                  depDate.setDate(depDate.getDate() + 7);
                  setReturnDate(depDate.toISOString().split("T")[0]);
                }
              }}
              className="flex-1"
            >
              Round Trip
            </Button>
            <Button
              type="button"
              variant={tripType === "oneway" ? "default" : "outline"}
              onClick={() => {
                setTripType("oneway");
                setReturnDate("");
              }}
              className="flex-1"
            >
              One Way
            </Button>
          </div>

          {/* Origin and Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <AirportAutocomplete
                value={origin}
                onChange={(code) => {
                  setOrigin(code);
                  setErrors((prev) => ({ ...prev, origin: "" }));
                }}
                onSelect={(airport) => {
                  setOriginAirport(airport);
                  setOrigin(airport.iataCode);
                }}
                placeholder="From"
                label="From"
                error={errors.origin}
                disabled={loading}
              />
            </div>

            <div className="space-y-2 relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-1/2 top-8 transform -translate-x-1/2 z-10 bg-white border border-gray-200 hover:bg-gray-50"
                onClick={swapAirports}
                disabled={loading}
              >
                <Plane className="h-4 w-4 rotate-90" />
              </Button>
              <AirportAutocomplete
                value={destination}
                onChange={(code) => {
                  setDestination(code);
                  setErrors((prev) => ({ ...prev, destination: "" }));
                }}
                onSelect={(airport) => {
                  setDestinationAirport(airport);
                  setDestination(airport.iataCode);
                }}
                placeholder="To"
                label="To"
                error={errors.destination}
                disabled={loading}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departureDate">Departure Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="departureDate"
                  type="date"
                  value={departureDate}
                  onChange={(e) => {
                    setDepartureDate(e.target.value);
                    setErrors((prev) => ({ ...prev, departureDate: "" }));
                  }}
                  min={today}
                  disabled={loading}
                  className={cn("pl-10", errors.departureDate && "border-destructive")}
                />
              </div>
              {errors.departureDate && (
                <p className="text-sm text-destructive">{errors.departureDate}</p>
              )}
            </div>

            {tripType === "round" && (
              <div className="space-y-2">
                <Label htmlFor="returnDate">Return Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="returnDate"
                    type="date"
                    value={returnDate}
                    onChange={(e) => {
                      setReturnDate(e.target.value);
                      setErrors((prev) => ({ ...prev, returnDate: "" }));
                    }}
                    min={departureDate || today}
                    disabled={loading}
                    className={cn("pl-10", errors.returnDate && "border-destructive")}
                  />
                </div>
                {errors.returnDate && (
                  <p className="text-sm text-destructive">{errors.returnDate}</p>
                )}
              </div>
            )}
          </div>

          {/* Passengers and Cabin Class */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passengers">Passengers</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <div className="flex items-center gap-2 pl-10 border rounded-md px-3 py-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {parseInt(adults) + parseInt(children) + parseInt(infants)} Passenger
                      {parseInt(adults) + parseInt(children) + parseInt(infants) !== 1 ? "s" : ""}
                    </div>
                    <div className="text-xs text-gray-500">
                      {adults} Adult{adults !== "1" ? "s" : ""}
                      {parseInt(children) > 0 && `, ${children} Child${children !== "1" ? "ren" : ""}`}
                      {parseInt(infants) > 0 && `, ${infants} Infant${infants !== "1" ? "s" : ""}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={adults}
                      onValueChange={setAdults}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label htmlFor="children" className="text-xs">Children (2-11)</Label>
                  <Select value={children} onValueChange={setChildren} disabled={loading}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="infants" className="text-xs">Infants (under 2)</Label>
                  <Select value={infants} onValueChange={setInfants} disabled={loading}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cabinClass">Cabin Class</Label>
              <Select value={travelClass} onValueChange={setTravelClass} disabled={loading}>
                <SelectTrigger id="cabinClass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ECONOMY">Economy</SelectItem>
                  <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="FIRST">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Flights
              </>
            )}
          </Button>
        </form>
  );
}

