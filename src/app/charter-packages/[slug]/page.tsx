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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await prisma.charterTravelPackage.findUnique({
    where: { slug, type: PackageType.CHARTER },
  });

  if (!pkg) {
    return { title: "Package Not Found" };
  }

  return {
    title: pkg.name,
    description: pkg.shortDescription,
  };
}

export default async function CharterPackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  // Decode URL-encoded slug and normalize
  const slug = decodeURIComponent(rawSlug).trim();
  
  // Try to find package by slug (exact match first)
  let pkg = await prisma.charterTravelPackage.findUnique({
    where: { slug, type: PackageType.CHARTER },
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

  // If not found, try to find by slug with spaces replaced by hyphens (for old packages)
  if (!pkg) {
    const normalizedSlug = slug.replace(/\s+/g, "-").toLowerCase();
    pkg = await prisma.charterTravelPackage.findFirst({
      where: { 
        slug: normalizedSlug,
        type: PackageType.CHARTER,
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

  const gallery = pkg.gallery as string[];
  const includedServices = pkg.includedServices as string[];
  const excludedServices = pkg.excludedServices as string[];
  const excursionProgram = pkg.excursionProgram as string[];
  const requiredDocuments = pkg.requiredDocuments as string[];

  const avgRating =
    pkg.reviews.length > 0
      ? pkg.reviews.reduce((sum, review) => sum + review.rating, 0) /
        pkg.reviews.length
      : 0;

  const displayPrice =
    pkg.priceRangeMin && pkg.priceRangeMax
      ? `${formatCurrency(Number(pkg.priceRangeMin), pkg.currency)} - ${formatCurrency(Number(pkg.priceRangeMax), pkg.currency)}`
      : pkg.basePrice
      ? formatCurrency(Number(pkg.basePrice), pkg.currency)
      : "Contact for pricing";

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {pkg.mainImage && (
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              <Image
                src={pkg.mainImage}
                alt={pkg.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          {gallery.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map((url, index) => (
                <div
                  key={index}
                  className="relative w-full h-32 rounded-lg overflow-hidden"
                >
                  <Image
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>About This Package</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{pkg.description}</p>
            </CardContent>
          </Card>

          {pkg.departureOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Departure Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pkg.departureOptions.map((option) => (
                    <div
                      key={option.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">
                            {option.departureAirport} → {option.arrivalAirport}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(option.departureDate)} -{" "}
                            {formatDate(option.returnDate)}
                          </div>
                        </div>
                        {option.priceModifier && (
                          <Badge variant="outline">
                            {Number(option.priceModifier) > 0 ? "+" : ""}
                            {formatCurrency(Number(option.priceModifier), option.currency)}
                          </Badge>
                        )}
                      </div>
                      {option.flightInfo && (
                        <div className="text-sm text-muted-foreground">
                          {option.flightInfo}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pkg.hotelOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hotel className="h-5 w-5" />
                  Hotel Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pkg.hotelOptions.map((option) => (
                    <div
                      key={option.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">
                            {option.hotel.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {option.hotel.city}, {option.hotel.country}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {option.starRating && (
                            <Badge variant="outline">
                              {option.starRating} stars
                            </Badge>
                          )}
                          {option.bookingRating && (
                            <Badge variant="outline">
                              {option.bookingRating}/10
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pkg.hotelOptions.length > 0 && (
            <HotelMap
              hotels={pkg.hotelOptions.map((option) => ({
                id: option.hotel.id,
                name: option.hotel.name,
                address: option.hotel.address,
                city: option.hotel.city,
                country: option.hotel.country,
                latitude: option.hotel.latitude,
                longitude: option.hotel.longitude,
                placeId: option.hotel.placeId,
              }))}
            />
          )}

          {includedServices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  Included Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {includedServices.map((service, index) => (
                    <li key={index}>{service}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {excludedServices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <X className="h-5 w-5 text-red-600" />
                  Excluded Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {excludedServices.map((service, index) => (
                    <li key={index}>{service}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {pkg.addons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Optional Add-ons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pkg.addons.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div>
                        <div className="font-semibold">{addon.name}</div>
                        {addon.description && (
                          <div className="text-sm text-muted-foreground">
                            {addon.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {addon.isRequired && (
                          <Badge variant="destructive">Required</Badge>
                        )}
                        <span className="font-semibold">
                          {formatCurrency(Number(addon.price), addon.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {excursionProgram.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Excursion Program</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {excursionProgram.map((location, index) => (
                    <li key={index}>{location}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {requiredDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Required Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {requiredDocuments.map((doc, index) => (
                    <li key={index}>{doc}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <PackageReviewsList reviews={pkg.reviews} averageRating={avgRating} />
          <PackageReviewForm packageId={pkg.id} />
        </div>

        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Package Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold text-primary">
                  {displayPrice}
                </div>
                <div className="text-sm text-muted-foreground">per person</div>
              </div>
              {pkg.discount && (
                <Badge variant="destructive">{Number(pkg.discount)}% OFF</Badge>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {pkg.destinationCity}, {pkg.destinationCountry}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {pkg.nights} nights / {pkg.days} days
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  <span>{pkg.departureOptions.length} departure options</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hotel className="h-4 w-4" />
                  <span>{pkg.hotelOptions.length} hotel options</span>
                </div>
              </div>
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
  );
}

