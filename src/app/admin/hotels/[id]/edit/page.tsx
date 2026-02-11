import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { HotelForm } from "@/components/admin/hotel-form";
import { HotelInput } from "@/lib/validations/hotel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditHotelPage({
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

  const hotel = await prisma.hotel.findUnique({
    where: { id },
  });

  if (!hotel) {
    notFound();
  }

  const initialData: HotelInput & { id?: string } = {
    id: hotel.id,
    name: hotel.name,
    slug: hotel.slug,
    description: hotel.description || "",
    address: hotel.address || "",
    city: hotel.city,
    country: hotel.country,
    latitude: hotel.latitude ?? null,
    longitude: hotel.longitude ?? null,
    pricePerNight: Number(hotel.pricePerNight),
    currency: hotel.currency,
    rating: hotel.rating ?? null,
    amenities: hotel.amenities as string[],
    images: hotel.images as string[],
    checkInTime: hotel.checkInTime ?? null,
    checkOutTime: hotel.checkOutTime ?? null,
    isActive: hotel.isActive,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Hotel</h1>
        <p className="text-muted-foreground">Update hotel information</p>
      </div>
      <HotelForm initialData={initialData} />
    </div>
  );
}

