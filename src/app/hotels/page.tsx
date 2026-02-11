import { prisma } from "@/lib/prisma";
import { MapPin } from "lucide-react";
import { StaggerList } from "@/components/motion/stagger-list";
import { HotelCard } from "@/components/hotels/hotel-card";

export const metadata = {
  title: "Hotels",
  description: "Find the perfect accommodation for your stay",
};

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; country?: string }>;
}) {
  const params = await searchParams;
  const where: any = { isActive: true };
  if (params.city) where.city = params.city;
  if (params.country) where.country = params.country;

  const hotelsData = await prisma.hotel.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Convert Decimal fields to numbers for client components
  const hotels = hotelsData.map((hotel) => ({
    ...hotel,
    pricePerNight: hotel.pricePerNight ? Number(hotel.pricePerNight) : null,
  }));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-16 md:py-20">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/600')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <MapPin className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-shadow-lg">
              Find Your Perfect Stay
            </h1>
            <p className="text-xl text-white/90 text-shadow-md">
              Discover amazing hotels and accommodations worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Hotels Grid */}
      <section className="container mx-auto px-4 py-12 flex-1">
        {hotels.length > 0 ? (
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
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
      </section>
    </div>
  );
}

