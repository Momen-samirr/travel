import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hotelSchema } from "@/lib/validations/hotel";
import { requireAdmin } from "@/lib/clerk";
import { logActivity, ActivityActions } from "@/lib/activity-log";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get("isActive") !== "false";

    const where: any = {};
    if (isActive) where.isActive = true;

    const hotels = await prisma.hotel.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(hotels);
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

    // Auto-generate slug from name
    let slug = slugify(data.name);
    let slugExists = await prisma.hotel.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${slugify(data.name)}-${counter}`;
      slugExists = await prisma.hotel.findUnique({ where: { slug } });
      counter++;
    }

    const hotel = await prisma.hotel.create({
      data: {
        ...data,
        slug,
        placeId: (data as any).placeId || null,
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
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create hotel" },
      { status: 500 }
    );
  }
}
