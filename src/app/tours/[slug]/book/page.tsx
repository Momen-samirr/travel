import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/tours/booking-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await prisma.tour.findUnique({
    where: { slug },
    select: { title: true },
  });

  if (!tour) {
    return { title: "Tour Not Found" };
  }

  return {
    title: `Book ${tour.title}`,
  };
}

export default async function BookTourPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tour = await prisma.tour.findUnique({
    where: { slug },
  });

  if (!tour || !tour.isActive) {
    notFound();
  }

  const price = tour.discountPrice ? Number(tour.discountPrice) : Number(tour.price);
  const originalPrice = tour.discountPrice ? Number(tour.price) : null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Book: {tour.title}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <BookingForm tourId={tour.id} bookingType="TOUR" />
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Tour</div>
                  <div className="font-semibold">{tour.title}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Destination</div>
                  <div>{tour.destination}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Duration</div>
                  <div>{tour.duration} days</div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Price per person</span>
                    <span className="font-semibold">
                      {formatCurrency(price, tour.currency)}
                    </span>
                  </div>
                  {originalPrice && (
                    <div className="flex items-center justify-between text-sm text-gray-500 line-through">
                      <span>Original price</span>
                      <span>{formatCurrency(originalPrice, tour.currency)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

