import { PackageType } from "@/services/packages/types";
import { prisma } from "./prisma";
import { DEFAULT_CURRENCY, normalizeCurrency } from "./currency";

export interface PackageFilterOptions {
  countries: string[];
  cities: Record<string, string[]>;
  priceRange: { min: number; max: number; currency: string };
  durationRange: {
    minNights: number;
    maxNights: number;
    minDays: number;
    maxDays: number;
  };
  hotelRatings: number[];
  packageTypes: PackageType[];
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const metadataCache = new Map<
  string,
  { expiresAt: number; data: PackageFilterOptions }
>();
const inFlightRequests = new Map<string, Promise<PackageFilterOptions>>();

function getCacheKey(packageType?: PackageType) {
  return packageType ?? "ALL";
}

function withFallbackDefaults(data: Partial<PackageFilterOptions>): PackageFilterOptions {
  return {
    countries: data.countries ?? [],
    cities: data.cities ?? {},
    priceRange: data.priceRange ?? {
      min: 0,
      max: 100000,
      currency: DEFAULT_CURRENCY,
    },
    durationRange:
      data.durationRange ?? {
        minNights: 1,
        maxNights: 30,
        minDays: 1,
        maxDays: 31,
      },
    hotelRatings: data.hotelRatings ?? [],
    packageTypes: data.packageTypes ?? [],
  };
}

async function buildFilterOptions(packageType?: PackageType): Promise<PackageFilterOptions> {
  const packages = await prisma.charterTravelPackage.findMany({
    where: {
      isActive: true,
      ...(packageType ? { type: packageType } : {}),
    },
    select: {
      destinationCountry: true,
      destinationCity: true,
      currency: true,
      priceRangeMin: true,
      priceRangeMax: true,
      basePrice: true,
      nights: true,
      days: true,
      type: true,
      hotelOptions: {
        where: { isActive: true },
        select: {
          starRating: true,
        },
      },
    },
  });

  const countries = Array.from(
    new Set(packages.map((pkg) => pkg.destinationCountry))
  ).sort();

  const citiesByCountry: Record<string, string[]> = {};
  packages.forEach((pkg) => {
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

  const prices = packages
    .flatMap((pkg) => [
      pkg.priceRangeMin ? Number(pkg.priceRangeMin) : null,
      pkg.priceRangeMax ? Number(pkg.priceRangeMax) : null,
      pkg.basePrice ? Number(pkg.basePrice) : null,
    ])
    .filter((price): price is number => price !== null);

  const nights = packages.map((pkg) => pkg.nights);
  const days = packages.map((pkg) => pkg.days);

  const hotelRatings = Array.from(
    new Set(
      packages
        .flatMap((pkg) =>
          pkg.hotelOptions
            .map((option) => option.starRating)
            .filter((rating): rating is number => rating !== null)
        )
    )
  ).sort((a, b) => a - b);

  const packageTypes = Array.from(
    new Set(packages.map((pkg) => pkg.type))
  ) as PackageType[];

  const currencies = Array.from(
    new Set(packages.map((pkg) => normalizeCurrency(pkg.currency)))
  );
  const resolvedCurrency =
    currencies.length === 1 ? currencies[0] : DEFAULT_CURRENCY;

  return withFallbackDefaults({
    countries,
    cities: citiesByCountry,
    priceRange: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 100000,
      currency: resolvedCurrency,
    },
    durationRange: {
      minNights: nights.length > 0 ? Math.min(...nights) : 1,
      maxNights: nights.length > 0 ? Math.max(...nights) : 30,
      minDays: days.length > 0 ? Math.min(...days) : 1,
      maxDays: days.length > 0 ? Math.max(...days) : 31,
    },
    hotelRatings,
    packageTypes,
  });
}

export async function getPackageFilterOptions(
  packageType?: PackageType
): Promise<PackageFilterOptions> {
  const cacheKey = getCacheKey(packageType);
  const now = Date.now();
  const cached = metadataCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const existingRequest = inFlightRequests.get(cacheKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = buildFilterOptions(packageType)
    .then((data) => {
      metadataCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, data });
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, request);
  return request;
}
