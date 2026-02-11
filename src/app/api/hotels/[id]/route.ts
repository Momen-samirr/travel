import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hotelSchema } from "@/lib/validations/hotel";
import { requireAdmin } from "@/lib/clerk";
import { logActivity, ActivityActions } from "@/lib/activity-log";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hotel = await prisma.hotel.findUnique({
      where: { id },
    });

    if (!hotel) {
      return NextResponse.json(
        { error: "Hotel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(hotel);
  } catch (error) {
    console.error("Error fetching hotel:", error);
    return NextResponse.json(
      { error: "Failed to fetch hotel" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const data = hotelSchema.parse(body);

    const hotel = await prisma.hotel.update({
      where: { id },
      data: {
        ...data,
        amenities: data.amenities as any,
        images: data.images as any,
      },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.HOTEL_UPDATED,
      entityType: "Hotel",
      entityId: id,
    });

    return NextResponse.json(hotel);
  } catch (error: any) {
    console.error("Error updating hotel:", error);
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
      { error: "Failed to update hotel" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    await prisma.hotel.delete({
      where: { id },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.HOTEL_UPDATED, // We can add HOTEL_DELETED if needed
      entityType: "Hotel",
      entityId: id,
      details: { deleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting hotel:", error);
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete hotel" },
      { status: 500 }
    );
  }
}

