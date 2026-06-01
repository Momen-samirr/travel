"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface Hotel {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  address?: string | null;
  city: string;
  country: string;
  placeId?: string | null;
  googleMapsIframe?: string | null;
}

interface HotelMapProps {
  hotels: Hotel[];
}

function extractIframeSrc(iframe: string | null): string | null {
  if (!iframe) return null;

  const srcMatch = iframe.match(/src=["']([^"']+)["']/i);
  const src = srcMatch?.[1] || iframe;

  if (!src.includes("google.com/maps/embed")) {
    return null;
  }

  return src.replaceAll("&amp;", "&");
}
export function HotelMap({ hotels }: HotelMapProps) {
  const searchParams = useSearchParams();
  const selectedHotelOptionId = searchParams.get("hotelOptionId");

  const visibleHotels = useMemo(() => {
    if (!selectedHotelOptionId) return hotels;
    return hotels.filter((hotel) => hotel.id === selectedHotelOptionId);
  }, [hotels, selectedHotelOptionId]);

  const hotelWithMap = visibleHotels.find((hotel) =>
    extractIframeSrc(hotel.googleMapsIframe),
  );

  const iframeSrc = extractIframeSrc(hotelWithMap?.googleMapsIframe || null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Hotel Location
        </CardTitle>
      </CardHeader>

      <CardContent>
        {iframeSrc ? (
          <div className="relative w-full h-96 rounded-lg overflow-hidden border">
            <iframe
              src={iframeSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No Google Maps iframe has been added for this hotel.
          </div>
        )}

        <div className="mt-4 space-y-2">
          {visibleHotels.map((hotel) => (
            <div key={hotel.id} className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <strong>{hotel.name}</strong> - {hotel.address}, {hotel.city},{" "}
                {hotel.country}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
