"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

interface SortDropdownProps {
  sortBy: "price" | "duration" | "departure";
  sortOrder: "asc" | "desc";
  onSortByChange: (sortBy: "price" | "duration" | "departure") => void;
  onSortOrderChange: (order: "asc" | "desc") => void;
}

export function SortDropdown({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-gray-400" />
      <Select
        value={`${sortBy}-${sortOrder}`}
        onValueChange={(value) => {
          const [newSortBy, newSortOrder] = value.split("-") as [
            "price" | "duration" | "departure",
            "asc" | "desc"
          ];
          onSortByChange(newSortBy);
          onSortOrderChange(newSortOrder);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="price-asc">Price: Low to High</SelectItem>
          <SelectItem value="price-desc">Price: High to Low</SelectItem>
          <SelectItem value="duration-asc">Duration: Shortest</SelectItem>
          <SelectItem value="duration-desc">Duration: Longest</SelectItem>
          <SelectItem value="departure-asc">Departure: Earliest</SelectItem>
          <SelectItem value="departure-desc">Departure: Latest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

