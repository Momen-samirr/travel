"use client";

import { useState } from "react";
import { FlightSearchForm } from "@/components/flights/flight-search-form";
import { FlightResultsList } from "@/components/flights/flight-results-list";
import { FlightLoadingSkeleton } from "@/components/flights/loading-skeleton";
import { EmptyState } from "@/components/flights/empty-state";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FlightOffer } from "@/lib/flight-utils";

export default function FlightsPage() {
  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async (params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children: number;
    infants: number;
    travelClass?: string;
  }) => {
    console.log("[FlightsPage] handleSearch called with params:", params);
    setLoading(true);
    setError(null);
    setSearchParams(params);
    setFlights([]); // Clear previous results

    try {
      const queryParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        adults: params.adults.toString(),
        children: params.children.toString(),
        infants: params.infants.toString(),
      });

      if (params.returnDate) {
        queryParams.append("returnDate", params.returnDate);
      }
      if (params.travelClass) {
        queryParams.append("travelClass", params.travelClass);
      }

      const apiUrl = `/api/amadeus/search?${queryParams.toString()}`;
      console.log("[FlightsPage] Making API request to:", apiUrl);
      console.log("[FlightsPage] Query params:", Object.fromEntries(queryParams.entries()));

      const response = await fetch(apiUrl);

      console.log("[FlightsPage] API response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[FlightsPage] API error response:", errorData);
        throw new Error(errorData.error || "Failed to search flights");
      }

      const data = await response.json();
      console.log("[FlightsPage] API response data structure:", {
        hasData: !!data.data,
        dataType: typeof data.data,
        dataIsArray: Array.isArray(data.data),
        dataLength: Array.isArray(data.data) ? data.data.length : "N/A",
        fullResponseKeys: Object.keys(data),
        fullResponse: JSON.stringify(data, null, 2).substring(0, 500), // First 500 chars for debugging
      });

      // Amadeus API returns { data: [...], meta: {...}, dictionaries: {...} }
      // Ensure we're accessing the correct property
      let flightOffers = [];
      if (Array.isArray(data.data)) {
        flightOffers = data.data;
      } else if (Array.isArray(data)) {
        // Handle case where response is directly an array
        flightOffers = data;
      } else if (data.flightOffers && Array.isArray(data.flightOffers)) {
        // Handle alternative response structure
        flightOffers = data.flightOffers;
      } else {
        console.warn("[FlightsPage] Unexpected response structure, attempting to extract flights");
        flightOffers = [];
      }
      console.log("[FlightsPage] Extracted flight offers:", flightOffers.length);
      
      if (flightOffers.length > 0) {
        console.log("[FlightsPage] First flight offer sample:", JSON.stringify(flightOffers[0], null, 2));
      }

      if (flightOffers.length === 0) {
        console.log("[FlightsPage] No flights found in response");
        toast({
          title: "No flights found",
          description: "Try adjusting your search criteria.",
          variant: "default",
        });
      } else {
        console.log("[FlightsPage] Setting flights state with", flightOffers.length, "flights");
        toast({
          title: "Search complete",
          description: `Found ${flightOffers.length} flight${flightOffers.length !== 1 ? "s" : ""}`,
          variant: "success",
        });
      }

      console.log("[FlightsPage] About to set flights state with", flightOffers.length, "flights");
      setFlights(flightOffers);
      console.log("[FlightsPage] Flights state updated");
      
      // Force a re-render check
      setTimeout(() => {
        console.log("[FlightsPage] State check - flights.length should be:", flightOffers.length);
      }, 100);
    } catch (err: any) {
      console.error("[FlightsPage] Error searching flights:", err);
      console.error("[FlightsPage] Error stack:", err.stack);
      const errorMessage = err.message || "An error occurred while searching for flights";
      setError(errorMessage);
      setFlights([]);
      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log("[FlightsPage] Search completed, loading set to false");
    }
  };

  const handleSelectFlight = (flight: FlightOffer) => {
    // Store flight offer and navigate to review page
    const offerId = flight.id;
    const { storeFlightBookingData } = require("@/lib/flight-booking");
    
    // Get search params from current search
    storeFlightBookingData(offerId, {
      offerId,
      flightOffer: flight,
      searchParams: searchParams || {
        origin: "",
        destination: "",
        departureDate: "",
        adults: 1,
        children: 0,
        infants: 0,
      },
      timestamp: Date.now(),
    });
    
    // Navigate to review page
    window.location.href = `/flights/${offerId}/review`;
  };

  const handleRetry = () => {
    if (searchParams) {
      handleSearch(searchParams);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-16 md:py-24">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/600')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <Plane className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-shadow-lg">
              Search Flights
            </h1>
            <p className="text-xl text-white/90 mb-8 text-shadow-md">
              Find the best flight deals for your next adventure
            </p>
          </div>
        </div>
      </section>

      {/* Search Form Section */}
      <section className="relative -mt-8 z-20">
        <div className="container mx-auto px-4">
          <Card className="shadow-2xl border-0">
            <CardContent className="p-6 md:p-8">
              <FlightSearchForm onSearch={handleSearch} loading={loading} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Results Section */}
      <section className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-7xl mx-auto">
          {/* Error State */}
          {error && (
            <Card className="mb-8 border-destructive/50 bg-destructive/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-destructive mb-1">Search Error</h3>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                  <Button variant="outline" onClick={handleRetry} size="sm">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Header */}
          {!loading && !error && flights.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1">
                {flights.length} Flight{flights.length !== 1 ? "s" : ""} Found
              </h2>
              {searchParams && (
                <p className="text-muted-foreground">
                  {searchParams.origin} → {searchParams.destination}
                </p>
              )}
            </div>
          )}

          {/* Results */}
          {!loading && !error && flights.length > 0 && (
            <FlightResultsList
              flights={flights}
              onSelectFlight={handleSelectFlight}
            />
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <FlightLoadingSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty State (after search) */}
          {!loading && !error && flights.length === 0 && searchParams && (
            <EmptyState
              message="No flights found for your search criteria. Try adjusting your dates or destinations."
              onRetry={handleRetry}
            />
          )}
        </div>
      </section>
    </div>
  );
}
