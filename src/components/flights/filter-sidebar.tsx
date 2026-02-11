"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { FlightOffer } from "@/lib/flight-utils";
import { getAirlineName } from "@/lib/flight-utils";

interface FilterSidebarProps {
  flights: FlightOffer[];
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  airlines: string[];
  maxStops: number | undefined;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  departureTimeRange: { start: number; end: number } | undefined;
}

export function FilterSidebar({ flights, onFilterChange }: FilterSidebarProps) {
  // Get unique airlines from flights
  const allAirlines = Array.from(
    new Set(flights.flatMap((f) => f.validatingAirlineCodes || []))
  ).sort();

  // Calculate price range
  const prices = flights.map((f) => parseFloat(f.price.total));
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 0);

  const [filters, setFilters] = useState<FilterState>({
    airlines: [],
    maxStops: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    departureTimeRange: undefined,
  });

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleAirlineToggle = (airline: string) => {
    setFilters((prev) => ({
      ...prev,
      airlines: prev.airlines.includes(airline)
        ? prev.airlines.filter((a) => a !== airline)
        : [...prev.airlines, airline],
    }));
  };

  const handleStopsChange = (maxStops: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      maxStops: prev.maxStops === maxStops ? undefined : maxStops,
    }));
  };

  const handleTimeRangeChange = (range: { start: number; end: number } | undefined) => {
    setFilters((prev) => ({
      ...prev,
      departureTimeRange: prev.departureTimeRange?.start === range?.start ? undefined : range,
    }));
  };

  const clearFilters = () => {
    setFilters({
      airlines: [],
      maxStops: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      departureTimeRange: undefined,
    });
  };

  const hasActiveFilters =
    filters.airlines.length > 0 ||
    filters.maxStops !== undefined ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.departureTimeRange !== undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Airlines */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Airlines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {allAirlines.map((airline) => (
            <div key={airline} className="flex items-center space-x-2">
              <Checkbox
                id={`airline-${airline}`}
                checked={filters.airlines.includes(airline)}
                onCheckedChange={() => handleAirlineToggle(airline)}
              />
              <Label
                htmlFor={`airline-${airline}`}
                className="text-sm font-normal cursor-pointer"
              >
                {getAirlineName(airline)}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stops */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Stops</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { value: 0, label: "Non-stop" },
            { value: 1, label: "1 stop" },
            { value: 2, label: "2+ stops" },
          ].map((stop) => (
            <div key={stop.value} className="flex items-center space-x-2">
              <Checkbox
                id={`stop-${stop.value}`}
                checked={filters.maxStops === stop.value}
                onCheckedChange={() => handleStopsChange(stop.value)}
              />
              <Label
                htmlFor={`stop-${stop.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {stop.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Price Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="minPrice" className="text-xs">Min</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder={minPrice.toFixed(0)}
                value={filters.minPrice || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    minPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="maxPrice" className="text-xs">Max</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder={maxPrice.toFixed(0)}
                value={filters.maxPrice || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departure Time */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Departure Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { start: 6, end: 12, label: "Morning (6:00 - 12:00)" },
            { start: 12, end: 18, label: "Afternoon (12:00 - 18:00)" },
            { start: 18, end: 24, label: "Evening (18:00 - 24:00)" },
            { start: 0, end: 6, label: "Night (0:00 - 6:00)" },
          ].map((range, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox
                id={`time-${index}`}
                checked={
                  filters.departureTimeRange?.start === range.start &&
                  filters.departureTimeRange?.end === range.end
                }
                onCheckedChange={() => handleTimeRangeChange(range)}
              />
              <Label
                htmlFor={`time-${index}`}
                className="text-sm font-normal cursor-pointer"
              >
                {range.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

