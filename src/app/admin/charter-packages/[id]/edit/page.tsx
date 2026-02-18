import { prisma } from "@/lib/prisma";
import { CharterPackageForm } from "@/components/admin/charter-package-form";
import { notFound } from "next/navigation";
import { PackageType } from "@/services/packages/types";

export default async function EditCharterPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await prisma.charterTravelPackage.findUnique({
    where: { id },
    include: {
      departureOptions: {
        include: {
          hotelPricings: {
            include: {
              roomTypePricings: true,
            },
          },
        },
      },
      hotelOptions: true,
      addons: true,
    },
  });

  if (!pkg) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Charter Package</h1>
      <CharterPackageForm
        initialData={{
          ...pkg,
          type: pkg.type as PackageType,
          basePrice: pkg.basePrice ? Number(pkg.basePrice) : null,
          priceRangeMin: pkg.priceRangeMin ? Number(pkg.priceRangeMin) : null,
          priceRangeMax: pkg.priceRangeMax ? Number(pkg.priceRangeMax) : null,
          discount: pkg.discount ? Number(pkg.discount) : null,
          gallery: pkg.gallery as string[],
          includedServices: pkg.includedServices as string[],
          excludedServices: pkg.excludedServices as string[],
          excursionProgram: pkg.excursionProgram as string[],
          requiredDocuments: pkg.requiredDocuments as string[],
          departureOptions: pkg.departureOptions.map((opt) => ({
            ...opt,
            priceModifier: opt.priceModifier ? Number(opt.priceModifier) : null,
            hotelPricings: opt.hotelPricings.map((hp) => ({
              hotelOptionId: hp.hotelOptionId,
              currency: hp.currency,
              roomTypePricings: hp.roomTypePricings.map((rtp) => ({
                roomType: rtp.roomType as "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD",
                adultPrice: Number(rtp.adultPrice),
                childPrice6to12: rtp.childPrice6to12 ? Number(rtp.childPrice6to12) : null,
                childPrice2to6: rtp.childPrice2to6 ? Number(rtp.childPrice2to6) : null,
                infantPrice: rtp.infantPrice ? Number(rtp.infantPrice) : null,
                currency: rtp.currency,
              })),
            })),
          })),
          hotelOptions: pkg.hotelOptions.map((opt) => ({
            ...opt,
          })),
          addons: pkg.addons.map((addon) => ({
            ...addon,
            price: Number(addon.price),
          })),
        }}
      />
    </div>
  );
}

