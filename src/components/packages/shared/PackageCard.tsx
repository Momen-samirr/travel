"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Calendar, Hotel, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PackageType, TravelPackage } from "@/services/packages/types";
import { PackageTypeBadge } from "./PackageTypeBadge";

interface PackageCardProps {
  package: TravelPackage;
  showType?: boolean;
}

export function PackageCard({ package: pkg, showType = true }: PackageCardProps) {
  const displayPrice = pkg.priceRangeMin && pkg.priceRangeMax
    ? `${formatCurrency(pkg.priceRangeMin, pkg.currency)} - ${formatCurrency(pkg.priceRangeMax, pkg.currency)}`
    : pkg.basePrice
    ? formatCurrency(pkg.basePrice, pkg.currency)
    : "Contact for pricing";

  return (
    <Link href={`/packages/${pkg.slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        <div className="relative w-full h-48">
          {pkg.mainImage ? (
            <Image
              src={pkg.mainImage}
              alt={pkg.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-primary/50" />
            </div>
          )}
          {pkg.discount && (
            <Badge className="absolute top-2 right-2 bg-destructive">
              {pkg.discount}% OFF
            </Badge>
          )}
          {showType && (
            <div className="absolute top-2 left-2">
              <PackageTypeBadge type={pkg.type} />
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-1">
          <h3 className="font-bold text-lg mb-2 line-clamp-2">{pkg.name}</h3>
          <div className="space-y-1 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>
                {pkg.destinationCity}, {pkg.destinationCountry}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {pkg.nights} nights / {pkg.days} days
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              {pkg.type === PackageType.HOTEL_CHARTER && (
                <div className="flex items-center gap-1">
                  <Plane className="h-3 w-3" />
                  <span>Includes Flights</span>
                </div>
              )}
              {pkg.type === PackageType.INBOUND && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>Local Pickup</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Hotel className="h-3 w-3" />
                <span>Hotels Included</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="w-full">
            <div className="text-2xl font-bold text-primary">{displayPrice}</div>
            <div className="text-xs text-muted-foreground">per person</div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

