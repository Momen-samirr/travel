import { PackageType } from "@/services/packages/types";
import type { TravelPackage } from "@/services/packages/types";
import { PackagesPageContent } from "@/components/packages/PackagesPageContent";
import { Metadata } from "next";
import { charterPackageFiltersSchema } from "@/lib/validations/charter-package-filters";
import { unifiedPackageService } from "@/services/packages/unified/UnifiedPackageService";
import { getPackageFilterOptions } from "@/lib/package-filter-options";

export const metadata: Metadata = {
  title: "Travel Packages",
  description: "Browse our complete travel packages with flights, hotels, and more",
};

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    packageType?: string;
    type?: string;
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
    sortBy?: string;
  }>;
}) {
  const params = await searchParams;
  const normalizedPackageType =
    params.packageType ||
    (params.type ? params.type.toUpperCase() : undefined);
  const filters = charterPackageFiltersSchema.parse({
    ...params,
    packageType: normalizedPackageType,
  });

  let packages: TravelPackage[] = [];
  let total = 0;
  let page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 12;
  let filterOptions: Awaited<ReturnType<typeof getPackageFilterOptions>> | null = null;

  try {
    const [result, cachedFilterOptions] = await Promise.all([
      unifiedPackageService.searchPackages({
        type: filters.packageType,
        destinationCountry: filters.destinationCountry,
        destinationCity: filters.destinationCity,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minNights: filters.minNights,
        maxNights: filters.maxNights,
        minDays: filters.minDays,
        maxDays: filters.maxDays,
        departureDateFrom: filters.departureDateFrom,
        departureDateTo: filters.departureDateTo,
        hotelRating: filters.hotelRating,
        page: filters.page,
        pageSize: filters.limit,
      }),
      getPackageFilterOptions(filters.packageType),
    ]);

    packages = result.packages;
    total = result.total;
    page = result.page ?? 1;
    filterOptions = cachedFilterOptions;
  } catch (error) {
    console.error("Database connection error:", error);
    packages = [];
    total = 0;
  }

  return (
    <PackagesPageContent
      packages={packages}
      total={total}
      page={page}
      limit={limit}
      selectedType={filters.packageType as PackageType | undefined}
      initialFilterOptions={filterOptions ?? undefined}
    />
  );
}

