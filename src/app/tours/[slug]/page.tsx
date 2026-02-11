import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Calendar, Users, Star } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { StructuredData } from "@/components/shared/structured-data";
import { ReviewForm } from "@/components/tours/review-form";
import { getCurrentUser } from "@/lib/clerk";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await prisma.tour.findUnique({
    where: { slug },
  });

  if (!tour) {
    return {
      title: "Tour Not Found",
    };
  }

  const images = tour.images as string[];
  const mainImage = images[0] || "";

  return {
    title: tour.title,
    description: tour.shortDescription,
    openGraph: {
      title: tour.title,
      description: tour.shortDescription,
      images: [mainImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tour.title,
      description: tour.shortDescription,
      images: [mainImage],
    },
  };
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tour = await prisma.tour.findUnique({
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
      },
    },
  });

  if (!tour || !tour.isActive) {
    notFound();
  }

  const images = tour.images as string[];
  const itinerary = tour.itinerary as Array<{
    day: number;
    title: string;
    description: string;
  }> | null;

  const price = tour.discountPrice ? Number(tour.discountPrice) : Number(tour.price);
  const originalPrice = tour.discountPrice ? Number(tour.price) : null;

  const avgRating = tour.reviews.length > 0
    ? tour.reviews.reduce((sum, review) => sum + review.rating, 0) / tour.reviews.length
    : 0;

  // Check if user is authenticated for review form
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // User not authenticated
  }

  return (
    <>
      <StructuredData type="tour" data={tour} />
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={images[0] || "/placeholder-tour.jpg"}
            alt={tour.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
        </div>
        <div className="container mx-auto px-4 h-full flex items-end pb-12 relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              {tour.isFeatured && (
                <Badge className="bg-accent text-accent-foreground">Featured</Badge>
              )}
              {tour.category && (
                <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                  {tour.category}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 text-shadow-lg">
              {tour.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">{tour.destination}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{tour.duration} days</span>
              </div>
              {avgRating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  <span>({tour.reviews.length} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-2 gap-4">
                {images.slice(1, 5).map((image, index) => (
                  <div key={index} className="relative h-48 rounded-xl overflow-hidden card-hover">
                    <Image
                      src={image}
                      alt={`${tour.title} - Image ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">About This Tour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none">
                <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                  {tour.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Itinerary */}
          {itinerary && itinerary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Itinerary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {itinerary.map((item, index) => (
                    <div key={index} className="relative pl-8">
                      <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{item.day}</span>
                      </div>
                      <div className="font-semibold text-lg mb-2">Day {item.day}: {item.title}</div>
                      <div className="text-muted-foreground leading-relaxed">{item.description}</div>
                      {index < itinerary.length - 1 && (
                        <div className="absolute left-3 top-6 w-0.5 h-full bg-border -z-10"></div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {tour.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Reviews ({tour.reviews.length})</CardTitle>
                  {avgRating > 0 && (
                    <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-lg">{avgRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {tour.reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-semibold">
                            {(review.user.name || "A")[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{review.user.name || "Anonymous"}</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.title && (
                            <div className="font-medium mb-2 text-foreground">{review.title}</div>
                          )}
                          {review.comment && (
                            <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Form - Only for authenticated users */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewForm tourId={tour.id} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sticky Sidebar */}
        <div className="lg:sticky lg:top-24 h-fit space-y-6">
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{tour.destination}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>{tour.duration} days</span>
                </div>
                {tour.maxGroupSize && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Up to {tour.maxGroupSize} people</span>
                  </div>
                )}
                {tour.category && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="font-medium text-foreground">Category:</span>
                    <Badge variant="outline">{tour.category}</Badge>
                  </div>
                )}
                {avgRating > 0 && (
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <div>
                      <span className="font-semibold text-lg">{avgRating.toFixed(1)}</span>
                      <span className="text-muted-foreground ml-2">({tour.reviews.length} reviews)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t space-y-4">
                <div>
                  {originalPrice && (
                    <div className="text-sm text-muted-foreground line-through mb-1">
                      {formatCurrency(originalPrice, tour.currency)}
                    </div>
                  )}
                  <div className="text-4xl font-bold text-primary">
                    {formatCurrency(price, tour.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">per person</div>
                </div>
                <Button asChild className="w-full" size="lg" className="rounded-full h-12 text-base">
                  <Link href={`/tours/${tour.slug}/book`}>Book Now</Link>
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Free cancellation up to 24 hours before departure
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}

