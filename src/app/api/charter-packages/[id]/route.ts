import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { charterPackageSchema } from "@/lib/validations/charter-package";
import { requireAdmin } from "@/lib/clerk";
import { logActivity, ActivityActions } from "@/lib/activity-log";
import { slugify } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pkg = await prisma.charterTravelPackage.findUnique({
      where: { id },
      include: {
        departureOptions: true,
        hotelOptions: {
          include: {
            hotel: true,
          },
        },
        addons: true,
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

    if (!pkg) {
      return NextResponse.json(
        { error: "Charter package not found" },
        { status: 404 }
      );
    }

    const avgRating = pkg.reviews.length > 0
      ? pkg.reviews.reduce((sum, review) => sum + review.rating, 0) / pkg.reviews.length
      : 0;

    return NextResponse.json({
      ...pkg,
      averageRating: avgRating,
      reviewCount: pkg.reviews.length,
    });
  } catch (error) {
    console.error("Error fetching charter package:", error);
    return NextResponse.json(
      { error: "Failed to fetch charter package" },
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
    const data = charterPackageSchema.parse(body);

    // Auto-generate slug from name if not provided or empty
    let slug = data.slug?.trim();
    if (!slug && data.name) {
      slug = slugify(data.name);
      // Ensure uniqueness by checking if slug exists (excluding current package)
      let uniqueSlug = slug;
      let counter = 1;
      while (await prisma.charterTravelPackage.findFirst({ 
        where: { 
          slug: uniqueSlug,
          id: { not: id }
        } 
      })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;
    }

    const pkg = await prisma.charterTravelPackage.update({
      where: { id },
      data: {
        ...data,
        slug: slug || data.slug,
        gallery: data.gallery as any,
        includedServices: data.includedServices as any,
        excludedServices: data.excludedServices as any,
        excursionProgram: data.excursionProgram as any,
        requiredDocuments: data.requiredDocuments as any,
      },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.TOUR_UPDATED,
      entityType: "CharterTravelPackage",
      entityId: id,
    });

    return NextResponse.json(pkg);
  } catch (error: any) {
    console.error("Error updating charter package:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update charter package" },
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
    await prisma.charterTravelPackage.delete({
      where: { id },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.TOUR_DELETED,
      entityType: "CharterTravelPackage",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting charter package:", error);
    return NextResponse.json(
      { error: "Failed to delete charter package" },
      { status: 500 }
    );
  }
}

