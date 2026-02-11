import { prisma } from "@/lib/prisma";
import { TourForm } from "@/components/admin/tour-form";
import { notFound } from "next/navigation";

export default async function EditTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tour = await prisma.tour.findUnique({
    where: { id },
  });

  if (!tour) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Tour</h1>
      <TourForm
        initialData={{
          ...tour,
          price: Number(tour.price),
          discountPrice: tour.discountPrice ? Number(tour.discountPrice) : null,
          images: tour.images as string[],
          itinerary: tour.itinerary as any,
        }}
      />
    </div>
  );
}

