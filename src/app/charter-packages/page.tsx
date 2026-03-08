import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Package } from "lucide-react";
import { CharterPackagesPageContent } from "@/components/charter-packages/CharterPackagesPageContent";
import type { PackageData } from "@/components/charter-packages/CharterPackagesPageContent";
import { charterPackageFiltersSchema } from "@/lib/validations/charter-package-filters";
import { PackageType } from "@/services/packages/types";
import { getPackageFilterOptions } from "@/lib/package-filter-options";

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
    minPrice?: string;
    maxPrice?: string;
    minNights?: string;
    maxNights?: string;
    minDays?: string;
    maxDays?: string;
    departureDateFrom?: string;
    departureDateTo?: string;
    hotelRating?: string;
    packageType?: string;
    sortBy?: string;
  }>;
}) {
  const params = await searchParams;
  
  // Parse filters from URL
  const filters = charterPackageFiltersSchema.parse(params);
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 12;

  // Build where clause (same logic as API)
  const where: Prisma.CharterTravelPackageWhereInput = {
    isActive: true,
    type: PackageType.CHARTER,
  };

  if (filters.destinationCountry) {
    where.destinationCountry = filters.destinationCountry;
  }
  if (filters.destinationCity) {
    where.destinationCity = { contains: filters.destinationCity, mode: "insensitive" };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceConditions = [];
    if (filters.minPrice !== undefined) {
      priceConditions.push(
        { priceRangeMin: { gte: filters.minPrice } },
        { basePrice: { gte: filters.minPrice } }
      );
    }
    if (filters.maxPrice !== undefined) {
      priceConditions.push(
        { priceRangeMax: { lte: filters.maxPrice } },
        { basePrice: { lte: filters.maxPrice } }
      );
    }
    if (priceConditions.length > 0) {
      where.OR = priceConditions;
    }
  }

  if (filters.minNights !== undefined || filters.maxNights !== undefined) {
    where.nights = {
      ...(filters.minNights !== undefined ? { gte: filters.minNights } : {}),
      ...(filters.maxNights !== undefined ? { lte: filters.maxNights } : {}),
    };
  }

  if (filters.minDays !== undefined || filters.maxDays !== undefined) {
    where.days = {
      ...(filters.minDays !== undefined ? { gte: filters.minDays } : {}),
      ...(filters.maxDays !== undefined ? { lte: filters.maxDays } : {}),
    };
  }

  if (filters.departureDateFrom || filters.departureDateTo) {
    where.departureOptions = {
      some: {
        isActive: true,
        departureDate: {
          ...(filters.departureDateFrom && { gte: new Date(filters.departureDateFrom) }),
          ...(filters.departureDateTo && { lte: new Date(filters.departureDateTo) }),
        },
      },
    };
  }

  if (filters.hotelRating && filters.hotelRating.length > 0) {
    where.hotelOptions = {
      some: {
        isActive: true,
        starRating: { in: filters.hotelRating },
      },
    };
  }

  if (filters.packageType) {
    where.type = filters.packageType;
  }

  // Build orderBy
  let orderBy: Prisma.CharterTravelPackageOrderByWithRelationInput = {
    createdAt: "desc",
  };
  switch (filters.sortBy) {
    case "price_asc":
      orderBy = { priceRangeMin: "asc" };
      break;
    case "price_desc":
      orderBy = { priceRangeMax: "desc" };
      break;
    case "duration_asc":
      orderBy = { nights: "asc" };
      break;
    case "duration_desc":
      orderBy = { nights: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  let packages: PackageData[] = [];
  let total = 0;
  let filterOptions: Awaited<ReturnType<typeof getPackageFilterOptions>> | null = null;

  try {
    const [packagesData, totalCount, cachedFilterOptions] = await Promise.all([
      prisma.charterTravelPackage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              departureOptions: true,
              hotelOptions: true,
              bookings: true,
            },
          },
        },
      }),
      prisma.charterTravelPackage.count({ where }),
      getPackageFilterOptions(PackageType.CHARTER),
    ]);

    packages = packagesData.map((pkg) => ({
      ...pkg,
      basePrice: pkg.basePrice ? Number(pkg.basePrice) : null,
      priceRangeMin: pkg.priceRangeMin ? Number(pkg.priceRangeMin) : null,
      priceRangeMax: pkg.priceRangeMax ? Number(pkg.priceRangeMax) : null,
      discount: pkg.discount ? Number(pkg.discount) : null,
    }));
    total = totalCount;
    filterOptions = cachedFilterOptions;
  } catch (error) {
    console.error("Database connection error:", error);
    packages = [];
    total = 0;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative bg-linear-to-br from-primary via-primary/90 to-primary/80 text-white py-16 md:py-20">
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

      <CharterPackagesPageContent
        initialPackages={packages}
        initialTotal={total}
        initialPage={page}
        initialFilterOptions={filterOptions ?? undefined}
        packageType={PackageType.CHARTER}
        basePath="/charter-packages"
      />
    </div>
  );
}

