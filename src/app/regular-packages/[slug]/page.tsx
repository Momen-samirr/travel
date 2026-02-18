import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MapPin, Calendar, Hotel, Plane, Check, X, Package, FileText } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { DynamicBookingForm } from "@/components/charter-packages/dynamic-booking-form";
import { HotelMap } from "@/components/charter-packages/hotel-map";
import { PackageType } from "@/services/packages/types";
import { PackageReviewsList } from "@/components/packages/package-reviews-list";
import { PackageReviewForm } from "@/components/packages/package-review-form";
import { Star } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await prisma.charterTravelPackage.findUnique({
    where: { slug, type: PackageType.REGULAR },
  });

  if (!pkg) {
    return { title: "Package Not Found" };
  }

  return {
    title: pkg.name,
    description: pkg.shortDescription,
  };
}

export default async function RegularPackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim();
  
  let pkg = await prisma.charterTravelPackage.findUnique({
    where: { slug, type: PackageType.REGULAR },
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
    notFound();
  }

  const gallery = (pkg.gallery as string[]) || [];
  const includedServices = (pkg.includedServices as string[]) || [];
  const excludedServices = (pkg.excludedServices as string[]) || [];
  const excursionProgram = (pkg.excursionProgram as string[]) || [];
  const requiredDocuments = (pkg.requiredDocuments as string[]) || [];

  const validHotels = pkg.hotelOptions
    .map((opt) => opt.hotel)
    .filter((h) => h.latitude !== null && h.longitude !== null);

  const avgRating =
    pkg.reviews.length > 0
      ? pkg.reviews.reduce((sum, review) => sum + review.rating, 0) /
        pkg.reviews.length
      : 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden">
        {pkg.mainImage || gallery[0] ? (
          <Image
            src={pkg.mainImage || gallery[0] || "/placeholder-tour.jpg"}
            alt={pkg.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="container mx-auto px-4 relative z-10 h-full flex items-end pb-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 text-shadow-lg">
              {pkg.name}
            </h1>
            <div className="flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>
                  {pkg.destinationCity}, {pkg.destinationCountry}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>
                  {pkg.nights} nights / {pkg.days} days
                </span>
              </div>
              {avgRating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  <span>({pkg.reviews.length} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Package</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: pkg.description }}
                />
              </CardContent>
            </Card>

            {/* Included/Excluded Services */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    Included Services
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    Excluded Services
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
            </div>

            {/* Excursion Program */}
            {excursionProgram.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Excursion Program</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {excursionProgram.map((excursion, index) => (
                      <li key={index} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{excursion}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Required Documents */}
            {requiredDocuments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Required Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {requiredDocuments.map((doc, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Hotel Map */}
            {validHotels.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Hotel Locations</CardTitle>
                </CardHeader>
                <CardContent>
                  <HotelMap
                    hotels={validHotels.map((h) => ({
                      id: h.id,
                      name: h.name,
                      address: h.address,
                      city: h.city,
                      country: h.country,
                      latitude: h.latitude,
                      longitude: h.longitude,
                      placeId: h.placeId,
                    }))}
                  />
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <PackageReviewsList reviews={pkg.reviews} averageRating={avgRating} />
            <PackageReviewForm packageId={pkg.id} />
          </div>

          {/* Sidebar - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle>Book This Package</CardTitle>
                </CardHeader>
                <CardContent>
                  <DynamicBookingForm
                    packageData={{
                      id: pkg.id,
                      basePrice: pkg.basePrice,
                      priceRangeMin: pkg.priceRangeMin,
                      priceRangeMax: pkg.priceRangeMax,
                      currency: pkg.currency,
                      discount: pkg.discount,
                      hotelOptions: pkg.hotelOptions.map((opt) => ({
                        id: opt.id,
                        hotel: {
                          id: opt.hotel.id,
                          name: opt.hotel.name,
                          city: opt.hotel.city,
                          country: opt.hotel.country,
                        },
                        starRating: opt.starRating,
                        bookingRating: opt.bookingRating,
                      })),
                      departureOptions: pkg.departureOptions,
                      addons: pkg.addons,
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

