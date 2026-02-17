import { prisma } from "@/lib/prisma";
import { Hotel, HotelSearchParams, HotelSearchResult, HotelProvider, IHotelService } from "./types";

/**
 * Service for managing internal hotels from the database
 */
export class InternalHotelService implements IHotelService {
  async searchHotels(params: HotelSearchParams): Promise<HotelSearchResult> {
    try {
      const where: any = { isActive: true };

      if (params.city) {
        where.city = { contains: params.city, mode: "insensitive" };
      }
      if (params.country) {
        where.country = { contains: params.country, mode: "insensitive" };
      }

      const hotelsData = await prisma.hotel.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      const hotels: Hotel[] = hotelsData.map((hotel) => this.transformToUnifiedHotel(hotel));

      return {
        hotels,
        total: hotels.length,
      };
    } catch (error) {
      console.error("[InternalHotelService] Error searching hotels:", error);
      throw new Error("Failed to search internal hotels");
    }
  }

  async getHotelById(id: string): Promise<Hotel | null> {
    try {
      const hotel = await prisma.hotel.findUnique({
        where: { id },
      });

      if (!hotel) {
        return null;
      }

      return this.transformToUnifiedHotel(hotel);
    } catch (error) {
      console.error("[InternalHotelService] Error getting hotel by ID:", error);
      throw new Error("Failed to get internal hotel");
    }
  }

  async getHotelBySlug(slug: string): Promise<Hotel | null> {
    try {
      const hotel = await prisma.hotel.findUnique({
        where: { slug },
      });

      if (!hotel) {
        return null;
      }

      return this.transformToUnifiedHotel(hotel);
    } catch (error) {
      console.error("[InternalHotelService] Error getting hotel by slug:", error);
      throw new Error("Failed to get internal hotel");
    }
  }

  private transformToUnifiedHotel(hotel: any): Hotel {
    const images = Array.isArray(hotel.images) ? hotel.images : [];
    const amenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];

    return {
      id: hotel.id,
      provider: HotelProvider.INTERNAL,
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      city: hotel.city,
      country: hotel.country,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      rating: hotel.rating,
      images: images as string[],
      amenities: amenities as string[],
      currency: "EGP", // Default currency for internal hotels
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      slug: hotel.slug,
      placeId: hotel.placeId,
    };
  }
}

