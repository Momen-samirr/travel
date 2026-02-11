"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Star, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { FadeInSection } from "@/components/motion/fade-in-section";
import { StaggerList, StaggerItem } from "@/components/motion/stagger-list";
import { motion } from "framer-motion";

interface Tour {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  destination: string;
  price: any;
  discountPrice: any;
  currency: string;
  duration: number;
  images: any;
  isFeatured: boolean;
}

interface PopularToursSectionProps {
  tours: Tour[];
}

export function PopularToursSection({ tours }: PopularToursSectionProps) {
  if (tours.length === 0) return null;

  return (
    <FadeInSection className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <FadeInSection delay={0.1}>
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">Popular Tours</h2>
              <p className="text-lg text-muted-foreground">
                Handpicked destinations for your next adventure
              </p>
            </div>
            <Button asChild variant="outline" className="hidden md:flex">
              <Link href="/tours">
                View All Tours
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </FadeInSection>

        <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.slice(0, 6).map((tour) => {
            const images = tour.images as string[];
            const mainImage = images?.[0] || "/placeholder-tour.jpg";
            const price = tour.discountPrice ? Number(tour.discountPrice) : Number(tour.price);
            const originalPrice = tour.discountPrice ? Number(tour.price) : null;

            return (
              <StaggerItem key={tour.id}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
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
                    {tour.shortDescription || tour.title}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{tour.duration} days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-foreground">4.8</span>
                      </div>
                    </div>
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
            <Link href="/tours">
              View All Tours
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </FadeInSection>
  );
}

