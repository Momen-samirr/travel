import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/tours/booking-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Star } from "lucide-react";
import Image from "next/image";
import { Metadata } from "next";

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
    title: `Book ${hotel.name}`,
    description: `Book your stay at ${hotel.name} in ${hotel.city}, ${hotel.country}`,
  };
}

export default async function HotelBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hotel = await prisma.hotel.findUnique({
    where: { slug },
  });

  if (!hotel || !hotel.isActive) {
    notFound();
  }

  const images = hotel.images as string[];
  const hasImage = images && images.length > 0 && images[0];
  const amenities = hotel.amenities as string[];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Book Your Stay</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <BookingForm hotelId={hotel.id} bookingType="HOTEL" />
          </div>

          <div className="lg:col-span-1">
            <Card>
              <div className="relative h-48 w-full bg-muted">
                {hasImage ? (
                  <Image
                    src={images[0]}
                    alt={hotel.name}
                    fill
                    className="object-cover rounded-t-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-t-lg">
                    <span className="text-muted-foreground">No Image</span>
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle>{hotel.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">
                    {hotel.address}, {hotel.city}, {hotel.country}
                  </span>
                </div>
                {hotel.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{hotel.rating}</span>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <div className="text-2xl font-bold text-primary">
                  </div>
                </div>
                {amenities.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="text-sm font-semibold mb-2">Amenities:</div>
                    <div className="flex flex-wrap gap-2">
                      {amenities.slice(0, 6).map((amenity, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                      {amenities.length > 6 && (
                        <span className="text-xs text-gray-500">
                          +{amenities.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

