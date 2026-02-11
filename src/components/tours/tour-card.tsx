"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StaggerItem } from "@/components/motion/stagger-list";
import { motion } from "framer-motion";

interface TourCardProps {
  tour: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string | null;
    destination: string;
    price: any;
    discountPrice: any;
    currency: string;
    duration: number;
    images: any;
    isFeatured: boolean;
    maxGroupSize: number | null;
  };
}

export function TourCard({ tour }: TourCardProps) {
  const images = tour.images as string[];
  const mainImage = images[0] || "/placeholder-tour.jpg";
  const price = tour.discountPrice ? Number(tour.discountPrice) : Number(tour.price);
  const originalPrice = tour.discountPrice ? Number(tour.price) : null;

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
              alt={tour.title}
              fill
              className="object-cover transition-all duration-300 ease-in-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            {tour.isFeatured && (
              <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                Featured
              </Badge>
            )}

            {tour.discountPrice && (
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                {Math.round(((Number(tour.price) - Number(tour.discountPrice)) / Number(tour.price)) * 100)}% Off
              </Badge>
            )}

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h3 className="text-xl font-bold mb-1 text-shadow-md line-clamp-1">
                {tour.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <MapPin className="h-4 w-4" />
                <span>{tour.destination}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            <p className="text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
              {tour.shortDescription}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{tour.duration} days</span>
              </div>
              {tour.maxGroupSize && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Up to {tour.maxGroupSize}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                {originalPrice && (
                  <span className="text-sm text-muted-foreground line-through mr-2">
                    {formatCurrency(originalPrice, tour.currency)}
                  </span>
                )}
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(price, tour.currency)}
                </span>
              </div>
              <Button asChild size="sm" className="rounded-full">
                <Link href={`/tours/${tour.slug}`}>
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

