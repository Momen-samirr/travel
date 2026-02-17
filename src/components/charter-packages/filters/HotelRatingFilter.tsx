"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X, Star } from "lucide-react";

interface HotelRatingFilterProps {
  availableRatings: number[];
  selectedRatings: number[];
  onRatingsChange: (ratings: number[]) => void;
}

export function HotelRatingFilter({
  availableRatings,
  selectedRatings,
  onRatingsChange,
}: HotelRatingFilterProps) {
  const handleRatingToggle = (rating: number) => {
    if (selectedRatings.includes(rating)) {
      onRatingsChange(selectedRatings.filter((r) => r !== rating));
    } else {
      onRatingsChange([...selectedRatings, rating]);
    }
  };

  const handleClear = () => {
    onRatingsChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {availableRatings.map((rating) => (
          <div key={rating} className="flex items-center space-x-2">
            <Checkbox
              id={`rating-${rating}`}
              checked={selectedRatings.includes(rating)}
              onCheckedChange={() => handleRatingToggle(rating)}
            />
            <Label
              htmlFor={`rating-${rating}`}
              className="flex items-center gap-1 cursor-pointer font-normal"
            >
              {Array.from({ length: rating }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-yellow-400 text-yellow-400"
                />
              ))}
              <span className="ml-1">{rating} Star{rating > 1 ? "s" : ""}</span>
            </Label>
          </div>
        ))}
      </div>

      {selectedRatings.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear ratings
        </Button>
      )}
    </div>
  );
}

