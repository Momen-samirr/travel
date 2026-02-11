import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hotelSchema } from "@/lib/validations/hotel";
import { requireAdmin } from "@/lib/clerk";
import { logActivity, ActivityActions } from "@/lib/activity-log";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const city = searchParams.get("city");
    const country = searchParams.get("country");
    const isActive = searchParams.get("isActive") !== "false";

    const where: any = {};
    if (city) where.city = city;
    if (country) where.country = country;
    if (isActive) where.isActive = true;

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.hotel.count({ where }),
    ]);

    return NextResponse.json({
      hotels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching hotels:", error);
    return NextResponse.json(
      { error: "Failed to fetch hotels" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const data = hotelSchema.parse(body);

    const hotel = await prisma.hotel.create({
      data: {
        ...data,
        amenities: data.amenities as any,
        images: data.images as any,
      },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.HOTEL_CREATED,
      entityType: "Hotel",
      entityId: hotel.id,
    });

    return NextResponse.json(hotel, { status: 201 });
  } catch (error: any) {
    console.error("Error creating hotel:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create hotel" },
      { status: 500 }
    );
  }
}

