"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Hotel, Building2 } from "lucide-react";

interface HotelTabsProps {
  defaultTab?: "internal" | "amadeus";
  onTabChange?: (tab: "internal" | "amadeus") => void;
  internalContent: React.ReactNode;
  amadeusContent: React.ReactNode;
}

export function HotelTabs({
  defaultTab = "internal",
  onTabChange,
  internalContent,
  amadeusContent,
}: HotelTabsProps) {
  return (
    <Tabs
      defaultValue={defaultTab}
      onValueChange={(value) => onTabChange?.(value as "internal" | "amadeus")}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="internal" className="flex items-center gap-2">
          <Hotel className="h-4 w-4" />
          <span>Our Hotels</span>
        </TabsTrigger>
        <TabsTrigger value="amadeus" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>Amadeus Hotels</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="internal" className="mt-0">
        {internalContent}
      </TabsContent>
      <TabsContent value="amadeus" className="mt-0">
        {amadeusContent}
      </TabsContent>
    </Tabs>
  );
}

