import { NextRequest, NextResponse } from "next/server";
import { unifiedPackageService } from "@/services/packages/unified/UnifiedPackageService";
import { PackageType } from "@/services/packages/types";
import { charterPackageFiltersSchema } from "@/lib/validations/charter-package-filters";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    const validatedParams = charterPackageFiltersSchema.parse(params);

    const result = await unifiedPackageService.searchPackages({
      type: validatedParams.packageType,
      destinationCountry: validatedParams.destinationCountry,
      destinationCity: validatedParams.destinationCity,
      minPrice: validatedParams.minPrice,
      maxPrice: validatedParams.maxPrice,
      minNights: validatedParams.minNights,
      maxNights: validatedParams.maxNights,
      minDays: validatedParams.minDays,
      maxDays: validatedParams.maxDays,
      departureDateFrom: validatedParams.departureDateFrom,
      departureDateTo: validatedParams.departureDateTo,
      hotelRating: validatedParams.hotelRating,
      page: validatedParams.page,
      pageSize: validatedParams.limit,
    });

    return NextResponse.json({
      packages: result.packages,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    console.error("[API /packages] Error searching packages:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to search packages" },
      { status: 500 }
    );
  }
}

