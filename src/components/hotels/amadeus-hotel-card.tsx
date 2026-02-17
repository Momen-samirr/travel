"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StaggerItem } from "@/components/motion/stagger-list";
import { motion } from "framer-motion";
import { Hotel } from "@/services/hotels/types";

interface AmadeusHotelCardProps {
  hotel: Hotel;
}

export function AmadeusHotelCard({ hotel }: AmadeusHotelCardProps) {
  // Images are an array of strings (URLs) according to the Hotel type
  const hasImage = hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0 && hotel.images[0];

  return (
    <StaggerItem>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="card-hover overflow-hidden group h-full">
          <div className="relative h-64 w-full overflow-hidden bg-muted">
            {hasImage ? (
              <Image
                src={hotel.images[0]}
                alt={hotel.name}
                fill
                className="object-cover transition-all duration-300 ease-in-out group-hover:scale-110"
                onError={(e) => {
                  // Prevent infinite loop by replacing with placeholder div
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector(".image-placeholder")) {
                    const placeholder = document.createElement("div");
                    placeholder.className = "image-placeholder absolute inset-0 bg-muted flex items-center justify-center";
                    placeholder.innerHTML = '<span class="text-muted-foreground">No Image</span>';
                    parent.appendChild(placeholder);
                  }
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <span className="text-muted-foreground">No Image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            {hotel.rating && (
              <Badge className="absolute top-4 right-4 bg-white/90 text-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                {hotel.rating.toFixed(1)}
              </Badge>
            )}

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h3 className="text-xl font-bold mb-1 text-shadow-md line-clamp-1">
                {hotel.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <MapPin className="h-4 w-4" />
                <span>{hotel.city}, {hotel.country}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            {hotel.description && (
              <p className="text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                {hotel.description}
              </p>
            )}

            {hotel.priceRange && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">Price Range</p>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrency(hotel.priceRange.min, hotel.currency)} - {formatCurrency(hotel.priceRange.max, hotel.currency)}
                </p>
              </div>
            )}

            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Amenities</p>
                <div className="flex flex-wrap gap-1">
                  {hotel.amenities.slice(0, 3).map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {hotel.amenities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{hotel.amenities.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-4 border-t">
              <Button asChild size="sm" className="rounded-full">
                <Link href={`/hotels/amadeus/${hotel.hotelId || hotel.id}`}>
                  View Details
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </StaggerItem>
  );
}

