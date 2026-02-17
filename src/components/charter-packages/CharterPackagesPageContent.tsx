"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CharterPackageFiltersSidebar } from "./filters/CharterPackageFiltersSidebar";
import { CharterPackageCard } from "./package-card";
import { CharterPackageFilters } from "@/lib/validations/charter-package-filters";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Loader2, Filter, X } from "lucide-react";
import { StaggerList } from "@/components/motion/stagger-list";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PackageType } from "@/services/packages/types";

interface PackageData {
  id: string;
  name: string;
  slug: string;
  destinationCountry: string;
  destinationCity: string;
  nights: number;
  days: number;
  mainImage: string | null;
  basePrice: number | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  currency: string;
  discount: number | null;
  _count?: {
    departureOptions: number;
    hotelOptions: number;
    bookings?: number;
  };
}

interface FilterOptions {
  countries: string[];
  cities: Record<string, string[]>;
  priceRange: { min: number; max: number; currency: string };
  durationRange: { minNights: number; maxNights: number; minDays: number; maxDays: number };
  hotelRatings: number[];
  packageTypes: PackageType[];
}

export function CharterPackagesPageContent({
  initialPackages,
  initialTotal,
  initialPage,
  initialFilterOptions,
}: {
  initialPackages: PackageData[];
  initialTotal: number;
  initialPage: number;
  initialFilterOptions?: FilterOptions;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse filters from URL
  const parseFiltersFromURL = useCallback((): CharterPackageFilters => {
    const filters: CharterPackageFilters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: 12,
      sortBy: (searchParams.get("sortBy") as any) || "newest",
      hotelRating: [],
    };

    if (searchParams.get("destinationCountry")) {
      filters.destinationCountry = searchParams.get("destinationCountry") || undefined;
    }
    if (searchParams.get("destinationCity")) {
      filters.destinationCity = searchParams.get("destinationCity") || undefined;
    }
    if (searchParams.get("minPrice")) {
      filters.minPrice = parseInt(searchParams.get("minPrice") || "0");
    }
    if (searchParams.get("maxPrice")) {
      filters.maxPrice = parseInt(searchParams.get("maxPrice") || "0");
    }
    if (searchParams.get("minNights")) {
      filters.minNights = parseInt(searchParams.get("minNights") || "0");
    }
    if (searchParams.get("maxNights")) {
      filters.maxNights = parseInt(searchParams.get("maxNights") || "0");
    }
    if (searchParams.get("minDays")) {
      filters.minDays = parseInt(searchParams.get("minDays") || "0");
    }
    if (searchParams.get("maxDays")) {
      filters.maxDays = parseInt(searchParams.get("maxDays") || "0");
    }
    if (searchParams.get("departureDateFrom")) {
      filters.departureDateFrom = searchParams.get("departureDateFrom") || undefined;
    }
    if (searchParams.get("departureDateTo")) {
      filters.departureDateTo = searchParams.get("departureDateTo") || undefined;
    }
    if (searchParams.get("hotelRating")) {
      filters.hotelRating = searchParams
        .get("hotelRating")
        ?.split(",")
        .map(Number)
        .filter((n) => !isNaN(n)) || [];
    }
    if (searchParams.get("packageType")) {
      filters.packageType = searchParams.get("packageType") as any;
    }

    return filters;
  }, [searchParams]);

  const [filters, setFilters] = useState<CharterPackageFilters>(parseFiltersFromURL);
  const [packages, setPackages] = useState<PackageData[]>(initialPackages);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | undefined>(
    initialFilterOptions
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Debounce function
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }, []);

  // Update URL with filters
  const updateURL = useCallback(
    (newFilters: CharterPackageFilters) => {
      const params = new URLSearchParams();
      
      if (newFilters.destinationCountry) {
        params.set("destinationCountry", newFilters.destinationCountry);
      }
      if (newFilters.destinationCity) {
        params.set("destinationCity", newFilters.destinationCity);
      }
      if (newFilters.minPrice !== undefined && newFilters.minPrice !== null) {
        params.set("minPrice", newFilters.minPrice.toString());
      }
      if (newFilters.maxPrice !== undefined && newFilters.maxPrice !== null) {
        params.set("maxPrice", newFilters.maxPrice.toString());
      }
      if (newFilters.minNights !== undefined && newFilters.minNights !== null) {
        params.set("minNights", newFilters.minNights.toString());
      }
      if (newFilters.maxNights !== undefined && newFilters.maxNights !== null) {
        params.set("maxNights", newFilters.maxNights.toString());
      }
      if (newFilters.minDays !== undefined && newFilters.minDays !== null) {
        params.set("minDays", newFilters.minDays.toString());
      }
      if (newFilters.maxDays !== undefined && newFilters.maxDays !== null) {
        params.set("maxDays", newFilters.maxDays.toString());
      }
      if (newFilters.departureDateFrom) {
        params.set("departureDateFrom", newFilters.departureDateFrom);
      }
      if (newFilters.departureDateTo) {
        params.set("departureDateTo", newFilters.departureDateTo);
      }
      if (newFilters.hotelRating && newFilters.hotelRating.length > 0) {
        params.set("hotelRating", newFilters.hotelRating.join(","));
      }
      if (newFilters.packageType) {
        params.set("packageType", newFilters.packageType);
      }
      if (newFilters.sortBy && newFilters.sortBy !== "newest") {
        params.set("sortBy", newFilters.sortBy);
      }
      if (newFilters.page && newFilters.page > 1) {
        params.set("page", newFilters.page.toString());
      }

      router.push(`/charter-packages?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  // Fetch packages with filters
  const fetchPackages = useCallback(
    async (filterParams: CharterPackageFilters) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            if (Array.isArray(value)) {
              if (value.length > 0) {
                queryParams.set(key, value.join(","));
              }
            } else {
              queryParams.set(key, value.toString());
            }
          }
        });

        const response = await fetch(`/api/charter-packages?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch packages");
        }
        const data = await response.json();
        setPackages(data.packages);
        setTotal(data.pagination.total);
        setPage(data.pagination.page);
      } catch (error) {
        console.error("Error fetching packages:", error);
        setPackages([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced fetch function
  const debouncedFetch = useMemo(
    () => debounce((filterParams: CharterPackageFilters) => {
      fetchPackages(filterParams);
      updateURL(filterParams);
    }, 300),
    [debounce, fetchPackages, updateURL]
  );

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: CharterPackageFilters) => {
      setFilters(newFilters);
      setPage(1); // Reset to first page on filter change
      debouncedFetch({ ...newFilters, page: 1 });
    },
    [debouncedFetch]
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (sortBy: string) => {
      const newFilters = { ...filters, sortBy: sortBy as any, page: 1 };
      setFilters(newFilters);
      setPage(1);
      debouncedFetch(newFilters);
    },
    [filters, debouncedFetch]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      const newFilters = { ...filters, page: newPage };
      setFilters(newFilters);
      setPage(newPage);
      fetchPackages(newFilters);
      updateURL(newFilters);
    },
    [filters, fetchPackages, updateURL]
  );

  // Load filter options on mount
  useEffect(() => {
    if (!filterOptions) {
      fetch("/api/charter-packages/filters")
        .then((res) => res.json())
        .then((data) => setFilterOptions(data))
        .catch((error) => console.error("Failed to fetch filter options:", error));
    }
  }, [filterOptions]);

  const totalPages = Math.ceil(total / (filters.limit || 12));

  const FilterSidebar = (
    <CharterPackageFiltersSidebar
      filters={filters}
      onFiltersChange={handleFiltersChange}
      filterOptions={filterOptions}
    />
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-1">
          {FilterSidebar}
        </aside>

        {/* Mobile Filter Button */}
        <div className="lg:hidden">
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4">{FilterSidebar}</div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sort and Results Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                {loading ? "Loading..." : `${total} Package${total !== 1 ? "s" : ""} Found`}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={filters.sortBy || "newest"}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="duration_asc">Duration: Shortest</SelectItem>
                  <SelectItem value="duration_desc">Duration: Longest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : packages.length > 0 ? (
            <>
              <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <CharterPackageCard key={pkg.id} package={pkg} />
                ))}
              </StaggerList>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-bold mb-2">No Packages Found</h2>
              <p className="text-muted-foreground">
                Try adjusting your filters to see more results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

