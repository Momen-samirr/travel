import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { ReviewsList } from "@/components/admin/reviews-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  // Fetch both review types in parallel
  const [tourHotelReviews, packageReviews] = await Promise.all([
    prisma.review.findMany({
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
            id: true,
          },
        },
        hotel: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.charterPackageReview.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        package: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Normalize both review types into unified structure
  const unifiedReviews = [
    ...tourHotelReviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isApproved: review.isApproved,
      createdAt: review.createdAt,
      user: review.user,
      entityType: review.tourId ? ("tour" as const) : ("hotel" as const),
      entityName: review.tour?.title || review.hotel?.name || "Unknown",
      entityId: review.tourId || review.hotelId || "",
    })),
    ...packageReviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isApproved: review.isApproved,
      createdAt: review.createdAt,
      user: review.user,
      entityType: "package" as const,
      entityName: review.package?.name || "Unknown Package",
      entityId: review.packageId,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Reviews</h1>
      <ReviewsList reviews={unifiedReviews} />
    </div>
  );
}

