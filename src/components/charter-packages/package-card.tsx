import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Calendar, Hotel, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_CURRENCY, normalizeCurrency } from "@/lib/currency";
import { PackageType } from "@/services/packages/types";

interface CharterPackageCardProps {
  package: {
    id: string;
    type?: PackageType;
    name: string;
    slug: string;
    destinationCountry: string;
    destinationCity: string;
    nights: number;
    days: number;
    mainImage: string | null;
    basePrice: number | null;
    priceRangeMin: number | null;
    priceRangeMax: number | null;
    currency: string;
    discount: number | null;
    _count?: {
      departureOptions: number;
      hotelOptions: number;
    };
  };
  detailBasePath?: string;
}

export function CharterPackageCard({ package: pkg, detailBasePath }: CharterPackageCardProps) {
  const packageCurrency = normalizeCurrency(pkg.currency || DEFAULT_CURRENCY);
  const resolvedBasePath = detailBasePath
    ? detailBasePath
    : pkg.type === PackageType.INBOUND
    ? "/inbound-packages"
    : pkg.type === PackageType.REGULAR
    ? "/regular-packages"
    : "/charter-packages";
  const displayPrice = pkg.priceRangeMin && pkg.priceRangeMax
    ? `${formatCurrency(pkg.priceRangeMin, packageCurrency)} - ${formatCurrency(pkg.priceRangeMax, packageCurrency)}`
    : pkg.basePrice
    ? formatCurrency(pkg.basePrice, packageCurrency)
    : "Contact for pricing";

  return (
    <Link href={`${resolvedBasePath}/${pkg.slug}`}>
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
            <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-primary/50" />
            </div>
          )}
          {pkg.discount && (
            <Badge className="absolute top-2 right-2 bg-destructive">
              {pkg.discount}% OFF
            </Badge>
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
            {pkg._count && (
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Plane className="h-3 w-3" />
                  <span>{pkg._count.departureOptions} departures</span>
                </div>
                <div className="flex items-center gap-1">
                  <Hotel className="h-3 w-3" />
                  <span>{pkg._count.hotelOptions} hotels</span>
                </div>
              </div>
            )}
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

