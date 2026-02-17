import { prisma } from "@/lib/prisma";
import { Package } from "lucide-react";
import { StaggerList } from "@/components/motion/stagger-list";
import { CharterPackageCard } from "@/components/charter-packages/package-card";

export const metadata = {
  title: "Charter Travel Packages",
  description: "Browse our complete charter travel packages with flights, hotels, and more",
};

export default async function CharterPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    destinationCountry?: string;
    destinationCity?: string;
  }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 12;

  const where: any = { isActive: true };
  if (params.destinationCountry)
    where.destinationCountry = params.destinationCountry;
  if (params.destinationCity) where.destinationCity = params.destinationCity;

  let packages: any[] = [];
  let total = 0;

  try {
    const [packagesData, totalCount] = await Promise.all([
      prisma.charterTravelPackage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              departureOptions: true,
              hotelOptions: true,
            },
          },
        },
      }),
      prisma.charterTravelPackage.count({ where }),
    ]);

    packages = packagesData.map((pkg) => ({
      ...pkg,
      basePrice: pkg.basePrice ? Number(pkg.basePrice) : null,
      priceRangeMin: pkg.priceRangeMin ? Number(pkg.priceRangeMin) : null,
      priceRangeMax: pkg.priceRangeMax ? Number(pkg.priceRangeMax) : null,
      discount: pkg.discount ? Number(pkg.discount) : null,
    }));
    total = totalCount;
  } catch (error: any) {
    console.error("Database connection error:", error);
    packages = [];
    total = 0;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-16 md:py-20">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/600')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <Package className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-shadow-lg">
              Charter Travel Packages
            </h1>
            <p className="text-xl text-white/90 text-shadow-md">
              Complete travel bundles with flights, hotels, transfers, and more
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 flex-1">
        {packages.length > 0 ? (
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <CharterPackageCard key={pkg.id} package={pkg} />
            ))}
          </StaggerList>
        ) : (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No Packages Found</h2>
            <p className="text-muted-foreground">
              {total === 0
                ? "Check back soon for new charter packages!"
                : "Unable to load packages. Please try again later."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

