"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { PackageType } from "@/services/packages/types";

interface PackageTypeFilterProps {
  availableTypes: PackageType[];
  selectedType?: PackageType | null;
  onTypeChange: (type: PackageType | null) => void;
}

const typeLabels: Record<PackageType, string> = {
  HOTEL_CHARTER: "Hotel Charter",
  INBOUND: "Inbound",
  OUTBOUND: "Outbound",
  DOMESTIC: "Domestic",
  CUSTOM: "Custom",
};

export function PackageTypeFilter({
  availableTypes,
  selectedType,
  onTypeChange,
}: PackageTypeFilterProps) {
  const handleClear = () => {
    onTypeChange(null);
  };

  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedType || ""}
        onValueChange={(value) => onTypeChange(value || null)}
      >
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="" id="type-all" />
            <Label htmlFor="type-all" className="cursor-pointer font-normal">
              All Types
            </Label>
          </div>
          {availableTypes.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <RadioGroupItem value={type} id={`type-${type}`} />
              <Label
                htmlFor={`type-${type}`}
                className="cursor-pointer font-normal"
              >
                {typeLabels[type]}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>

      {selectedType && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear type
        </Button>
      )}
    </div>
  );
}

