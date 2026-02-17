import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { charterPackageSchema } from "@/lib/validations/charter-package";
import { requireAdmin } from "@/lib/clerk";
import { logActivity, ActivityActions } from "@/lib/activity-log";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const destinationCountry = searchParams.get("destinationCountry");
    const destinationCity = searchParams.get("destinationCity");
    const isActive = searchParams.get("isActive") !== "false";

    const where: any = {};
    if (destinationCountry) where.destinationCountry = destinationCountry;
    if (destinationCity) where.destinationCity = destinationCity;
    if (isActive) where.isActive = true;

    const [packages, total] = await Promise.all([
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
              addons: true,
            },
          },
        },
      }),
      prisma.charterTravelPackage.count({ where }),
    ]);

    return NextResponse.json({
      packages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching charter packages:", error);
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

