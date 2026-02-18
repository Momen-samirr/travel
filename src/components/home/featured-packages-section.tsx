"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, ArrowRight, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { FadeInSection } from "@/components/motion/fade-in-section";
import { StaggerList, StaggerItem } from "@/components/motion/stagger-list";
import { motion } from "framer-motion";
import { PackageType } from "@/services/packages/types";

interface CharterPackage {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  destinationCity: string;
  destinationCountry: string;
  nights: number;
  days: number;
  basePrice: number | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  currency: string;
  discount: number | null;
  mainImage: string | null;
  gallery: any;
  type?: PackageType;
  _count?: {
    departureOptions: number;
    hotelOptions: number;
  };
}

interface FeaturedPackagesSectionProps {
  packages: CharterPackage[];
  title: string;
  description: string;
  viewAllLink: string;
}

export function FeaturedPackagesSection({ 
  packages, 
  title,
  description,
  viewAllLink 
}: FeaturedPackagesSectionProps) {
  if (!packages || packages.length === 0) return null;

  return (
    <FadeInSection className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <FadeInSection delay={0.1}>
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">
                {title}
              </h2>
              <p className="text-lg text-muted-foreground">
                {description}
              </p>
            </div>
            <Button asChild variant="outline" className="hidden md:flex">
              <Link href={viewAllLink}>
                View All Packages
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </FadeInSection>

        <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.slice(0, 6).map((pkg) => {
            const gallery = pkg.gallery as string[];
            const mainImage = pkg.mainImage || gallery?.[0] || "/placeholder-tour.jpg";
            const displayPrice =
              pkg.priceRangeMin && pkg.priceRangeMax
                ? `${formatCurrency(pkg.priceRangeMin, pkg.currency)} - ${formatCurrency(pkg.priceRangeMax, pkg.currency)}`
                : pkg.basePrice
                ? formatCurrency(pkg.basePrice, pkg.currency)
                : "Contact for pricing";

            const getPackageUrl = () => {
              if (pkg.type === PackageType.CHARTER) return `/charter-packages/${pkg.slug}`;
              if (pkg.type === PackageType.INBOUND) return `/inbound-packages/${pkg.slug}`;
              if (pkg.type === PackageType.REGULAR) return `/regular-packages/${pkg.slug}`;
              return `/charter-packages/${pkg.slug}`;
            };

            return (
              <StaggerItem key={pkg.id}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Card className="card-hover overflow-hidden group h-full">
                    <div className="relative h-64 w-full overflow-hidden">
                      <Image
                        src={mainImage}
                        alt={pkg.name}
                        fill
                        className="object-cover transition-all duration-300 ease-in-out group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                      {pkg.discount && (
                        <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                          {Math.round(Number(pkg.discount))}% Off
                        </Badge>
                      )}

                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="text-xl font-bold mb-1 text-shadow-md line-clamp-1">
                          {pkg.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-white/90">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {pkg.destinationCity}, {pkg.destinationCountry}
                          </span>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <p className="text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                        {pkg.shortDescription || pkg.name}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {pkg.nights} nights / {pkg.days} days
                            </span>
                          </div>
                          {pkg._count && (
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              <span className="font-medium text-foreground">
                                {pkg._count.departureOptions} departures
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <span className="text-2xl font-bold text-primary">
                            {displayPrice}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            per person
                          </div>
                        </div>
                        <Button asChild size="sm" className="rounded-full">
                          <Link href={getPackageUrl()}>
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerList>

        <div className="mt-8 text-center md:hidden">
          <Button asChild variant="outline" size="lg">
            <Link href={viewAllLink}>
              View All Packages
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </FadeInSection>
  );
}

