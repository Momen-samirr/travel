"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Star, Lock, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  charterPackageReviewSchema,
  type CharterPackageReviewInput,
} from "@/lib/validations/charter-package";

interface PackageReviewFormProps {
  packageId: string;
}

export function PackageReviewForm({ packageId }: PackageReviewFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useUser();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CharterPackageReviewInput>({
    resolver: zodResolver(charterPackageReviewSchema),
    defaultValues: {
      rating: 0,
      title: "",
      comment: "",
      images: null,
    },
  });

  const onSubmit = async (data: CharterPackageReviewInput) => {
    // Check authentication before submitting
    if (!isLoaded) {
      toast({
        title: "Please wait",
        description: "Checking authentication...",
        variant: "default",
      });
      return;
    }

    if (!isSignedIn) {
      const currentPath = window.location.pathname;
      const redirectUrl = `${currentPath}${window.location.search}`;
      
      toast({
        title: "Sign In Required",
        description: "Please sign in to submit a review.",
        variant: "default",
      });
      
      router.push(`/sign-in?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/charter-packages/${packageId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          rating,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || "Failed to submit review");
      }

      router.refresh();
      form.reset();
      setRating(0);
      toast({
        title: "Review submitted!",
        description: "Your review will be published after admin approval.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Failed to submit review",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Show sign-in prompt if user is not authenticated
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Sign In to Leave a Review</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Share your experience and help other travelers make informed decisions.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SignInButton mode="modal" fallbackRedirectUrl={window.location.pathname}>
            <Button className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to Review
            </Button>
          </SignInButton>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={() => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            setRating(star);
                            form.setValue("rating", star);
                          }}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= (hoverRating || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={rating === 0 || submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

