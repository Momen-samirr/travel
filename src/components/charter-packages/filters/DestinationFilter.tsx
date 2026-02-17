"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DestinationFilterProps {
  countries: string[];
  citiesByCountry: Record<string, string[]>;
  selectedCountry?: string | null;
  selectedCity?: string | null;
  onCountryChange: (country: string | null) => void;
  onCityChange: (city: string | null) => void;
}

export function DestinationFilter({
  countries,
  citiesByCountry,
  selectedCountry,
  selectedCity,
  onCountryChange,
  onCityChange,
}: DestinationFilterProps) {
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    if (selectedCountry && citiesByCountry[selectedCountry]) {
      const cities = citiesByCountry[selectedCountry];
      setAvailableCities(cities);
      // Reset city when country changes and current city is not in new country's cities
      if (selectedCity && !cities.includes(selectedCity)) {
        onCityChange(null);
      }
    } else {
      setAvailableCities([]);
      // Reset city when country is cleared
      if (selectedCity) {
        onCityChange(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]); // Only depend on selectedCountry to avoid infinite loops

  const handleClear = () => {
    onCountryChange(null);
    onCityChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Country</Label>
        <Select
          value={selectedCountry || undefined}
          onValueChange={(value) => {
            onCountryChange(value || null);
            if (!value) {
              onCityChange(null);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCountry && availableCities.length > 0 && (
        <div className="space-y-2">
          <Label>City</Label>
          <Select
            value={selectedCity || undefined}
            onValueChange={(value) => onCityChange(value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All cities" />
            </SelectTrigger>
            <SelectContent>
              {availableCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(selectedCountry || selectedCity) && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear destination
        </Button>
      )}
    </div>
  );
}

