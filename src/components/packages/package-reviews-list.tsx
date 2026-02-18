"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerified: boolean;
  createdAt: Date | string;
  user: {
    name: string | null;
  };
}

interface PackageReviewsListProps {
  reviews: Review[];
  averageRating: number;
}

export function PackageReviewsList({
  reviews,
  averageRating,
}: PackageReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No reviews yet. Be the first to review this package!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reviews</CardTitle>
          {averageRating > 0 && (
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">
                    {review.user.name || "Anonymous"}
                  </div>
                  {review.isVerified && (
                    <div
                      className="flex items-center gap-1"
                      title="Verified Purchase"
                    >
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Verified
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.title && (
                <div className="font-medium mb-2 text-lg">{review.title}</div>
              )}
              {review.comment && (
                <div className="text-sm text-muted-foreground mb-2 whitespace-pre-line">
                  {review.comment}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {formatDate(new Date(review.createdAt))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

