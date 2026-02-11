import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tourSchema } from "@/lib/validations/tour";
import { requireAdmin } from "@/lib/clerk";
import { logActivity, ActivityActions } from "@/lib/activity-log";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const featured = searchParams.get("featured") === "true";
    const isActive = searchParams.get("isActive") !== "false";

    const where: any = {};
    if (category) where.category = category;
    if (featured) where.isFeatured = true;
    if (isActive) where.isActive = true;

    const [tours, total] = await Promise.all([
      prisma.tour.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.tour.count({ where }),
    ]);

    return NextResponse.json({
      tours,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tours:", error);
    return NextResponse.json(
      { error: "Failed to fetch tours" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const data = tourSchema.parse(body);

    const tour = await prisma.tour.create({
      data: {
        ...data,
        images: data.images as any,
        itinerary: data.itinerary as any,
      },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.TOUR_CREATED,
      entityType: "Tour",
      entityId: tour.id,
    });

    return NextResponse.json(tour, { status: 201 });
  } catch (error: any) {
    console.error("Error creating tour:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create tour" },
      { status: 500 }
    );
  }
}

