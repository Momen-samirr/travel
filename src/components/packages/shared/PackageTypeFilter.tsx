"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageType } from "@/services/packages/types";
import { Package, Plane, MapPin } from "lucide-react";

interface PackageTypeFilterProps {
  activeType: PackageType | "ALL";
  onTypeChange: (type: PackageType | "ALL") => void;
}

export function PackageTypeFilter({
  activeType,
  onTypeChange,
}: PackageTypeFilterProps) {
  return (
    <Tabs
      value={activeType}
      onValueChange={(value) => onTypeChange(value as PackageType | "ALL")}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="ALL" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span>All Packages</span>
        </TabsTrigger>
        <TabsTrigger
          value={PackageType.HOTEL_CHARTER}
          className="flex items-center gap-2"
        >
          <Plane className="h-4 w-4" />
          <span>Charter</span>
        </TabsTrigger>
        <TabsTrigger
          value={PackageType.INBOUND}
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          <span>Inbound</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

