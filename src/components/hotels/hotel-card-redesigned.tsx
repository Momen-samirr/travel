"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Wifi, Car, UtensilsCrossed, Waves, Dumbbell } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Hotel } from "@/services/hotels/types";

interface HotelCardRedesignedProps {
  hotel: Hotel;
  onCardClick?: () => void;
}

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  restaurant: <UtensilsCrossed className="h-4 w-4" />,
  pool: <Waves className="h-4 w-4" />,
  gym: <Dumbbell className="h-4 w-4" />,
};

export function HotelCardRedesigned({ hotel, onCardClick }: HotelCardRedesignedProps) {
  const price = hotel.priceRange?.min || null;
  const rating = hotel.starRating || hotel.rating;
  const images = hotel.images || [];
  const mainImage = images[0] || null;
  const hasImage = mainImage !== null;

  const getReviewScoreLabel = (score: number | null) => {
    if (!score) return null;
    if (score >= 9) return "Excellent";
    if (score >= 8) return "Very Good";
    if (score >= 7) return "Good";
    if (score >= 6) return "Fair";
    return "Poor";
  };

  const reviewScore = rating ? (rating / 5) * 10 : null;
  const reviewLabel = reviewScore ? getReviewScoreLabel(reviewScore) : null;

  return (
    <Card
      id={`hotel-${hotel.id}`}
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20"
      onClick={onCardClick}
    >
      <div className="flex flex-col md:flex-row">
        {/* Hotel Image */}
        <div className="relative w-full md:w-72 h-56 md:h-auto flex-shrink-0">
          {hasImage ? (
            <>
              <Image
                src={mainImage}
                alt={hotel.name}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
              {images.length > 1 && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="bg-white/95 text-foreground shadow-sm">
                    {images.length} photos
                  </Badge>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <MapPin className="h-10 w-10 text-primary/50" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Image Coming Soon</span>
            </div>
          )}
        </div>

        {/* Hotel Content */}
        <div className="flex-1 flex flex-col p-5 md:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl md:text-2xl font-bold line-clamp-2 mb-1">{hotel.name}</h3>
                  {rating && (
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(Math.floor(rating))].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      {rating % 1 !== 0 && (
                        <Star className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />
                      )}
                    </div>
                  )}
                </div>
                {reviewScore && reviewLabel && (
                  <Badge className="bg-green-600 text-white whitespace-nowrap ml-2">
                    {reviewLabel} {reviewScore.toFixed(1)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">{hotel.address || `${hotel.city}, ${hotel.country}`}</span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {hotel.amenities.slice(0, 4).map((amenity, index) => {
                const amenityLower = amenity.toLowerCase();
                const iconKey = Object.keys(amenityIcons).find((key) =>
                  amenityLower.includes(key)
                );
                return (
                  <div
                    key={index}
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    {iconKey && amenityIcons[iconKey]}
                    <span>{amenity}</span>
                  </div>
                );
              })}
              {hotel.amenities.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{hotel.amenities.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {hotel.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
              {hotel.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-4 border-t gap-4 mt-auto">
            <div className="flex-1">
              {price !== null && price > 0 ? (
                <div>
                  <span className="text-2xl md:text-3xl font-bold text-primary">
                    {formatCurrency(price, hotel.currency)}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">per night</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-foreground">Check Availability</span>
                  <span className="text-xs text-muted-foreground">View details for pricing</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Badge
                variant="outline"
                className={
                  hotel.provider === "INTERNAL"
                    ? "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-purple-500 text-purple-500 bg-purple-50 dark:bg-purple-950"
                }
              >
                {hotel.provider === "INTERNAL" ? "Internal" : "Amadeus"}
              </Badge>
              <Button asChild size="default" className="flex-1 md:flex-none">
                <Link
                  href={
                    hotel.provider === "INTERNAL"
                      ? `/hotels/${hotel.slug}`
                      : `/hotels/amadeus/${hotel.hotelId || hotel.id}`
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  View Details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

