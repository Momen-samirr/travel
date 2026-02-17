"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { RangeSlider } from "@/components/ui/slider";

interface DurationFilterProps {
  minNights?: number | null;
  maxNights?: number | null;
  minDays?: number | null;
  maxDays?: number | null;
  nightsRange: { min: number; max: number };
  daysRange: { min: number; max: number };
  onNightsChange: (min: number | null, max: number | null) => void;
  onDaysChange: (min: number | null, max: number | null) => void;
}

export function DurationFilter({
  minNights,
  maxNights,
  minDays,
  maxDays,
  nightsRange,
  daysRange,
  onNightsChange,
  onDaysChange,
}: DurationFilterProps) {
  const [nightsSlider, setNightsSlider] = useState<[number, number]>([
    minNights || nightsRange.min,
    maxNights || nightsRange.max,
  ]);
  const [daysSlider, setDaysSlider] = useState<[number, number]>([
    minDays || daysRange.min,
    maxDays || daysRange.max,
  ]);

  const handleNightsSliderChange = (values: [number, number]) => {
    setNightsSlider(values);
    onNightsChange(values[0], values[1]);
  };

  const handleDaysSliderChange = (values: [number, number]) => {
    setDaysSlider(values);
    onDaysChange(values[0], values[1]);
  };

  const handleClear = () => {
    setNightsSlider([nightsRange.min, nightsRange.max]);
    setDaysSlider([daysRange.min, daysRange.max]);
    onNightsChange(null, null);
    onDaysChange(null, null);
  };

  const quickNightsOptions = [
    { label: "3-5 nights", min: 3, max: 5 },
    { label: "6-8 nights", min: 6, max: 8 },
    { label: "9-12 nights", min: 9, max: 12 },
    { label: "13+ nights", min: 13, max: nightsRange.max },
  ];

  return (
    <div className="space-y-6">
      {/* Nights Filter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Nights</Label>
          <span className="text-sm text-muted-foreground">
            {nightsSlider[0]} - {nightsSlider[1]} nights
          </span>
        </div>
        <RangeSlider
          value={nightsSlider}
          onValueChange={handleNightsSliderChange}
          min={nightsRange.min}
          max={nightsRange.max}
          step={1}
          className="w-full"
        />
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minNights || ""}
            min={nightsRange.min}
            max={nightsRange.max}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value) : null;
              onNightsChange(value, maxNights ?? null);
              if (value !== null) {
                setNightsSlider([value, maxNights || nightsRange.max]);
              }
            }}
            className="flex-1"
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxNights || ""}
            min={nightsRange.min}
            max={nightsRange.max}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value) : null;
              onNightsChange(minNights ?? null, value);
              if (value !== null) {
                setNightsSlider([minNights || nightsRange.min, value]);
              }
            }}
            className="flex-1"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {quickNightsOptions.map((option) => (
            <Button
              key={option.label}
              variant="outline"
              size="sm"
              onClick={() => {
                setNightsSlider([option.min, option.max]);
                onNightsChange(option.min, option.max);
              }}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Days Filter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Days</Label>
          <span className="text-sm text-muted-foreground">
            {daysSlider[0]} - {daysSlider[1]} days
          </span>
        </div>
        <RangeSlider
          value={daysSlider}
          onValueChange={handleDaysSliderChange}
          min={daysRange.min}
          max={daysRange.max}
          step={1}
          className="w-full"
        />
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minDays || ""}
            min={daysRange.min}
            max={daysRange.max}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value) : null;
              onDaysChange(value, maxDays ?? null);
              if (value !== null) {
                setDaysSlider([value, maxDays || daysRange.max]);
              }
            }}
            className="flex-1"
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxDays || ""}
            min={daysRange.min}
            max={daysRange.max}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value) : null;
              onDaysChange(minDays ?? null, value);
              if (value !== null) {
                setDaysSlider([minDays || daysRange.min, value]);
              }
            }}
            className="flex-1"
          />
        </div>
      </div>

      {(minNights || maxNights || minDays || maxDays) && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear duration
        </Button>
      )}
    </div>
  );
}

