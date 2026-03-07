"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Package, Loader2, Filter } from "lucide-react";
import { StaggerList } from "@/components/motion/stagger-list";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PackageType } from "@/services/packages/types";

export interface PackageData {
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

export interface FilterOptions {
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
  type SortBy = NonNullable<CharterPackageFilters["sortBy"]>;
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  // Parse filters from URL
  const parseFiltersFromURL = useCallback((): CharterPackageFilters => {
    const params = new URLSearchParams(searchParamsKey);
    const filters: CharterPackageFilters = {
      page: parseInt(params.get("page") || "1"),
      limit: 12,
      sortBy: (params.get("sortBy") as SortBy) || "newest",
      hotelRating: [],
      packageType: PackageType.CHARTER,
    };

    if (params.get("destinationCountry")) {
      filters.destinationCountry = params.get("destinationCountry") || undefined;
    }
    if (params.get("destinationCity")) {
      filters.destinationCity = params.get("destinationCity") || undefined;
    }
    if (params.get("minPrice")) {
      filters.minPrice = parseInt(params.get("minPrice") || "0");
    }
    if (params.get("maxPrice")) {
      filters.maxPrice = parseInt(params.get("maxPrice") || "0");
    }
    if (params.get("minNights")) {
      filters.minNights = parseInt(params.get("minNights") || "0");
    }
    if (params.get("maxNights")) {
      filters.maxNights = parseInt(params.get("maxNights") || "0");
    }
    if (params.get("minDays")) {
      filters.minDays = parseInt(params.get("minDays") || "0");
    }
    if (params.get("maxDays")) {
      filters.maxDays = parseInt(params.get("maxDays") || "0");
    }
    if (params.get("departureDateFrom")) {
      filters.departureDateFrom = params.get("departureDateFrom") || undefined;
    }
    if (params.get("departureDateTo")) {
      filters.departureDateTo = params.get("departureDateTo") || undefined;
    }
    if (params.get("hotelRating")) {
      filters.hotelRating = params
        .get("hotelRating")
        ?.split(",")
        .map(Number)
        .filter((n) => !isNaN(n)) || [];
    }
    return filters;
  }, [searchParamsKey]);

  const [filters, setFilters] = useState<CharterPackageFilters>(parseFiltersFromURL);
  const [packages, setPackages] = useState<PackageData[]>(initialPackages || []);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [filterOptions] = useState<FilterOptions | undefined>(initialFilterOptions);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);
  const isMountedRef = useRef(true);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
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
      if (newFilters.sortBy && newFilters.sortBy !== "newest") {
        params.set("sortBy", newFilters.sortBy);
      }
      if (newFilters.page && newFilters.page > 1) {
        params.set("page", newFilters.page.toString());
      }

      const nextQuery = params.toString();
      const nextUrl = nextQuery
        ? `/charter-packages?${nextQuery}`
        : "/charter-packages";
      if (nextQuery === searchParamsKey) {
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [router, searchParamsKey]
  );

  // Fetch packages with filters
  const fetchPackages = useCallback(
    async (filterParams: CharterPackageFilters) => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
      const controller = new AbortController();
      activeRequestRef.current = controller;
      const requestId = ++requestSeqRef.current;
      if (!isMountedRef.current) return;
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

        const response = await fetch(`/api/charter-packages?${queryParams.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to fetch packages");
        }
        const data = await response.json();
        if (!isMountedRef.current || requestId !== requestSeqRef.current) return;
        setPackages(data.packages);
        setTotal(data.pagination.total);
        setPage(data.pagination.page);
      } catch (error) {
        if (
          error instanceof Error &&
          (error.name === "AbortError" || !isMountedRef.current)
        ) {
          return;
        }
        console.error("Error fetching packages:", error);
        if (!isMountedRef.current) return;
        setPackages([]);
        setTotal(0);
      } finally {
        if (!isMountedRef.current || requestId !== requestSeqRef.current) return;
        setLoading(false);
      }
    },
    []
  );

  const runDebouncedFetch = useCallback(
    (filterParams: CharterPackageFilters) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        updateURL(filterParams);
      }, 300);
    },
    [updateURL]
  );

  useEffect(() => {
    const nextFilters = parseFiltersFromURL();
    setFilters(nextFilters);
    setPage(nextFilters.page || 1);

    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }

    fetchPackages(nextFilters);
  }, [searchParamsKey, parseFiltersFromURL, fetchPackages]);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: CharterPackageFilters) => {
      const charterScopedFilters = {
        ...newFilters,
        packageType: PackageType.CHARTER,
      };
      setFilters(charterScopedFilters);
      setPage(1); // Reset to first page on filter change
      runDebouncedFetch({ ...charterScopedFilters, page: 1 });
    },
    [runDebouncedFetch]
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (sortBy: string) => {
      const nextSort = sortBy as SortBy;
      const newFilters = { ...filters, sortBy: nextSort, page: 1 };
      setFilters(newFilters);
      setPage(1);
      runDebouncedFetch(newFilters);
    },
    [filters, runDebouncedFetch]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      const newFilters = { ...filters, page: newPage };
      setFilters(newFilters);
      setPage(newPage);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

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
          ) : packages && packages.length > 0 ? (
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

