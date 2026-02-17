"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
}

interface HotelMapProps {
  hotels: Hotel[];
}

export function HotelMap({ hotels }: HotelMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const mapInitializedRef = useRef(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const validHotels = useMemo(
    () => hotels.filter((h) => h.latitude !== null && h.longitude !== null),
    [hotels]
  );

  const validHotelsLength = validHotels.length;

  useEffect(() => {
    if (!apiKey || validHotelsLength === 0) return;

    import("@/lib/google-maps-loader").then(({ loadGoogleMapsScript }) => {
      loadGoogleMapsScript(apiKey)
        .then(() => setMapLoaded(true))
        .catch((error) => {
          console.error("Failed to load Google Maps:", error);
        });
    });
  }, [apiKey, validHotelsLength]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google || validHotelsLength === 0) return;
    
    // Prevent re-initialization if map is already initialized
    if (mapInitializedRef.current) return;

    const bounds = new window.google.maps.LatLngBounds();
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      mapTypeControl: true,
      streetViewControl: true,
    });

    const markerInstances: google.maps.Marker[] = [];

    validHotels.forEach((hotel) => {
      if (hotel.latitude && hotel.longitude) {
        const position = {
          lat: hotel.latitude,
          lng: hotel.longitude,
        };

        bounds.extend(position);

        const marker = new window.google.maps.Marker({
          position,
          map: mapInstance,
          title: hotel.name,
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-weight: bold;">${hotel.name}</h3>
              <p style="margin: 0; color: #666; font-size: 12px;">${hotel.address}</p>
              <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">${hotel.city}, ${hotel.country}</p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(mapInstance, marker);
        });

        markerInstances.push(marker);
      }
    });

    if (validHotels.length > 0) {
      mapInstance.fitBounds(bounds);
      if (validHotels.length === 1) {
        mapInstance.setZoom(15);
      }
    }

    mapInitializedRef.current = true;
    setMap(mapInstance);
    setMarkers(markerInstances);
  }, [mapLoaded, validHotelsLength]); // Only primitive values for stable dependency array

  if (!apiKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Hotel Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Google Maps API key not configured. Hotel locations cannot be displayed on map.
          </div>
          <div className="mt-4 space-y-2">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="text-sm">
                <strong>{hotel.name}</strong> - {hotel.address}, {hotel.city}, {hotel.country}
                {hotel.latitude && hotel.longitude && (
                  <span className="text-muted-foreground ml-2">
                    ({hotel.latitude.toFixed(4)}, {hotel.longitude.toFixed(4)})
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (validHotels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Hotel Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            No hotels with location data available for this package.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Hotel Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-96 rounded-lg overflow-hidden border">
          <div ref={mapRef} className="w-full h-full" />
        </div>
        <div className="mt-4 space-y-2">
          {hotels.map((hotel) => (
            <div key={hotel.id} className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <strong>{hotel.name}</strong> - {hotel.address}, {hotel.city}, {hotel.country}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

declare global {
  interface Window {
    google: typeof google;
  }
}

