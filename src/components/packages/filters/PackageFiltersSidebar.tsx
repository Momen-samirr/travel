"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { FilterSection } from "@/components/charter-packages/filters/FilterSection";
import { DestinationFilter } from "@/components/charter-packages/filters/DestinationFilter";
import { DateRangeFilter } from "@/components/charter-packages/filters/DateRangeFilter";
import { DurationFilter } from "@/components/charter-packages/filters/DurationFilter";
import { PriceRangeFilter } from "@/components/charter-packages/filters/PriceRangeFilter";
import { HotelRatingFilter } from "@/components/charter-packages/filters/HotelRatingFilter";
import { PackageTypeFilter } from "@/components/charter-packages/filters/PackageTypeFilter";
import { ClearFiltersButton } from "@/components/charter-packages/filters/ClearFiltersButton";
import { MapPin, Calendar, Clock, DollarSign, Star, Package } from "lucide-react";
import { PackageType } from "@/services/packages/types";
import { CharterPackageFilters } from "@/lib/validations/charter-package-filters";

interface FilterOptions {
  countries: string[];
  cities: Record<string, string[]>;
  priceRange: { min: number; max: number; currency: string };
  durationRange: { minNights: number; maxNights: number; minDays: number; maxDays: number };
  hotelRatings: number[];
  packageTypes: PackageType[];
}

interface PackageFiltersSidebarProps {
  filters: CharterPackageFilters;
  onFiltersChange: (filters: CharterPackageFilters) => void;
  filterOptions?: FilterOptions;
}

export function PackageFiltersSidebar({
  filters,
  onFiltersChange,
  filterOptions,
}: PackageFiltersSidebarProps) {
  const [options, setOptions] = useState<FilterOptions | null>(filterOptions || null);
  const [loading, setLoading] = useState(!filterOptions);

  useEffect(() => {
    if (!filterOptions) {
      // Fetch filter options from unified packages endpoint
      fetch("/api/charter-packages/filters")
        .then((res) => res.json())
        .then((data) => {
          setOptions(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch filter options:", error);
          setLoading(false);
        });
    }
  }, [filterOptions]);

  const calculateActiveFilterCount = (): number => {
    let count = 0;
    if (filters.destinationCountry) count++;
    if (filters.destinationCity) count++;
    if (filters.minPrice !== undefined && filters.minPrice !== null) count++;
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) count++;
    if (filters.minNights !== undefined && filters.minNights !== null) count++;
    if (filters.maxNights !== undefined && filters.maxNights !== null) count++;
    if (filters.minDays !== undefined && filters.minDays !== null) count++;
    if (filters.maxDays !== undefined && filters.maxDays !== null) count++;
    if (filters.departureDateFrom) count++;
    if (filters.departureDateTo) count++;
    if (filters.hotelRating && filters.hotelRating.length > 0) count++;
    if (filters.packageType) count++;
    return count;
  };

  const handleClearAll = () => {
    onFiltersChange({
      ...filters,
      destinationCountry: undefined,
      destinationCity: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minNights: undefined,
      maxNights: undefined,
      minDays: undefined,
      maxDays: undefined,
      departureDateFrom: undefined,
      departureDateTo: undefined,
      hotelRating: [],
      packageType: undefined,
    });
  };

  if (loading || !options) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-bold">Filters</h2>
        <p className="text-sm text-muted-foreground">
          Refine your search results
        </p>
      </div>

      <FilterSection title="Destination" icon={<MapPin className="h-4 w-4" />}>
        <DestinationFilter
          countries={options.countries}
          citiesByCountry={options.cities}
          selectedCountry={filters.destinationCountry || null}
          selectedCity={filters.destinationCity || null}
          onCountryChange={(country) =>
            onFiltersChange({ ...filters, destinationCountry: country || undefined })
          }
          onCityChange={(city) =>
            onFiltersChange({ ...filters, destinationCity: city || undefined })
          }
        />
      </FilterSection>

      <FilterSection title="Travel Dates" icon={<Calendar className="h-4 w-4" />}>
        <DateRangeFilter
          dateFrom={filters.departureDateFrom || null}
          dateTo={filters.departureDateTo || null}
          onDateFromChange={(date) =>
            onFiltersChange({ ...filters, departureDateFrom: date || undefined })
          }
          onDateToChange={(date) =>
            onFiltersChange({ ...filters, departureDateTo: date || undefined })
          }
          onFlexibleDatesChange={() => {
            // Flexible dates logic can be implemented later
          }}
        />
      </FilterSection>

          <FilterSection title="Duration" icon={<Clock className="h-4 w-4" />}>
            <DurationFilter
              minNights={filters.minNights || null}
              maxNights={filters.maxNights || null}
              minDays={filters.minDays || null}
              maxDays={filters.maxDays || null}
              nightsRange={{
                min: options.durationRange.minNights,
                max: options.durationRange.maxNights,
              }}
              daysRange={{
                min: options.durationRange.minDays,
                max: options.durationRange.maxDays,
              }}
              onNightsChange={(min, max) =>
                onFiltersChange({
                  ...filters,
                  minNights: min || undefined,
                  maxNights: max || undefined,
                })
              }
              onDaysChange={(min, max) =>
                onFiltersChange({
                  ...filters,
                  minDays: min || undefined,
                  maxDays: max || undefined,
                })
              }
            />
          </FilterSection>

      <FilterSection title="Price Range" icon={<DollarSign className="h-4 w-4" />}>
        <PriceRangeFilter
          minPrice={filters.minPrice || null}
          maxPrice={filters.maxPrice || null}
          priceRange={options.priceRange}
          onPriceChange={(min, max) =>
            onFiltersChange({
              ...filters,
              minPrice: min || undefined,
              maxPrice: max || undefined,
            })
          }
        />
      </FilterSection>

      {options.hotelRatings.length > 0 && (
        <FilterSection title="Hotel Rating" icon={<Star className="h-4 w-4" />}>
          <HotelRatingFilter
            availableRatings={options.hotelRatings}
            selectedRatings={filters.hotelRating || []}
            onRatingsChange={(ratings) =>
              onFiltersChange({ ...filters, hotelRating: ratings })
            }
          />
        </FilterSection>
      )}

      {options.packageTypes.length > 0 && (
        <FilterSection title="Package Type" icon={<Package className="h-4 w-4" />}>
          <PackageTypeFilter
            availableTypes={options.packageTypes}
            selectedType={filters.packageType || null}
            onTypeChange={(type) =>
              onFiltersChange({ ...filters, packageType: type || undefined })
            }
          />
        </FilterSection>
      )}

      <div className="pt-4 border-t">
        <ClearFiltersButton
          onClear={handleClearAll}
          activeFilterCount={calculateActiveFilterCount()}
        />
      </div>
    </Card>
  );
}

