"use client";

import { useState } from "react";
import { HotelCardRedesigned } from "./hotel-card-redesigned";
import { HotelResultsListSkeleton } from "./hotel-search-skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { Hotel } from "@/services/hotels/types";

interface HotelResultsListProps {
  hotels: Hotel[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onSortChange?: (sortBy: string) => void;
  onHotelClick?: (hotel: Hotel) => void;
}

export function HotelResultsList({
  hotels,
  total,
  page = 1,
  pageSize = 20,
  totalPages = 1,
  loading = false,
  onPageChange,
  onSortChange,
  onHotelClick,
}: HotelResultsListProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<string>("price");

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onSortChange?.(value);
  };

  if (loading) {
    return <HotelResultsListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {total} {total === 1 ? "property" : "properties"} found
          </h2>
          {total > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, total)} of {total}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price: Low to High</SelectItem>
              <SelectItem value="rating">Rating: High to Low</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-l-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {hotels.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-semibold mb-2">No hotels found</p>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or filters
          </p>
        </div>
      ) : (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {hotels.map((hotel) => (
              <HotelCardRedesigned
                key={hotel.id}
                hotel={hotel}
                onCardClick={() => onHotelClick?.(hotel)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && onPageChange && (
            <div className="flex justify-center pt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

