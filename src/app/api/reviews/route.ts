import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/clerk";
import { z } from "zod";

const reviewSchema = z.object({
  tourId: z.string().optional().nullable(),
  hotelId: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  images: z.array(z.string().url()).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tourId = searchParams.get("tourId");
    const hotelId = searchParams.get("hotelId");
    const isApproved = searchParams.get("isApproved") !== "false";

    const where: any = {};
    if (tourId) where.tourId = tourId;
    if (hotelId) where.hotelId = hotelId;
    if (isApproved) where.isApproved = true;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        tour: {
          select: {
            title: true,
            slug: true,
          },
        },
        hotel: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      reviews,
      averageRating: avgRating,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = reviewSchema.parse(body);

    // Check if user has a verified purchase (booking)
    let isVerified = false;
    if (data.tourId) {
      const booking = await prisma.booking.findFirst({
        where: {
          userId: user.id,
          tourId: data.tourId,
          status: "COMPLETED",
          paymentStatus: "PAID",
        },
      });
      isVerified = !!booking;
    } else if (data.hotelId) {
      const booking = await prisma.booking.findFirst({
        where: {
          userId: user.id,
          hotelId: data.hotelId,
          status: "COMPLETED",
          paymentStatus: "PAID",
        },
      });
      isVerified = !!booking;
    }

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        tourId: data.tourId,
        hotelId: data.hotelId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        images: data.images as any,
        isVerified,
        isApproved: false, // Requires admin moderation
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error("Error creating review:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

