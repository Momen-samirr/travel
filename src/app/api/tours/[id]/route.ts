import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tourSchema } from "@/lib/validations/tour";
import { requireAdmin } from "@/lib/clerk";
import { logActivity, ActivityActions } from "@/lib/activity-log";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!tour) {
      return NextResponse.json(
        { error: "Tour not found" },
        { status: 404 }
      );
    }

    // Calculate average rating
    const avgRating = tour.reviews.length > 0
      ? tour.reviews.reduce((sum, review) => sum + review.rating, 0) / tour.reviews.length
      : 0;

    return NextResponse.json({
      ...tour,
      averageRating: avgRating,
      reviewCount: tour.reviews.length,
    });
  } catch (error) {
    console.error("Error fetching tour:", error);
    return NextResponse.json(
      { error: "Failed to fetch tour" },
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
    const data = tourSchema.parse(body);

    const tour = await prisma.tour.update({
      where: { id },
      data: {
        ...data,
        images: data.images as any,
        itinerary: data.itinerary as any,
      },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.TOUR_UPDATED,
      entityType: "Tour",
      entityId: id,
    });

    return NextResponse.json(tour);
  } catch (error: any) {
    console.error("Error updating tour:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update tour" },
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
    await prisma.tour.delete({
      where: { id },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.TOUR_DELETED,
      entityType: "Tour",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tour:", error);
    return NextResponse.json(
      { error: "Failed to delete tour" },
      { status: 500 }
    );
  }
}

