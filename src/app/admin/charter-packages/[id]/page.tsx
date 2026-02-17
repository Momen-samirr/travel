import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Edit, MapPin, Hotel, Plane, Package } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminCharterPackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const { id } = await params;

  const pkg = await prisma.charterTravelPackage.findUnique({
    where: { id },
    include: {
      departureOptions: true,
      hotelOptions: {
        include: {
          hotel: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              country: true,
            },
          },
        },
      },
      addons: true,
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  if (!pkg) {
    notFound();
  }

  const includedServices = pkg.includedServices as string[];
  const excludedServices = pkg.excludedServices as string[];
  const excursionProgram = pkg.excursionProgram as string[];
  const requiredDocuments = pkg.requiredDocuments as string[];
  const gallery = pkg.gallery as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/charter-packages">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{pkg.name}</h1>
        </div>
        <Button asChild>
          <Link href={`/admin/charter-packages/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Destination: </span>
              {pkg.destinationCity}, {pkg.destinationCountry}
            </div>
            <div>
              <span className="font-semibold">Duration: </span>
              {pkg.nights} nights / {pkg.days} days
            </div>
            <div>
              <span className="font-semibold">Status: </span>
              {pkg.isActive ? (
                <Badge variant="default">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <div>
              <span className="font-semibold">Price: </span>
              {pkg.priceRangeMin && pkg.priceRangeMax
                ? `${formatCurrency(Number(pkg.priceRangeMin), pkg.currency)} - ${formatCurrency(Number(pkg.priceRangeMax), pkg.currency)}`
                : pkg.basePrice
                ? formatCurrency(Number(pkg.basePrice), pkg.currency)
                : "N/A"}
            </div>
            {pkg.discount && (
              <div>
                <span className="font-semibold">Discount: </span>
                {Number(pkg.discount)}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Departure Options: </span>
              {pkg.departureOptions.length}
            </div>
            <div>
              <span className="font-semibold">Hotel Options: </span>
              {pkg.hotelOptions.length}
            </div>
            <div>
              <span className="font-semibold">Add-ons: </span>
              {pkg.addons.length}
            </div>
            <div>
              <span className="font-semibold">Bookings: </span>
              {pkg._count.bookings}
            </div>
            <div>
              <span className="font-semibold">Reviews: </span>
              {pkg._count.reviews}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
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
                      <div className="text-sm text-gray-600">
                        {formatDate(option.departureDate)} -{" "}
                        {formatDate(option.returnDate)}
                      </div>
                    </div>
                    {option.priceModifier && (
                      <Badge variant="outline">
                        {option.priceModifier > 0 ? "+" : ""}
                        {formatCurrency(Number(option.priceModifier), option.currency)}
                      </Badge>
                    )}
                  </div>
                  {option.flightInfo && (
                    <div className="text-sm text-gray-600">
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
                      <div className="font-semibold">{option.hotel.name}</div>
                      <div className="text-sm text-gray-600">
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {option.singleRoomPrice && (
                      <div>
                        Single: {formatCurrency(Number(option.singleRoomPrice), option.currency)}
                      </div>
                    )}
                    {option.doubleRoomPrice && (
                      <div>
                        Double: {formatCurrency(Number(option.doubleRoomPrice), option.currency)}
                      </div>
                    )}
                    {option.childPrice && (
                      <div>
                        Child: {formatCurrency(Number(option.childPrice), option.currency)}
                      </div>
                    )}
                    {option.infantPrice && (
                      <div>
                        Infant: {formatCurrency(Number(option.infantPrice), option.currency)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pkg.addons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Add-ons
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
                      <div className="text-sm text-gray-600">
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

      {includedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Included Services</CardTitle>
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
            <CardTitle>Excluded Services</CardTitle>
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
            <CardTitle>Required Documents</CardTitle>
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
    </div>
  );
}

