"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, X } from "lucide-react";

interface GoogleMapsPickerProps {
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  address: string;
  city: string;
  country: string;
  onLocationChange: (data: {
    latitude: number | null;
    longitude: number | null;
    placeId: string | null;
    address: string;
    city: string;
    country: string;
  }) => void;
}

export function GoogleMapsPicker({
  latitude,
  longitude,
  placeId,
  address,
  city,
  country,
  onLocationChange,
}: GoogleMapsPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      console.warn("Google Maps API key not found. Using manual input fallback.");
      return;
    }

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [apiKey]);

  useEffect(() => {
    if (!mapLoaded || !autocompleteRef.current || !window.google) return;

    const autocompleteInstance = new window.google.maps.places.Autocomplete(
      autocompleteRef.current,
      {
        types: ["establishment", "geocode"],
        fields: ["geometry", "formatted_address", "place_id", "address_components"],
      }
    );

    autocompleteInstance.addListener("place_changed", () => {
      const place = autocompleteInstance.getPlace();
      if (!place.geometry || !place.geometry.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const placeId = place.place_id || null;
      const formattedAddress = place.formatted_address || "";

      let city = "";
      let country = "";

      if (place.address_components) {
        place.address_components.forEach((component) => {
          if (component.types.includes("locality")) {
            city = component.long_name;
          }
          if (component.types.includes("country")) {
            country = component.long_name;
          }
        });
      }

      onLocationChange({
        latitude: lat,
        longitude: lng,
        placeId,
        address: formattedAddress,
        city,
        country,
      });

      if (map) {
        map.setCenter({ lat, lng });
        map.setZoom(15);
      }

      if (marker) {
        marker.setPosition({ lat, lng });
      } else if (map) {
        const newMarker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          draggable: true,
        });

        newMarker.addListener("dragend", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            onLocationChange({
              latitude: lat,
              longitude: lng,
              placeId: null,
              address: `${lat}, ${lng}`,
              city,
              country,
            });
          }
        });

        setMarker(newMarker);
      }
    });

    setAutocomplete(autocompleteInstance);
  }, [mapLoaded, map, marker, city, country, onLocationChange]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google) return;

    const initialLat = latitude || 30.0444;
    const initialLng = longitude || 31.2357;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: initialLat, lng: initialLng },
      zoom: latitude && longitude ? 15 : 10,
      mapTypeControl: true,
      streetViewControl: true,
    });

    if (latitude && longitude) {
      const markerInstance = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapInstance,
        draggable: true,
      });

      markerInstance.addListener("dragend", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          onLocationChange({
            latitude: lat,
            longitude: lng,
            placeId: null,
            address,
            city,
            country,
          });
        }
      });

      setMarker(markerInstance);
    }

    mapInstance.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onLocationChange({
          latitude: lat,
          longitude: lng,
          placeId: null,
          address: `${lat}, ${lng}`,
          city,
          country,
        });

        if (marker) {
          marker.setPosition({ lat, lng });
        } else {
          const newMarker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstance,
            draggable: true,
          });
          newMarker.addListener("dragend", (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              onLocationChange({
                latitude: lat,
                longitude: lng,
                placeId: null,
                address,
                city,
                country,
              });
            }
          });
          setMarker(newMarker);
        }
      }
    });

    setMap(mapInstance);
  }, [mapLoaded]);

  const clearLocation = () => {
    onLocationChange({
      latitude: null,
      longitude: null,
      placeId: null,
      address: "",
      city: "",
      country: "",
    });
    if (marker) {
      marker.setMap(null);
      setMarker(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location (Google Maps)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {apiKey ? (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Search for Location
              </label>
              <Input
                ref={autocompleteRef}
                type="text"
                placeholder="Search for hotel location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative w-full h-64 rounded-lg overflow-hidden border">
              <div ref={mapRef} className="w-full h-full" />
            </div>
            {(latitude || longitude) && (
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="text-sm">
                  <div>
                    <strong>Lat:</strong> {latitude?.toFixed(6)}
                  </div>
                  <div>
                    <strong>Lng:</strong> {longitude?.toFixed(6)}
                  </div>
                  {placeId && (
                    <div className="text-xs text-muted-foreground">
                      Place ID: {placeId.substring(0, 20)}...
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearLocation}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Google Maps API key not configured. Please enter coordinates manually.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="any"
                  value={latitude || ""}
                  onChange={(e) =>
                    onLocationChange({
                      latitude: e.target.value ? parseFloat(e.target.value) : null,
                      longitude,
                      placeId,
                      address,
                      city,
                      country,
                    })
                  }
                  placeholder="e.g., 30.0444"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="any"
                  value={longitude || ""}
                  onChange={(e) =>
                    onLocationChange({
                      latitude,
                      longitude: e.target.value ? parseFloat(e.target.value) : null,
                      placeId,
                      address,
                      city,
                      country,
                    })
                  }
                  placeholder="e.g., 31.2357"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

declare global {
  interface Window {
    google: typeof google;
  }
}

