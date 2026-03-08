import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { CharterPackagesPageContent } from "@/components/charter-packages/CharterPackagesPageContent";
import type { PackageData } from "@/components/charter-packages/CharterPackagesPageContent";
import { charterPackageFiltersSchema } from "@/lib/validations/charter-package-filters";
import { PackageType } from "@/services/packages/types";
import { getPackageFilterOptions } from "@/lib/package-filter-options";
import { DEFAULT_CURRENCY } from "@/lib/currency";

export const metadata = {
  title: "Inbound Travel Packages",
  description: "Browse our inbound travel packages for local tourism without international flights",
};

export default async function InboundPackagesPage({
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

  // Build where clause - filter by INBOUND type only
  const where: Prisma.CharterTravelPackageWhereInput = {
    isActive: true,
    type: PackageType.INBOUND,
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
        ...(filters.departureDateFrom && { departureDate: { gte: new Date(filters.departureDateFrom) } }),
        ...(filters.departureDateTo && { departureDate: { lte: new Date(filters.departureDateTo) } }),
      },
    };
  }

  if (filters.hotelRating && filters.hotelRating.length > 0) {
    where.hotelOptions = {
      some: {
        starRating: { in: filters.hotelRating },
      },
    };
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
      getPackageFilterOptions(PackageType.INBOUND),
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
    filterOptions = {
      countries: [],
      cities: {},
      priceRange: { min: 0, max: 100000, currency: DEFAULT_CURRENCY },
      durationRange: { minNights: 1, maxNights: 30, minDays: 1, maxDays: 31 },
      hotelRatings: [],
      packageTypes: [],
    };
  }

  return (
    <CharterPackagesPageContent
      initialPackages={packages}
      initialTotal={total}
      initialPage={page}
      initialFilterOptions={filterOptions ?? undefined}
      packageType={PackageType.INBOUND}
      basePath="/inbound-packages"
    />
  );
}

