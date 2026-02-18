"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  createdAt: Date | string;
  user: {
    name: string | null;
    email: string;
  };
  entityType: "tour" | "hotel" | "package";
  entityName: string;
  entityId: string;
}

interface ReviewsListProps {
  reviews: Review[];
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = async (reviewId: string, entityType: "tour" | "hotel" | "package") => {
    setProcessing(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}?type=${entityType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || "Failed to approve review");
      }

      toast({
        title: "Review approved!",
        description: "The review has been published.",
        variant: "default",
      });
      router.refresh();
    } catch (error: any) {
      console.error("Error approving review:", error);
      toast({
        title: "Failed to approve review",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (reviewId: string, entityType: "tour" | "hotel" | "package") => {
    setProcessing(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}?type=${entityType}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || "Failed to reject review");
      }

      toast({
        title: "Review rejected",
        description: "The review has been removed.",
        variant: "default",
      });
      router.refresh();
    } catch (error: any) {
      console.error("Error rejecting review:", error);
      toast({
        title: "Failed to reject review",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No reviews found
              </TableCell>
            </TableRow>
          ) : (
            reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>{review.user.name || review.user.email}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {review.entityName}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {review.entityType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
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
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {review.title || "No title"}
                </TableCell>
                <TableCell>
                  {review.isApproved ? (
                    <Badge variant="default">Approved</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>{formatDate(review.createdAt)}</TableCell>
                <TableCell>
                  {!review.isApproved && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove(review.id, review.entityType)}
                        disabled={processing === review.id}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReject(review.id, review.entityType)}
                        disabled={processing === review.id}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

