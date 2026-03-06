"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Hotel } from "@/services/hotels/types";
import { formatCurrency } from "@/lib/utils";

interface HotelMapViewProps {
  hotels: Hotel[];
  selectedHotelId?: string;
  onHotelClick?: (hotel: Hotel) => void;
  className?: string;
}

export function HotelMapView({
  hotels,
  selectedHotelId,
  onHotelClick,
  className,
}: HotelMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  const buttonTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const bounceTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isMountedRef = useRef(true);

  const clearMapArtifacts = () => {
    listenersRef.current.forEach((listener) => listener.remove());
    listenersRef.current = [];
    infoWindowsRef.current.forEach((iw) => iw.close());
    infoWindowsRef.current = [];
    markers.forEach((marker) => {
      marker.setAnimation(null);
      marker.setMap(null);
    });
    buttonTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    buttonTimeoutsRef.current = [];
    bounceTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    bounceTimeoutsRef.current = [];
    if (isMountedRef.current) {
      setMarkers([]);
    }
  };

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) {
      console.warn("Google Maps API key not configured");
      return;
    }

    import("@/lib/google-maps-loader").then(({ loadGoogleMapsScript }) => {
      loadGoogleMapsScript(apiKey, ["places"])
        .then(initializeMap)
        .catch((error) => {
          console.error("Failed to load Google Maps:", error);
        });
    });
  }, [apiKey]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearMapArtifacts();
    };
  }, []);

  // Initialize map
  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;
    clearMapArtifacts();

    const hotelsWithCoords = hotels.filter(
      (h) => h.latitude !== null && h.longitude !== null
    );

    if (hotelsWithCoords.length === 0) return;

    // Calculate bounds
    const bounds = new window.google.maps.LatLngBounds();
    hotelsWithCoords.forEach((hotel) => {
      if (hotel.latitude && hotel.longitude) {
        bounds.extend(
          new window.google.maps.LatLng(hotel.latitude, hotel.longitude)
        );
      }
    });

    // Create map
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: bounds.getCenter(),
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    // Fit bounds
    mapInstance.fitBounds(bounds);

    setMap(mapInstance);

    // Create markers
    const markerInstances: google.maps.Marker[] = [];
    const infoWindowInstances: google.maps.InfoWindow[] = [];

    hotelsWithCoords.forEach((hotel) => {
      if (!hotel.latitude || !hotel.longitude) return;

      const marker = new window.google.maps.Marker({
        position: { lat: hotel.latitude, lng: hotel.longitude },
        map: mapInstance,
        title: hotel.name,
        animation: selectedHotelId === hotel.id ? window.google.maps.Animation.BOUNCE : undefined,
      });

      const price = hotel.priceRange?.min || null;
      const priceText = price
        ? formatCurrency(price, hotel.currency)
        : "Price on request";

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${hotel.name}</h3>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">${hotel.address || `${hotel.city}, ${hotel.country}`}</p>
            <p style="margin: 4px 0; font-size: 14px; font-weight: bold; color: #0066cc;">${priceText}</p>
            <button id="hotel-${hotel.id}" style="margin-top: 8px; padding: 6px 12px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">View Details</button>
          </div>
        `,
      });

      const markerClickListener = marker.addListener("click", () => {
        // Close all info windows
        infoWindowInstances.forEach((iw) => iw.close());
        infoWindow.open(mapInstance, marker);
        onHotelClick?.(hotel);
      });
      listenersRef.current.push(markerClickListener);

      // Add click listener to button in info window
      const infoButtonListener = marker.addListener("click", () => {
        const timeout = setTimeout(() => {
          if (!isMountedRef.current) return;
          const button = document.getElementById(`hotel-${hotel.id}`);
          if (button) {
            button.onclick = () => {
              onHotelClick?.(hotel);
            };
          }
        }, 100);
        buttonTimeoutsRef.current.push(timeout);
      });
      listenersRef.current.push(infoButtonListener);

      markerInstances.push(marker);
      infoWindowInstances.push(infoWindow);
    });

    infoWindowsRef.current = infoWindowInstances;
    setMarkers(markerInstances);
  };

  // Update markers when hotels or selectedHotelId changes
  useEffect(() => {
    if (!map || markers.length === 0) return;

    markers.forEach((marker, index) => {
      const hotel = hotels[index];
      if (!hotel) return;

      if (selectedHotelId === hotel.id) {
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        const timeout = setTimeout(() => {
          if (!isMountedRef.current) return;
          marker.setAnimation(null);
        }, 2000);
        bounceTimeoutsRef.current.push(timeout);
        
        // Center map on selected hotel
        if (hotel.latitude && hotel.longitude) {
          map.setCenter({ lat: hotel.latitude, lng: hotel.longitude });
          map.setZoom(15);
        }
      } else {
        marker.setAnimation(null);
      }
    });
  }, [selectedHotelId, hotels, map, markers]);

  if (!apiKey) {
    return (
      <Card className={className}>
        <div className="h-full flex items-center justify-center p-8 text-muted-foreground">
          Google Maps API key not configured
        </div>
      </Card>
    );
  }

  const hotelsWithCoords = hotels.filter(
    (h) => h.latitude !== null && h.longitude !== null
  );

  if (hotelsWithCoords.length === 0) {
    return (
      <Card className={className}>
        <div className="h-full flex items-center justify-center p-8 text-muted-foreground">
          No hotels with location data available
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div ref={mapRef} className="w-full h-full min-h-[500px] rounded-lg" />
    </Card>
  );
}

