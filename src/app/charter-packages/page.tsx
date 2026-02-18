import { prisma } from "@/lib/prisma";
import { Package } from "lucide-react";
import { CharterPackagesPageContent } from "@/components/charter-packages/CharterPackagesPageContent";
import { charterPackageFiltersSchema } from "@/lib/validations/charter-package-filters";
import { PackageType } from "@/services/packages/types";

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
  const where: any = { isActive: true, type: PackageType.CHARTER };

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
    if (priceConditions.length > 0) {
      where.OR = priceConditions;
    }
  }

  if (filters.minNights !== undefined) {
    where.nights = { gte: filters.minNights };
  }
  if (filters.maxNights !== undefined) {
    where.nights = { ...where.nights, lte: filters.maxNights };
  }
  if (filters.minDays !== undefined) {
    where.days = { gte: filters.minDays };
  }
  if (filters.maxDays !== undefined) {
    where.days = { ...where.days, lte: filters.maxDays };
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
      // Fetch filter options
      prisma.charterTravelPackage.findMany({
        where: { isActive: true },
        select: {
          destinationCountry: true,
          destinationCity: true,
          priceRangeMin: true,
          priceRangeMax: true,
          basePrice: true,
          nights: true,
          days: true,
          type: true,
          hotelOptions: {
            where: { isActive: true },
            select: { starRating: true },
          },
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
    const countries = Array.from(
      new Set(filterOptionsData.map((pkg) => pkg.destinationCountry))
    ).sort();

    const citiesByCountry: Record<string, string[]> = {};
    filterOptionsData.forEach((pkg) => {
      if (!citiesByCountry[pkg.destinationCountry]) {
        citiesByCountry[pkg.destinationCountry] = [];
      }
      if (!citiesByCountry[pkg.destinationCountry].includes(pkg.destinationCity)) {
        citiesByCountry[pkg.destinationCountry].push(pkg.destinationCity);
      }
    });

    Object.keys(citiesByCountry).forEach((country) => {
      citiesByCountry[country].sort();
    });

    const prices = filterOptionsData
      .map((pkg) => [
        pkg.priceRangeMin ? Number(pkg.priceRangeMin) : null,
        pkg.priceRangeMax ? Number(pkg.priceRangeMax) : null,
        pkg.basePrice ? Number(pkg.basePrice) : null,
      ])
      .flat()
      .filter((price): price is number => price !== null);

    const nights = filterOptionsData.map((pkg) => pkg.nights);
    const days = filterOptionsData.map((pkg) => pkg.days);

    const hotelRatings = Array.from(
      new Set(
        filterOptionsData
          .flatMap((pkg) =>
            pkg.hotelOptions
              .map((opt) => opt.starRating)
              .filter((rating): rating is number => rating !== null)
          )
      )
    ).sort();

        const packageTypes = Array.from(
          new Set(filterOptionsData.map((pkg) => pkg.type))
        ) as PackageType[];

    filterOptions = {
      countries,
      cities: citiesByCountry,
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 100000,
        currency: "EGP",
      },
      durationRange: {
        minNights: nights.length > 0 ? Math.min(...nights) : 3,
        maxNights: nights.length > 0 ? Math.max(...nights) : 21,
        minDays: days.length > 0 ? Math.min(...days) : 4,
        maxDays: days.length > 0 ? Math.max(...days) : 22,
      },
      hotelRatings,
      packageTypes,
    };
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

      <CharterPackagesPageContent
        initialPackages={packages}
        initialTotal={total}
        initialPage={page}
        initialFilterOptions={filterOptions}
      />
    </div>
  );
}

