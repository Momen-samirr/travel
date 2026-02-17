"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HotelSearchForm } from "@/components/hotels/hotel-search-form";
import { HotelFiltersSidebar } from "@/components/hotels/hotel-filters-sidebar";
import { HotelResultsList } from "@/components/hotels/hotel-results-list";
import { HotelMapView } from "@/components/hotels/hotel-map-view";
import { HotelResultsListSkeleton, HotelSearchSkeleton } from "@/components/hotels/hotel-search-skeleton";
import { Button } from "@/components/ui/button";
import { Map, List as ListIcon, Filter } from "lucide-react";
import { Hotel } from "@/services/hotels/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function HotelSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<string | undefined>();
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Create a stable string representation of search params to prevent infinite loops
  const searchParamsString = searchParams.toString();

  // Fetch hotels when search params change
  useEffect(() => {
    // Abort controller for cleanup
    const abortController = new AbortController();
    const fetchHotels = async () => {
      // Check if we have at least city or cityCode
      const city = searchParams.get("city");
      const cityCode = searchParams.get("cityCode");
      
      if (!city && !cityCode) {
        setLoading(false);
        setHotels([]);
        return;
      }

      setLoading(true);

      try {
        const params = new URLSearchParams();
        
        // Search parameters
        if (city) params.set("city", city);
        if (cityCode) params.set("cityCode", cityCode);
        if (searchParams.get("checkInDate")) params.set("checkInDate", searchParams.get("checkInDate")!);
        if (searchParams.get("checkOutDate")) params.set("checkOutDate", searchParams.get("checkOutDate")!);
        if (searchParams.get("adults")) params.set("adults", searchParams.get("adults")!);
        if (searchParams.get("children")) params.set("children", searchParams.get("children")!);
        if (searchParams.get("currencyCode")) params.set("currencyCode", searchParams.get("currencyCode")!);

        // Filters
        if (searchParams.get("sources")) params.set("sources", searchParams.get("sources")!);
        if (searchParams.get("minPrice")) params.set("minPrice", searchParams.get("minPrice")!);
        if (searchParams.get("maxPrice")) params.set("maxPrice", searchParams.get("maxPrice")!);
        if (searchParams.get("ratings")) {
          const ratings = searchParams.get("ratings")!.split(",");
          if (ratings.length > 0) {
            params.set("minRating", Math.min(...ratings.map(Number)).toString());
            params.set("maxRating", Math.max(...ratings.map(Number)).toString());
          }
        }
        if (searchParams.get("minReviewScore")) params.set("minRating", searchParams.get("minReviewScore")!);
        if (searchParams.get("maxReviewScore")) params.set("maxRating", searchParams.get("maxReviewScore")!);
        if (searchParams.get("amenities")) params.set("amenities", searchParams.get("amenities")!);
        if (searchParams.get("searchQuery")) params.set("searchQuery", searchParams.get("searchQuery")!);

        // Sorting and pagination
        if (searchParams.get("sortBy")) params.set("sortBy", searchParams.get("sortBy")!);
        const currentPage = parseInt(searchParams.get("page") || "1");
        params.set("page", currentPage.toString());
        params.set("pageSize", pageSize.toString());

        const response = await fetch(`/api/hotels/search?${params.toString()}`, {
          signal: abortController.signal,
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch hotels");
        }

        const data = await response.json();
        
        // Only update state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setHotels(data.hotels || []);
          setTotal(data.total || 0);
          setPage(data.page || 1);
          setTotalPages(data.totalPages || 1);
        }
      } catch (error: any) {
        // Ignore abort errors
        if (error.name === "AbortError") {
          return;
        }
        console.error("Error fetching hotels:", error);
        if (!abortController.signal.aborted) {
          setHotels([]);
          setTotal(0);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchHotels();

    // Cleanup function to abort request if component unmounts or params change
    return () => {
      abortController.abort();
    };
  }, [searchParamsString, pageSize]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/hotels/search?${params.toString()}`);
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = (sortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", sortBy);
    params.set("page", "1"); // Reset to first page
    router.push(`/hotels/search?${params.toString()}`);
  };

  const handleHotelClick = (hotel: Hotel) => {
    setSelectedHotelId(hotel.id);
    // Scroll to hotel card if in list view
    if (!showMap) {
      const element = document.getElementById(`hotel-${hotel.id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const hasSearchParams = searchParams.get("city") || searchParams.get("cityCode");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Search Form */}
        <div className="mb-6">
          <HotelSearchForm />
        </div>

        {hasSearchParams ? (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0">
              <HotelFiltersSidebar />
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6">
              {/* Results List */}
              <div className={`flex-1 ${showMap ? "lg:w-1/2" : ""}`}>
                <div className="mb-4 flex justify-between items-center gap-2">
                  {/* Mobile Filter Button */}
                  <div className="lg:hidden">
                    <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filters
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4">
                          <HotelFiltersSidebar />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  <Button
                    variant={showMap ? "outline" : "default"}
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                    className="ml-auto"
                  >
                    {showMap ? (
                      <>
                        <ListIcon className="h-4 w-4 mr-2" />
                        List View
                      </>
                    ) : (
                      <>
                        <Map className="h-4 w-4 mr-2" />
                        Map View
                      </>
                    )}
                  </Button>
                </div>
                {loading ? (
                  <HotelResultsListSkeleton />
                ) : (
                  <HotelResultsList
                    hotels={hotels}
                    total={total}
                    page={page}
                    pageSize={pageSize}
                    totalPages={totalPages}
                    loading={loading}
                    onPageChange={handlePageChange}
                    onSortChange={handleSortChange}
                    onHotelClick={handleHotelClick}
                  />
                )}
              </div>

              {/* Map View */}
              {showMap && (
                <div className="lg:w-1/2 lg:sticky lg:top-6 h-[600px] lg:h-[calc(100vh-120px)]">
                  <HotelMapView
                    hotels={hotels}
                    selectedHotelId={selectedHotelId}
                    onHotelClick={handleHotelClick}
                    className="h-full"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-lg font-semibold mb-2">Start your hotel search</p>
            <p className="text-muted-foreground">
              Enter a destination and dates to find available hotels
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

