import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Reviews",
  description: "Read what our customers say about their experiences",
};

export default async function ReviewsPage() {
  const reviews = await prisma.review.findMany({
    where: { isApproved: true },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      tour: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Customer Reviews</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
          </div>
          <span className="text-gray-600">
            Based on {reviews.length} reviews
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{review.title || "Review"}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-semibold">
                      {review.user.name || "Anonymous"}
                    </span>
                    {review.isVerified && (
                      <span title="Verified Purchase">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {review.tour && (
                <div className="text-sm text-gray-600 mb-2">
                  Tour: {review.tour.title}
                </div>
              )}
              {review.comment && (
                <p className="text-gray-700 mb-4">{review.comment}</p>
              )}
              {review.images && (review.images as string[]).length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {(review.images as string[]).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                  ))}
                </div>
              )}
              <div className="text-sm text-gray-500">
                {formatDate(review.createdAt)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No reviews yet.</p>
        </div>
      )}
    </div>
  );
}

