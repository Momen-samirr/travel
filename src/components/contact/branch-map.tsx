"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface BranchMapProps {
  latitude: number | null;
  longitude: number | null;
  branchName: string;
  address: string;
  className?: string;
}

export function BranchMap({
  latitude,
  longitude,
  branchName,
  address,
  className,
}: BranchMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const mapInitializedRef = useRef(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const hasValidCoordinates = latitude !== null && longitude !== null;

  useEffect(() => {
    if (!apiKey || !hasValidCoordinates) return;

    import("@/lib/google-maps-loader").then(({ loadGoogleMapsScript }) => {
      loadGoogleMapsScript(apiKey)
        .then(() => setMapLoaded(true))
        .catch((error) => {
          console.error("Failed to load Google Maps:", error);
        });
    });
  }, [apiKey, hasValidCoordinates]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google || !hasValidCoordinates) return;

    // Prevent re-initialization if map is already initialized
    if (mapInitializedRef.current) return;

    const position = {
      lat: latitude!,
      lng: longitude!,
    };

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: position,
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    const markerInstance = new window.google.maps.Marker({
      position,
      map: mapInstance,
      title: branchName,
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; font-weight: bold;">${branchName}</h3>
          <p style="margin: 0; color: #666; font-size: 12px;">${address}</p>
        </div>
      `,
    });

    markerInstance.addListener("click", () => {
      infoWindow.open(mapInstance, markerInstance);
    });

    setMap(mapInstance);
    setMarker(markerInstance);
    mapInitializedRef.current = true;
  }, [mapLoaded, latitude, longitude, branchName, address, hasValidCoordinates]);

  if (!hasValidCoordinates) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MapPin className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">Map location not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!apiKey) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MapPin className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">Google Maps API key not configured</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div
          ref={mapRef}
          className="w-full h-64 rounded-lg overflow-hidden"
          style={{ minHeight: "256px" }}
        />
      </CardContent>
    </Card>
  );
}


