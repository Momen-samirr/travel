import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { charterPackageSchema } from "@/lib/validations/charter-package";
import { charterPackageFiltersSchema } from "@/lib/validations/charter-package-filters";
import { requireAdmin } from "@/lib/clerk";
import { logActivity, ActivityActions } from "@/lib/activity-log";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());
    
    // Parse and validate filter parameters
    const filters = charterPackageFiltersSchema.parse(params);
    const isActive = searchParams.get("isActive") !== "false";

    // Build where clause
    const where: any = { isActive };

    // Destination filters
    if (filters.destinationCountry) {
      where.destinationCountry = filters.destinationCountry;
    }
    if (filters.destinationCity) {
      where.destinationCity = { contains: filters.destinationCity, mode: "insensitive" };
    }

    // Price filters
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

    // Duration filters
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

    // Date filters (check departure options)
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

    // Hotel rating filter (check hotel options)
    if (filters.hotelRating && filters.hotelRating.length > 0) {
      where.hotelOptions = {
        some: {
          isActive: true,
          starRating: { in: filters.hotelRating },
        },
      };
    }

    // Package type filter
    if (filters.packageType) {
      where.type = filters.packageType;
    }

    // Build orderBy clause
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
      case "popular":
        // Order by number of bookings (would need aggregation)
        orderBy = { createdAt: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const [packages, total] = await Promise.all([
      prisma.charterTravelPackage.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              departureOptions: true,
              hotelOptions: true,
              addons: true,
              bookings: true,
            },
          },
        },
      }),
      prisma.charterTravelPackage.count({ where }),
    ]);

    // Convert Decimal fields to numbers
    const formattedPackages = packages.map((pkg) => ({
      ...pkg,
      basePrice: pkg.basePrice ? Number(pkg.basePrice) : null,
      priceRangeMin: pkg.priceRangeMin ? Number(pkg.priceRangeMin) : null,
      priceRangeMax: pkg.priceRangeMax ? Number(pkg.priceRangeMax) : null,
      discount: pkg.discount ? Number(pkg.discount) : null,
    }));

    return NextResponse.json({
      packages: formattedPackages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching charter packages:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch charter packages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const data = charterPackageSchema.parse(body);

    // Auto-generate slug from name if not provided or empty
    let slug = data.slug?.trim();
    if (!slug && data.name) {
      slug = slugify(data.name);
      // Ensure uniqueness by checking if slug exists
      let uniqueSlug = slug;
      let counter = 1;
      while (await prisma.charterTravelPackage.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;
    }

    const pkg = await prisma.charterTravelPackage.create({
      data: {
        ...data,
        slug: slug || slugify(data.name),
        gallery: data.gallery as any,
        includedServices: data.includedServices as any,
        excludedServices: data.excludedServices as any,
        excursionProgram: data.excursionProgram as any,
        requiredDocuments: data.requiredDocuments as any,
      },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.TOUR_CREATED,
      entityType: "CharterTravelPackage",
      entityId: pkg.id,
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (error: any) {
    console.error("Error creating charter package:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create charter package" },
      { status: 500 }
    );
  }
}

