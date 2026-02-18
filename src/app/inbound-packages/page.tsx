import { prisma } from "@/lib/prisma";
import { Package } from "lucide-react";
import { CharterPackagesPageContent } from "@/components/charter-packages/CharterPackagesPageContent";
import { charterPackageFiltersSchema } from "@/lib/validations/charter-package-filters";
import { PackageType } from "@/services/packages/types";

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
  const where: any = { isActive: true, type: PackageType.INBOUND };

  if (filters.destinationCountry) {
    where.destinationCountry = filters.destinationCountry;
  }
  if (filters.destinationCity) {
    where.destinationCity = { contains: filters.destinationCity, mode: "insensitive" };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceConditions: any[] = [];
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
    where.OR = priceConditions;
  }

  if (filters.minNights !== undefined) {
    where.nights = { ...where.nights, gte: filters.minNights };
  }
  if (filters.maxNights !== undefined) {
    where.nights = { ...where.nights, lte: filters.maxNights };
  }

  if (filters.minDays !== undefined) {
    where.days = { ...where.days, gte: filters.minDays };
  }
  if (filters.maxDays !== undefined) {
    where.days = { ...where.days, lte: filters.maxDays };
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
  let orderBy: any = { createdAt: "desc" };
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

  let packages: any[] = [];
  let total = 0;
  let filterOptions: any = null;

  try {
    const [packagesData, totalCount, filterOptionsData] = await Promise.all([
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
      prisma.charterTravelPackage.findMany({
        where: { isActive: true, type: PackageType.INBOUND },
        select: {
          destinationCountry: true,
          destinationCity: true,
          priceRangeMin: true,
          priceRangeMax: true,
          basePrice: true,
          nights: true,
          days: true,
          hotelOptions: {
            select: {
              starRating: true,
            },
          },
          type: true,
        },
      }),
    ]);

    packages = packagesData.map((pkg) => ({
      ...pkg,
      basePrice: pkg.basePrice ? Number(pkg.basePrice) : null,
      priceRangeMin: pkg.priceRangeMin ? Number(pkg.priceRangeMin) : null,
      priceRangeMax: pkg.priceRangeMax ? Number(pkg.priceRangeMax) : null,
      discount: pkg.discount ? Number(pkg.discount) : null,
    }));
    total = totalCount;

    // Process filter options
    const countries = Array.from(new Set(filterOptionsData.map((p) => p.destinationCountry))).sort();
    const citiesByCountry: Record<string, string[]> = {};
    filterOptionsData.forEach((p) => {
      if (!citiesByCountry[p.destinationCountry]) {
        citiesByCountry[p.destinationCountry] = [];
      }
      if (!citiesByCountry[p.destinationCountry].includes(p.destinationCity)) {
        citiesByCountry[p.destinationCountry].push(p.destinationCity);
      }
    });

    const allPrices = filterOptionsData
      .flatMap((p) => [
        p.priceRangeMin ? Number(p.priceRangeMin) : null,
        p.priceRangeMax ? Number(p.priceRangeMax) : null,
        p.basePrice ? Number(p.basePrice) : null,
      ])
      .filter((p): p is number => p !== null);

    const allNights = filterOptionsData.map((p) => p.nights);
    const allDays = filterOptionsData.map((p) => p.days);

    const hotelRatings = Array.from(
      new Set(
        filterOptionsData
          .flatMap((p) => p.hotelOptions.map((h) => h.starRating))
          .filter((r): r is number => r !== null)
      )
    ).sort();

    const packageTypes = Array.from(
      new Set(filterOptionsData.map((pkg) => pkg.type))
    ) as PackageType[];

    filterOptions = {
      countries,
      cities: citiesByCountry,
      priceRange: {
        min: allPrices.length > 0 ? Math.min(...allPrices) : 0,
        max: allPrices.length > 0 ? Math.max(...allPrices) : 100000,
        currency: "EGP",
      },
      durationRange: {
        minNights: allNights.length > 0 ? Math.min(...allNights) : 1,
        maxNights: allNights.length > 0 ? Math.max(...allNights) : 30,
        minDays: allDays.length > 0 ? Math.min(...allDays) : 1,
        maxDays: allDays.length > 0 ? Math.max(...allDays) : 31,
      },
      hotelRatings,
      packageTypes,
    };
  } catch (error: any) {
    console.error("Database connection error:", error);
    packages = [];
    total = 0;
    filterOptions = {
      countries: [],
      cities: {},
      priceRange: { min: 0, max: 100000, currency: "EGP" },
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
      initialFilterOptions={filterOptions}
    />
  );
}

