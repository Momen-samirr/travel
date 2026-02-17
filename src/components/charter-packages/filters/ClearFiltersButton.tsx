"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ClearFiltersButtonProps {
  onClear: () => void;
  activeFilterCount: number;
}

export function ClearFiltersButton({
  onClear,
  activeFilterCount,
}: ClearFiltersButtonProps) {
  if (activeFilterCount === 0) {
    return null;
  }

  return (
    <Button
      variant="outline"
      onClick={onClear}
      className="w-full"
    >
      <X className="h-4 w-4 mr-2" />
      Clear All Filters ({activeFilterCount})
    </Button>
  );
}

