"use client";

import { useState, useMemo } from "react";
import { FlightResultCard } from "./flight-result-card";
import { FilterSidebar } from "./filter-sidebar";
import { SortDropdown } from "./sort-dropdown";
import { EmptyState } from "./empty-state";
import { sortFlights, filterFlights, type FlightOffer } from "@/lib/flight-utils";

interface FlightResultsListProps {
  flights: FlightOffer[];
  loading?: boolean;
  onSelectFlight?: (flight: FlightOffer) => void;
}

export function FlightResultsList({
  flights,
  loading = false,
  onSelectFlight,
}: FlightResultsListProps) {
  const [sortBy, setSortBy] = useState<"price" | "duration" | "departure">("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState({
    airlines: [] as string[],
    maxStops: undefined as number | undefined,
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    departureTimeRange: undefined as { start: number; end: number } | undefined,
  });

  console.log("[FlightResultsList] Received flights:", {
    count: flights.length,
    isArray: Array.isArray(flights),
    sample: flights.length > 0 ? flights[0] : null,
  });

  const filteredFlights = useMemo(() => {
    const filtered = filterFlights(flights, filters);
    console.log("[FlightResultsList] Filtered flights:", {
      original: flights.length,
      filtered: filtered.length,
    });
    return filtered;
  }, [flights, filters]);

  const sortedFlights = useMemo(() => {
    const sorted = sortFlights(filteredFlights, sortBy, sortOrder);
    console.log("[FlightResultsList] Sorted flights:", {
      filtered: filteredFlights.length,
      sorted: sorted.length,
    });
    return sorted;
  }, [filteredFlights, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (flights.length === 0) {
    console.log("[FlightResultsList] No flights to display, showing empty state");
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <FilterSidebar flights={flights} onFilterChange={setFilters} />
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-3 space-y-4">
        {/* Sort and Results Count */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {sortedFlights.length} flight{sortedFlights.length !== 1 ? "s" : ""} found
            {filteredFlights.length !== flights.length && (
              <span className="ml-1">
                (filtered from {flights.length} total)
              </span>
            )}
          </div>
          <SortDropdown
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
          />
        </div>

        {/* Flight Cards */}
        {sortedFlights.length === 0 ? (
          <EmptyState message="No flights match your filters. Try adjusting your search criteria." />
        ) : (
          <div className="space-y-4">
            {sortedFlights.map((flight) => (
              <FlightResultCard
                key={flight.id}
                flight={flight}
                onSelect={onSelectFlight}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

