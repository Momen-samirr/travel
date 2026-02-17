"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { StaggerList } from "@/components/motion/stagger-list";
import { HotelCard } from "@/components/hotels/hotel-card";
import { HotelTabs } from "@/components/hotels/hotel-tabs";
import { AmadeusHotelSearch } from "@/components/hotels/amadeus-hotel-search";
import { AmadeusHotelCard } from "@/components/hotels/amadeus-hotel-card";
import { Hotel } from "@/services/hotels/types";

interface HotelsPageContentProps {
  internalHotels: any[];
}

export function HotelsPageContent({ internalHotels }: HotelsPageContentProps) {
  const [amadeusHotels, setAmadeusHotels] = useState<Hotel[]>([]);
  const [amadeusLoading, setAmadeusLoading] = useState(false);

  const internalContent = (
    <div>
      {internalHotels.length > 0 ? (
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {internalHotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </StaggerList>
      ) : (
        <div className="text-center py-20">
          <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No Hotels Found</h2>
          <p className="text-muted-foreground">
            Check back soon for new hotel listings!
          </p>
        </div>
      )}
    </div>
  );

  const amadeusContent = (
    <div>
      <AmadeusHotelSearch
        onHotelsFound={setAmadeusHotels}
        onLoadingChange={setAmadeusLoading}
      />
      
      {amadeusLoading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Searching hotels...</p>
        </div>
      ) : amadeusHotels.length > 0 ? (
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {amadeusHotels.map((hotel) => (
            <AmadeusHotelCard key={hotel.id} hotel={hotel} />
          ))}
        </StaggerList>
      ) : (
        <div className="text-center py-20">
          <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Search for Hotels</h2>
          <p className="text-muted-foreground">
            Use the search form above to find hotels from Amadeus
          </p>
        </div>
      )}
    </div>
  );

  return (
    <section className="container mx-auto px-4 py-12 flex-1">
      <HotelTabs
        defaultTab="internal"
        internalContent={internalContent}
        amadeusContent={amadeusContent}
      />
    </section>
  );
}

