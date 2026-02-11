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

  const reviews = await prisma.review.findMany({
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
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });


  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Reviews</h1>
      <ReviewsList reviews={reviews} />
    </div>
  );
}

