import { prisma } from "@/lib/prisma";
import { MapPin } from "lucide-react";
import { StaggerList } from "@/components/motion/stagger-list";
import { TourCard } from "@/components/tours/tour-card";

export const metadata = {
  title: "Tours",
  description: "Browse our amazing tour packages",
};

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; featured?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 12;

  const where: any = { isActive: true };
  if (params.category) where.category = params.category;
  if (params.featured === "true") where.isFeatured = true;

  let tours = [];
  let total = 0;

  try {
    const [toursData, totalCount] = await Promise.all([
      prisma.tour.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.tour.count({ where }),
    ]);
    
    // Convert Decimal fields to numbers for client components
    tours = toursData.map((tour) => ({
      ...tour,
      price: tour.price ? Number(tour.price) : null,
      discountPrice: tour.discountPrice ? Number(tour.discountPrice) : null,
    }));
    total = totalCount;
  } catch (error: any) {
    console.error("Database connection error:", error);
    // Return empty state if database is unavailable
    tours = [];
    total = 0;
  }

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
              Discover Amazing Tours
            </h1>
            <p className="text-xl text-white/90 text-shadow-md">
              Explore the world with our curated tour packages
            </p>
          </div>
        </div>
      </section>

      {/* Tours Grid */}
      <section className="container mx-auto px-4 py-12 flex-1">
        {tours.length > 0 ? (
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </StaggerList>
        ) : (
          <div className="text-center py-20">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No Tours Found</h2>
            <p className="text-muted-foreground">
              {total === 0 ? "Check back soon for new tour packages!" : "Unable to load tours. Please try again later."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

