"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface DateRangeFilterProps {
  dateFrom?: string | null;
  dateTo?: string | null;
  flexibleDates?: boolean;
  onDateFromChange: (date: string | null) => void;
  onDateToChange: (date: string | null) => void;
  onFlexibleDatesChange: (flexible: boolean) => void;
}

export function DateRangeFilter({
  dateFrom,
  dateTo,
  flexibleDates = false,
  onDateFromChange,
  onDateToChange,
  onFlexibleDatesChange,
}: DateRangeFilterProps) {
  const minDate = new Date().toISOString().split("T")[0];

  const handleClear = () => {
    onDateFromChange(null);
    onDateToChange(null);
    onFlexibleDatesChange(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Departure Date From</Label>
        <Input
          type="date"
          value={dateFrom || ""}
          min={minDate}
          onChange={(e) => onDateFromChange(e.target.value || null)}
        />
      </div>

      <div className="space-y-2">
        <Label>Departure Date To</Label>
        <Input
          type="date"
          value={dateTo || ""}
          min={dateFrom || minDate}
          onChange={(e) => onDateToChange(e.target.value || null)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="flexible-dates"
          checked={flexibleDates}
          onCheckedChange={(checked) =>
            onFlexibleDatesChange(checked === true)
          }
        />
        <Label
          htmlFor="flexible-dates"
          className="text-sm font-normal cursor-pointer"
        >
          Flexible dates (±3 days)
        </Label>
      </div>

      {(dateFrom || dateTo) && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear dates
        </Button>
      )}
    </div>
  );
}

