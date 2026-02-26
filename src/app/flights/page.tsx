"use client";

import { FlightSearchForm } from "@/components/flights/flight-search-form";
import { buildAosFlightSearchUrl } from "@/lib/aos-flight-redirect";
import { Plane, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function FlightsPage() {
  const handleRedirectToSearch = (params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children: number;
    infants: number;
    travelClass?: string;
  }) => {
    const url = buildAosFlightSearchUrl({
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      tripType: params.returnDate ? "round" : "oneway",
      travelClass: params.travelClass,
      adults: params.adults,
      children: params.children,
      infants: params.infants,
    });
    window.location.href = url;
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
              <p className="flex items-center gap-2 text-sm text-muted-foreground mb-6 rounded-md bg-muted/50 p-3">
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                You will be redirected to our flight booking partner to search and book. Flight search on this site uses a redirect-only integration (no Amadeus API).
              </p>
              <FlightSearchForm onSearch={handleRedirectToSearch} loading={false} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
