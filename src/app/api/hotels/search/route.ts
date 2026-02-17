import { NextRequest, NextResponse } from "next/server";
import { UnifiedSearchService } from "@/services/hotels/unifiedSearchService";
import { HotelProvider } from "@/services/hotels/types";
import { z } from "zod";

const searchParamsSchema = z.object({
  // Search parameters
  city: z.string().optional(),
  country: z.string().optional(),
  cityCode: z.string().optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  adults: z.string().transform(Number).optional(),
  children: z.string().transform(Number).optional(),
  currencyCode: z.string().optional().default("EGP"),

  // Filters
  sources: z.string().optional().transform((val) => {
    if (!val) return undefined;
    return val.split(",").map((s) => s.trim().toUpperCase() as HotelProvider);
  }),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  minRating: z.string().transform(Number).optional(),
  maxRating: z.string().transform(Number).optional(),
  amenities: z.string().optional().transform((val) => {
    if (!val) return undefined;
    return val.split(",").map((a) => a.trim());
  }),
  searchQuery: z.string().optional(),

  // Sorting and pagination
  sortBy: z.enum(["price", "rating", "distance"]).optional().default("price"),
  page: z.string().transform(Number).optional().default(1),
  pageSize: z.string().transform(Number).optional().default(20),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    // Validate parameters
    const validatedParams = searchParamsSchema.parse(params);

    // Validate date logic
    if (validatedParams.checkInDate && validatedParams.checkOutDate) {
      if (new Date(validatedParams.checkOutDate) <= new Date(validatedParams.checkInDate)) {
        return NextResponse.json(
          { error: "checkOutDate must be after checkInDate" },
          { status: 400 }
        );
      }
    }

    // Validate at least one search parameter
    if (!validatedParams.city && !validatedParams.cityCode && !validatedParams.country) {
      return NextResponse.json(
        { error: "At least one of city, cityCode, or country is required" },
        { status: 400 }
      );
    }

    // Build search options
    const searchOptions = {
      city: validatedParams.city,
      country: validatedParams.country,
      cityCode: validatedParams.cityCode,
      checkInDate: validatedParams.checkInDate,
      checkOutDate: validatedParams.checkOutDate,
      adults: validatedParams.adults,
      children: validatedParams.children,
      currencyCode: validatedParams.currencyCode,
      filters: {
        sources: validatedParams.sources,
        minPrice: validatedParams.minPrice,
        maxPrice: validatedParams.maxPrice,
        minRating: validatedParams.minRating,
        maxRating: validatedParams.maxRating,
        amenities: validatedParams.amenities,
        searchQuery: validatedParams.searchQuery,
      },
      sortBy: validatedParams.sortBy,
      page: validatedParams.page,
      pageSize: validatedParams.pageSize,
    };

    // Perform search
    const service = new UnifiedSearchService();
    const result = await service.searchHotels(searchOptions);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API /hotels/search] Error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to search hotels" },
      { status: 500 }
    );
  }
}

