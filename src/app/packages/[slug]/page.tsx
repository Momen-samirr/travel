import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MapPin, Calendar, Hotel, Check, X, Package, FileText } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { BookingFormFactory } from "@/components/packages/booking/BookingFormFactory";
import { PackageTypeBadge } from "@/components/packages/shared/PackageTypeBadge";
import { PackageType } from "@/services/packages/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await prisma.charterTravelPackage.findUnique({
    where: { slug },
  });

  if (!pkg) {
    return { title: "Package Not Found" };
  }

  return {
    title: pkg.name,
    description: pkg.shortDescription,
  };
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim();
  
  let pkg = await prisma.charterTravelPackage.findUnique({
    where: { slug },
    include: {
      departureOptions: {
        where: { isActive: true },
        orderBy: { departureDate: "asc" },
      },
      hotelOptions: {
        where: { isActive: true },
        include: {
          hotel: true,
        },
      },
      addons: {
        where: { isActive: true },
      },
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

  if (!pkg) {
    const normalizedSlug = slug.replace(/\s+/g, "-").toLowerCase();
    pkg = await prisma.charterTravelPackage.findFirst({
      where: { 
        slug: normalizedSlug,
        isActive: true,
      },
      include: {
        departureOptions: {
          where: { isActive: true },
          orderBy: { departureDate: "asc" },
        },
        hotelOptions: {
          where: { isActive: true },
          include: {
            hotel: true,
          },
        },
        addons: {
          where: { isActive: true },
        },
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
  }

  if (!pkg || !pkg.isActive) {
    notFound();
  }

  const images = pkg.gallery as string[];
  const includedServices = pkg.includedServices as string[];
  const excludedServices = pkg.excludedServices as string[];
  const avgRating =
    pkg.reviews.length > 0
      ? pkg.reviews.reduce((sum, review) => sum + review.rating, 0) / pkg.reviews.length
      : 0;

  const displayPrice = pkg.priceRangeMin && pkg.priceRangeMax
    ? `${formatCurrency(Number(pkg.priceRangeMin), pkg.currency)} - ${formatCurrency(Number(pkg.priceRangeMax), pkg.currency)}`
    : pkg.basePrice
    ? formatCurrency(Number(pkg.basePrice), pkg.currency)
    : "Contact for pricing";

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Package Header */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PackageTypeBadge type={pkg.type as PackageType} />
              {pkg.discount && (
                <Badge className="bg-destructive">
                  {Number(pkg.discount)}% OFF
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-2">{pkg.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{pkg.destinationCity}, {pkg.destinationCountry}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{pkg.nights} nights / {pkg.days} days</span>
              </div>
              {avgRating > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  <span>({pkg.reviews.length} reviews)</span>
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-primary mb-4">
              {displayPrice}
              <span className="text-lg text-muted-foreground font-normal ml-2">
                per person
              </span>
            </div>
          </div>

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {images.slice(0, 4).map((image, index) => (
                <div key={index} className="relative h-64 rounded-lg overflow-hidden">
                  <Image
                    src={image}
                    alt={`${pkg.name} - Image ${index + 1}`}
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
              <CardTitle>About This Package</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none">
                <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                  {pkg.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Included/Excluded Services */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {includedServices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    Included
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {includedServices.map((service, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{service}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {excludedServices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    Not Included
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {excludedServices.map((service, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{service}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Reviews */}
          {pkg.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pkg.reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{review.user.name || "Anonymous"}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </div>
                      </div>
                      <div className="mb-2">
                        {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                      </div>
                      {review.title && (
                        <div className="font-semibold mb-1">{review.title}</div>
                      )}
                      {review.comment && (
                        <p className="text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking Widget */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          <BookingFormFactory
            package={{
              id: pkg.id,
              type: pkg.type as PackageType,
              name: pkg.name,
              slug: pkg.slug,
              description: pkg.description,
              shortDescription: pkg.shortDescription,
              destinationCountry: pkg.destinationCountry,
              destinationCity: pkg.destinationCity,
              nights: pkg.nights,
              days: pkg.days,
              mainImage: pkg.mainImage,
              gallery: pkg.gallery,
              basePrice: pkg.basePrice ? Number(pkg.basePrice) : null,
              priceRangeMin: pkg.priceRangeMin ? Number(pkg.priceRangeMin) : null,
              priceRangeMax: pkg.priceRangeMax ? Number(pkg.priceRangeMax) : null,
              currency: pkg.currency,
              discount: pkg.discount ? Number(pkg.discount) : null,
              typeConfig: pkg.typeConfig,
              isActive: pkg.isActive,
              createdAt: pkg.createdAt,
              updatedAt: pkg.updatedAt,
            }}
            packageData={pkg}
          />
        </div>
      </div>
    </div>
  );
}

