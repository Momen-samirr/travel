import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Star, Check } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { HotelReviewForm } from "@/components/hotels/review-form";
import { getCurrentUser } from "@/lib/clerk";
import { SignInButton } from "@clerk/nextjs";
import { Lock, LogIn } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await prisma.hotel.findUnique({
    where: { slug },
  });

  if (!hotel) {
    return { title: "Hotel Not Found" };
  }

  return {
    title: hotel.name,
    description: hotel.description,
  };
}

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hotel = await prisma.hotel.findUnique({
    where: { slug },
    include: {
      reviews: {
        where: { isApproved: true },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!hotel || !hotel.isActive) {
    notFound();
  }

  const images = hotel.images as string[];
  const amenities = hotel.amenities as string[];
  const avgRating =
    hotel.reviews.length > 0
      ? hotel.reviews.reduce((sum, review) => sum + review.rating, 0) / hotel.reviews.length
      : 0;

  // Check if user is authenticated for review form
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // User not authenticated
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {images.slice(0, 4).map((image, index) => (
              <div key={index} className="relative h-64 rounded-lg overflow-hidden">
                <Image
                  src={image}
                  alt={`${hotel.name} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>About This Hotel</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{hotel.description}</p>
            </CardContent>
          </Card>

          {amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hotel.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Reviews</CardTitle>
                  {avgRating > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{avgRating.toFixed(1)}</span>
                      <span className="text-gray-600">({hotel.reviews.length} reviews)</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hotel.reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
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
                        <span className="font-semibold">{review.user.name || "Anonymous"}</span>
                      </div>
                      {review.title && (
                        <div className="font-medium mb-1">{review.title}</div>
                      )}
                      {review.comment && (
                        <p className="text-gray-600">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {user ? (
            <Card>
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
              </CardHeader>
              <CardContent>
                <HotelReviewForm hotelId={hotel.id} />
              </CardContent>
            </Card>
          ) : (
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
                <SignInButton mode="modal" fallbackRedirectUrl={`/hotels/${hotel.slug}`}>
                  <Button className="w-full">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In to Review
                  </Button>
                </SignInButton>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{hotel.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-5 w-5" />
                <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
              </div>
              {(hotel.rating || avgRating > 0) && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {avgRating > 0 ? avgRating.toFixed(1) : hotel.rating}
                  </span>
                  {avgRating > 0 && (
                    <span className="text-sm text-gray-600">
                      ({hotel.reviews.length} reviews)
                    </span>
                  )}
                </div>
              )}
              {hotel.checkInTime && hotel.checkOutTime && (
                <div className="text-sm text-gray-600">
                  <div>Check-in: {hotel.checkInTime}</div>
                  <div>Check-out: {hotel.checkOutTime}</div>
                </div>
              )}
              <div className="pt-4 border-t">
                <div className="text-3xl font-bold text-primary mb-4">
                </div>
                <Button asChild className="w-full" size="lg">
                  <Link href={`/hotels/${hotel.slug}/book`}>Book Now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

