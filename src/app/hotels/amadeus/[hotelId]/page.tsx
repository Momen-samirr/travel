import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Calendar, Users, Wifi, Car, UtensilsCrossed } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { HotelMap } from "@/components/charter-packages/hotel-map";
import { AmadeusHotelService } from "@/services/hotels/amadeusHotelService";

export const metadata = {
  title: "Hotel Details",
  description: "View hotel details and book your stay",
};

export default async function AmadeusHotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ hotelId: string }>;
  searchParams: Promise<{ checkInDate?: string; checkOutDate?: string; adults?: string; children?: string }>;
}) {
  const { hotelId } = await params;
  const queryParams = await searchParams;

  try {
    // Use the service directly instead of making HTTP request
    const service = new AmadeusHotelService();
    const hotel = await service.getHotelById(hotelId, {
      checkInDate: queryParams.checkInDate || undefined,
      checkOutDate: queryParams.checkOutDate || undefined,
      adults: queryParams.adults ? parseInt(queryParams.adults) : 1,
      children: queryParams.children ? parseInt(queryParams.children) : undefined,
      currencyCode: "EGP",
    });

    if (!hotel || !hotel.id) {
      console.error("[AmadeusHotelDetailPage] Hotel not found:", hotelId);
      notFound();
    }

    // Fetch offers if dates are provided
    let offers: any[] = [];
    if (queryParams.checkInDate && queryParams.checkOutDate) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const offersParams = new URLSearchParams({
          hotelId,
          checkInDate: queryParams.checkInDate,
          checkOutDate: queryParams.checkOutDate,
          adults: queryParams.adults || "1",
          currencyCode: "EGP",
        });
        if (queryParams.children) {
          offersParams.append("children", queryParams.children);
        }

        const offersResponse = await fetch(
          `${baseUrl}/api/amadeus/hotels/offers?${offersParams.toString()}`,
          { 
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (offersResponse.ok) {
          const contentType = offersResponse.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const offersData = await offersResponse.json();
            offers = offersData.data?.offers || [];
          }
        }
      } catch (error) {
        // Offers are optional, so we don't throw - just log
        console.error("[AmadeusHotelDetailPage] Error fetching offers:", error);
      }
    }

    return (
      <div className="flex flex-col min-h-screen">
        {/* Hero Section with Images */}
        <section className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
          {hotel.images && hotel.images.length > 0 ? (
            <div className="relative w-full h-full">
              <Image
                src={hotel.images[0]}
                alt={hotel.name}
                fill
                className="object-cover"
                priority
                onError={(e) => {
                  // Prevent infinite loop by hiding image and showing placeholder
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <MapPin className="h-24 w-24 text-primary/30" />
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="container mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 text-shadow-lg">
                {hotel.name}
              </h1>
              <div className="flex items-center gap-4 text-lg text-white/90">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{hotel.city}, {hotel.country}</span>
                </div>
                {hotel.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span>{hotel.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {hotel.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {hotel.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Amenities */}
              {hotel.amenities && hotel.amenities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {hotel.amenities.map((amenity: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="outline">{amenity}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Gallery */}
              {hotel.images && hotel.images.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {hotel.images.slice(1, 7).map((image: string, index: number) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                          <Image
                            src={image}
                            alt={`${hotel.name} ${index + 2}`}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              // Prevent infinite loop by hiding image
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Location Map */}
              {hotel.latitude && hotel.longitude && (
                <Card>
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] rounded-lg overflow-hidden">
                      <HotelMap
                        hotels={[
                          {
                            id: hotel.id,
                            name: hotel.name,
                            latitude: hotel.latitude,
                            longitude: hotel.longitude,
                            address: hotel.address,
                            city: hotel.city || "",
                            country: hotel.country || "",
                            placeId: hotel.placeId || null,
                          },
                        ]}
                      />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      {hotel.address}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Hotel Offers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {offers.length > 0 ? (
                    offers.map((offer: any, index: number) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{offer.room?.type || "Standard Room"}</p>
                            {offer.room?.description && (
                              <p className="text-sm text-muted-foreground">
                                {offer.room.description.text}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(
                                parseFloat(offer.price?.total || "0"),
                                offer.price?.currency || "EGP"
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">per night</p>
                          </div>
                        </div>
                        {offer.cancellationPolicies && (
                          <div className="text-xs text-muted-foreground">
                            <p>
                              Cancellation: {offer.cancellationPolicies[0]?.type || "Varies"}
                            </p>
                          </div>
                        )}
                        <Button className="w-full" size="sm">
                          Book Now
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground mb-4">
                        Select dates to view pricing
                      </p>
                      <Button asChild variant="outline" className="w-full">
                        <a href={`/hotels/amadeus/${hotelId}?checkInDate=${queryParams.checkInDate || ""}&checkOutDate=${queryParams.checkOutDate || ""}`}>
                          Select Dates
                        </a>
                      </Button>
                    </div>
                  )}

                  {hotel.priceRange && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Price Range</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(hotel.priceRange.min, hotel.currency)} - {formatCurrency(hotel.priceRange.max, hotel.currency)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error("Error loading hotel:", error);
    notFound();
  }
}

