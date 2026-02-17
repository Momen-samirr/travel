"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { RangeSlider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/utils";

interface PriceRangeFilterProps {
  minPrice?: number | null;
  maxPrice?: number | null;
  priceRange: { min: number; max: number; currency: string };
  onPriceChange: (min: number | null, max: number | null) => void;
}

export function PriceRangeFilter({
  minPrice,
  maxPrice,
  priceRange,
  onPriceChange,
}: PriceRangeFilterProps) {
  const [priceSlider, setPriceSlider] = useState<[number, number]>([
    minPrice || priceRange.min,
    maxPrice || priceRange.max,
  ]);

  useEffect(() => {
    setPriceSlider([
      minPrice || priceRange.min,
      maxPrice || priceRange.max,
    ]);
  }, [minPrice, maxPrice, priceRange]);

  const handlePriceSliderChange = (values: [number, number]) => {
    setPriceSlider(values);
    onPriceChange(values[0], values[1]);
  };

  const handleClear = () => {
    setPriceSlider([priceRange.min, priceRange.max]);
    onPriceChange(null, null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Price Range</Label>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(priceSlider[0], priceRange.currency)} -{" "}
            {formatCurrency(priceSlider[1], priceRange.currency)}
          </span>
        </div>
        <RangeSlider
          value={priceSlider}
          onValueChange={handlePriceSliderChange}
          min={priceRange.min}
          max={priceRange.max}
          step={100}
          className="w-full"
        />
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Min Price</Label>
            <Input
              type="number"
              placeholder="Min"
              value={minPrice || ""}
              min={priceRange.min}
              max={priceRange.max}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : null;
                onPriceChange(value, maxPrice ?? null);
                if (value !== null) {
                  setPriceSlider([value, maxPrice || priceRange.max]);
                }
              }}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Max Price</Label>
            <Input
              type="number"
              placeholder="Max"
              value={maxPrice || ""}
              min={priceRange.min}
              max={priceRange.max}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : null;
                onPriceChange(minPrice ?? null, value);
                if (value !== null) {
                  setPriceSlider([minPrice || priceRange.min, value]);
                }
              }}
            />
          </div>
        </div>
      </div>

      {(minPrice !== null || maxPrice !== null) && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear price
        </Button>
      )}
    </div>
  );
}

