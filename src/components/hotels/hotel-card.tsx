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

interface HotelCardProps {
  hotel: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    city: string;
    country: string;
    pricePerNight: any;
    currency: string;
    images: any;
    rating: number | null;
  };
}

export function HotelCard({ hotel }: HotelCardProps) {
  const images = hotel.images as string[];
  const mainImage = images[0] || "/placeholder-hotel.jpg";

  return (
    <StaggerItem>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="card-hover overflow-hidden group h-full">
          <div className="relative h-64 w-full overflow-hidden">
            <Image
              src={mainImage}
              alt={hotel.name}
              fill
              className="object-cover transition-all duration-300 ease-in-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            {hotel.rating && (
              <Badge className="absolute top-4 right-4 bg-white/90 text-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                {hotel.rating}
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

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(Number(hotel.pricePerNight), hotel.currency)}
                </div>
                <div className="text-sm text-muted-foreground">per night</div>
              </div>
              <Button asChild size="sm" className="rounded-full">
                <Link href={`/hotels/${hotel.slug}`}>
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

