import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Check, MapPin, Phone, X } from "lucide-react";
import { Metadata } from "next";
import { PackageType } from "@/services/packages/types";
import { BookingFormFactory } from "@/components/packages/booking/BookingFormFactory";
import { type InboundTypeConfig, inboundTypeConfigSchema } from "@/lib/validations/charter-package";
import { DEFAULT_CURRENCY, normalizeCurrency } from "@/lib/currency";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await prisma.charterTravelPackage.findUnique({
    where: { slug, type: PackageType.INBOUND },
  });

  if (!pkg) {
    return { title: "Package Not Found" };
  }

  return {
    title: pkg.name,
    description: pkg.shortDescription,
  };
}

export default async function InboundPackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim();
  
  const pkg = await prisma.charterTravelPackage.findUnique({
    where: { slug, type: PackageType.INBOUND },
    include: {
      hotelOptions: {
        where: { isActive: true },
        include: { hotel: true },
      },
      addons: { where: { isActive: true } },
      departureOptions: { where: { isActive: true }, orderBy: { departureDate: "asc" } },
    },
  });

  if (!pkg) {
    notFound();
  }

  const gallery = (pkg.gallery as string[]) || [];
  const mainImage = pkg.mainImage || gallery[0] || "/placeholder-tour.jpg";
  const packageCurrency = normalizeCurrency(pkg.currency || DEFAULT_CURRENCY);

  const fallbackConfig: InboundTypeConfig = {
    header: {
      campaignTitle: pkg.name,
      subtitle: pkg.shortDescription || pkg.description || "Inbound package details",
      durationText: `${pkg.nights} nights / ${pkg.days} days`,
    },
    includes: (pkg.includedServices as string[]) || [],
    excludes: (pkg.excludedServices as string[]) || [],
    itinerary: ((pkg.excursionProgram as string[]) || []).map((item, index) => ({
      dayLabel: `Day ${index + 1}`,
      title: `Program ${index + 1}`,
      description: item,
    })),
    offer: {
      currentPrice:
        Number(pkg.basePrice || pkg.priceRangeMin || pkg.priceRangeMax || 0) || 0,
      oldPrice: null,
      currency: packageCurrency,
      perPersonLabel: "Per Person",
      validUntilText: "Limited time offer",
    },
    contact: {
      phone: "Contact us",
      email: "info@booking.com",
      primaryAddress: `${pkg.destinationCity}, ${pkg.destinationCountry}`,
      secondaryAddress: null,
    },
    pickupLocations: [],
    transferOptions: [],
  };

  const parsedConfig = inboundTypeConfigSchema.safeParse(pkg.typeConfig);
  const inboundConfig = parsedConfig.success ? parsedConfig.data : fallbackConfig;
  const offerCurrency = normalizeCurrency(inboundConfig.offer.currency || packageCurrency);

  return (
    <div className="min-h-screen bg-background">
      <section className="relative h-[55vh] min-h-[360px] overflow-hidden">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={pkg.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary to-primary/80" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="container mx-auto px-4 relative z-10 h-full flex items-end pb-10">
          <div className="max-w-4xl text-white">
            <p className="text-sm uppercase tracking-widest mb-3 opacity-90">
              {inboundConfig.header.campaignTitle}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 text-shadow-lg">
              {pkg.name}
            </h1>
            <p className="text-lg md:text-xl mb-4 text-white/90">
              {inboundConfig.header.subtitle}
            </p>
            <div className="flex items-center gap-5 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>
                  {pkg.destinationCity}, {pkg.destinationCountry}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>{inboundConfig.header.durationText}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>About This Inbound Offer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {pkg.description}
                </p>
              </CardContent>
            </Card>

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
                    {inboundConfig.includes.map((service, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
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
                    {inboundConfig.excludes.map((service, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <span>{service}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {inboundConfig.itinerary.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Day-by-Day Itinerary</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {inboundConfig.itinerary.map((item, index) => (
                      <li key={index} className="flex gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {item.dayLabel}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Offer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(inboundConfig.offer.currentPrice, offerCurrency)}
                  </p>
                  {inboundConfig.offer.oldPrice ? (
                    <p className="line-through text-muted-foreground">
                      {formatCurrency(inboundConfig.offer.oldPrice, offerCurrency)}
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">{inboundConfig.offer.perPersonLabel}</p>
                  <p className="text-sm">{inboundConfig.offer.validUntilText}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {inboundConfig.contact.phone}
                  </p>
                  <p>{inboundConfig.contact.email}</p>
                  <p>{inboundConfig.contact.primaryAddress}</p>
                  {inboundConfig.contact.secondaryAddress ? (
                    <p>{inboundConfig.contact.secondaryAddress}</p>
                  ) : null}
                </CardContent>
              </Card>

              <BookingFormFactory
                package={{
                  id: pkg.id,
                  type: PackageType.INBOUND,
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
                  currency: packageCurrency,
                  discount: pkg.discount ? Number(pkg.discount) : null,
                  typeConfig: inboundConfig,
                  isActive: pkg.isActive,
                  createdAt: pkg.createdAt,
                  updatedAt: pkg.updatedAt,
                }}
                packageData={{
                  ...pkg,
                  typeConfig: inboundConfig,
                  addons: pkg.addons.map((addon) => ({
                    ...addon,
                    price: Number(addon.price),
                  })),
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

