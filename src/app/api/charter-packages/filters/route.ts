import { NextRequest, NextResponse } from "next/server";
import { PackageType } from "@/services/packages/types";
import { getPackageFilterOptions } from "@/lib/package-filter-options";

export async function GET(request: NextRequest) {
  try {
    const packageTypeParam = request.nextUrl.searchParams.get("packageType");
    const parsedPackageType = Object.values(PackageType).includes(
      packageTypeParam as PackageType
    )
      ? (packageTypeParam as PackageType)
      : undefined;
    const filterOptions = await getPackageFilterOptions(parsedPackageType);
    return NextResponse.json(filterOptions);
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    );
  }
}

