import { prisma } from "@/lib/prisma";
import { Package } from "lucide-react";
import { StaggerList } from "@/components/motion/stagger-list";
import { PackageCard } from "@/components/packages/shared/PackageCard";
import { PackageType } from "@/services/packages/types";
import { PackagesPageContent } from "@/components/packages/PackagesPageContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Travel Packages",
  description: "Browse our complete travel packages with flights, hotels, and more",
};

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    type?: string;
    destinationCountry?: string;
    destinationCity?: string;
  }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 12;

  const where: any = { isActive: true };
  
  // Filter by type if provided
  if (params.type) {
    where.type = params.type.toUpperCase() as PackageType;
  }
  
  if (params.destinationCountry) {
    where.destinationCountry = params.destinationCountry;
  }
  if (params.destinationCity) {
    where.destinationCity = params.destinationCity;
  }

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
    <PackagesPageContent
      packages={packages}
      total={total}
      page={page}
      limit={limit}
      selectedType={params.type as PackageType | undefined}
    />
  );
}

