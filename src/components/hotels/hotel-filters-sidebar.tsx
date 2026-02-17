"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RangeSlider } from "@/components/ui/slider";
import { HotelProvider } from "@/services/hotels/types";
import { formatCurrency } from "@/lib/utils";
import { X } from "lucide-react";

interface HotelFiltersSidebarProps {
  onFiltersChange?: (filters: any) => void;
}

const commonAmenities = [
  "Wifi",
  "Pool",
  "Gym",
  "Breakfast",
  "Parking",
  "Restaurant",
  "Spa",
  "Air Conditioning",
];

export function HotelFiltersSidebar({ onFiltersChange }: HotelFiltersSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Price filter
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get("minPrice") || "0"),
    parseInt(searchParams.get("maxPrice") || "50000"),
  ]);

  // Rating filter
  const [selectedRatings, setSelectedRatings] = useState<number[]>(
    searchParams.get("ratings")?.split(",").map(Number) || []
  );

  // Review score filter
  const [reviewScoreRange, setReviewScoreRange] = useState<[number, number]>([
    parseFloat(searchParams.get("minReviewScore") || "0"),
    parseFloat(searchParams.get("maxReviewScore") || "10"),
  ]);

  // Amenities filter
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    searchParams.get("amenities")?.split(",") || []
  );

  // Source filter
  const [selectedSources, setSelectedSources] = useState<HotelProvider[]>(
    (searchParams.get("sources")?.split(",").map((s) => s.toUpperCase() as HotelProvider) as HotelProvider[]) || [
      HotelProvider.INTERNAL,
      HotelProvider.AMADEUS,
    ]
  );

  // Hotel name search
  const [searchQuery, setSearchQuery] = useState(searchParams.get("searchQuery") || "");

  // Use refs to track if this is the initial mount and prevent loops
  const isInitialMount = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingFromURL = useRef(false);

  // Sync state from URL params when URL changes (but not from our own updates)
  useEffect(() => {
    if (isUpdatingFromURL.current) {
      isUpdatingFromURL.current = false;
      return;
    }

    // Only sync on initial mount or when URL changes externally
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Sync state from URL (only if URL changed externally, not from our updates)
    const urlMinPrice = parseInt(searchParams.get("minPrice") || "0");
    const urlMaxPrice = parseInt(searchParams.get("maxPrice") || "50000");
    const urlRatings = searchParams.get("ratings")?.split(",").map(Number) || [];
    const urlMinReview = parseFloat(searchParams.get("minReviewScore") || "0");
    const urlMaxReview = parseFloat(searchParams.get("maxReviewScore") || "10");
    const urlAmenities = searchParams.get("amenities")?.split(",") || [];
    const urlSources = (searchParams.get("sources")?.split(",").map((s) => s.toUpperCase() as HotelProvider) as HotelProvider[]) || [HotelProvider.INTERNAL, HotelProvider.AMADEUS];
    const urlSearchQuery = searchParams.get("searchQuery") || "";

    // Only update if values actually changed (to prevent loops)
    if (priceRange[0] !== urlMinPrice || priceRange[1] !== urlMaxPrice) {
      setPriceRange([urlMinPrice, urlMaxPrice]);
    }
    if (JSON.stringify(selectedRatings.sort()) !== JSON.stringify(urlRatings.sort())) {
      setSelectedRatings(urlRatings);
    }
    if (reviewScoreRange[0] !== urlMinReview || reviewScoreRange[1] !== urlMaxReview) {
      setReviewScoreRange([urlMinReview, urlMaxReview]);
    }
    if (JSON.stringify(selectedAmenities.sort()) !== JSON.stringify(urlAmenities.sort())) {
      setSelectedAmenities(urlAmenities);
    }
    if (JSON.stringify(selectedSources.sort()) !== JSON.stringify(urlSources.sort())) {
      setSelectedSources(urlSources);
    }
    if (searchQuery !== urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
    }
  }, [searchParams]); // Depend on searchParams object, but use .toString() inside

  // Update URL when filters change (but skip initial mount and URL syncs)
  useEffect(() => {
    if (isInitialMount.current || isUpdatingFromURL.current) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      isUpdatingFromURL.current = true; // Mark that we're updating URL
      const params = new URLSearchParams(searchParams.toString());

      // Preserve search params (city, dates, etc.)
      // Only update filter params

      // Price
      if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
      else params.delete("minPrice");
      if (priceRange[1] < 50000) params.set("maxPrice", priceRange[1].toString());
      else params.delete("maxPrice");

      // Ratings
      if (selectedRatings.length > 0) {
        params.set("ratings", selectedRatings.join(","));
      } else {
        params.delete("ratings");
      }

      // Review score
      if (reviewScoreRange[0] > 0) params.set("minReviewScore", reviewScoreRange[0].toString());
      else params.delete("minReviewScore");
      if (reviewScoreRange[1] < 10) params.set("maxReviewScore", reviewScoreRange[1].toString());
      else params.delete("maxReviewScore");

      // Amenities
      if (selectedAmenities.length > 0) {
        params.set("amenities", selectedAmenities.join(","));
      } else {
        params.delete("amenities");
      }

      // Sources
      if (selectedSources.length < 2) {
        params.set("sources", selectedSources.join(","));
      } else {
        params.delete("sources");
      }

      // Search query
      if (searchQuery.trim()) {
        params.set("searchQuery", searchQuery.trim());
      } else {
        params.delete("searchQuery");
      }

      // Update URL using router.replace to properly update Next.js state
      router.replace(`/hotels/search?${params.toString()}`, { scroll: false });

      // Reset flag after a short delay to allow URL to update
      setTimeout(() => {
        isUpdatingFromURL.current = false;
      }, 100);

      // Notify parent component
      if (onFiltersChange) {
        onFiltersChange({
          minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
          maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
          minRating: selectedRatings.length > 0 ? Math.min(...selectedRatings) : undefined,
          maxRating: selectedRatings.length > 0 ? Math.max(...selectedRatings) : undefined,
          minReviewScore: reviewScoreRange[0] > 0 ? reviewScoreRange[0] : undefined,
          maxReviewScore: reviewScoreRange[1] < 10 ? reviewScoreRange[1] : undefined,
          amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
          sources: selectedSources.length < 2 ? selectedSources : undefined,
          searchQuery: searchQuery.trim() || undefined,
        });
      }
    }, 300); // 300ms debounce

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    priceRange,
    selectedRatings,
    reviewScoreRange,
    selectedAmenities,
    selectedSources,
    searchQuery,
    router,
    onFiltersChange,
    // Don't include searchParams here - it causes the loop
  ]);

  const toggleRating = (rating: number) => {
    setSelectedRatings((prev) =>
      prev.includes(rating) ? prev.filter((r) => r !== rating) : [...prev, rating]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleSource = (source: HotelProvider) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const clearFilters = () => {
    setPriceRange([0, 50000]);
    setSelectedRatings([]);
    setReviewScoreRange([0, 10]);
    setSelectedAmenities([]);
    setSelectedSources([HotelProvider.INTERNAL, HotelProvider.AMADEUS]);
    setSearchQuery("");
  };

  const hasActiveFilters =
    priceRange[0] > 0 ||
    priceRange[1] < 50000 ||
    selectedRatings.length > 0 ||
    reviewScoreRange[0] > 0 ||
    reviewScoreRange[1] < 10 ||
    selectedAmenities.length > 0 ||
    selectedSources.length < 2 ||
    searchQuery.trim() !== "";

  return (
    <div className="space-y-4">
      <Card className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filter by</CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hotel Name Search */}
          <div className="space-y-2">
            <Label>Hotel Name</Label>
            <Input
              placeholder="Search hotel name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label>Your budget (per night)</Label>
            <RangeSlider
              value={priceRange}
              onValueChange={(value) => setPriceRange(value)}
              min={0}
              max={50000}
              step={100}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(priceRange[0], "EGP")}</span>
              <span>{formatCurrency(priceRange[1], "EGP")}</span>
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Star Rating</Label>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rating-${rating}`}
                    checked={selectedRatings.includes(rating)}
                    onCheckedChange={() => toggleRating(rating)}
                  />
                  <label
                    htmlFor={`rating-${rating}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {rating} {rating === 1 ? "star" : "stars"}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Review Score */}
          <div className="space-y-2">
            <Label>Review Score</Label>
            <RangeSlider
              value={reviewScoreRange}
              onValueChange={(value) => setReviewScoreRange(value)}
              min={0}
              max={10}
              step={0.5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{reviewScoreRange[0].toFixed(1)}</span>
              <span>{reviewScoreRange[1].toFixed(1)}</span>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <Label>Popular Filters</Label>
            <div className="space-y-2">
              {commonAmenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity}`}
                    checked={selectedAmenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <label
                    htmlFor={`amenity-${amenity}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {amenity}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Source Filter */}
          <div className="space-y-2">
            <Label>Hotel Source</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="source-internal"
                  checked={selectedSources.includes(HotelProvider.INTERNAL)}
                  onCheckedChange={() => toggleSource(HotelProvider.INTERNAL)}
                />
                <label
                  htmlFor="source-internal"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Internal Hotels
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="source-amadeus"
                  checked={selectedSources.includes(HotelProvider.AMADEUS)}
                  onCheckedChange={() => toggleSource(HotelProvider.AMADEUS)}
                />
                <label
                  htmlFor="source-amadeus"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Amadeus Hotels
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

