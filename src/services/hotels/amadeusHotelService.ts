import {
  searchHotelsByCity,
  getHotelOffers,
  getHotelDetails,
  getHotelPhotos,
} from "@/lib/amadeus";
import {
  Hotel,
  HotelSearchParams,
  HotelSearchResult,
  HotelProvider,
  IHotelService,
} from "./types";

/**
 * Service for managing Amadeus hotels from the API
 */
export class AmadeusHotelService implements IHotelService {
  async searchHotels(params: HotelSearchParams): Promise<HotelSearchResult> {
    try {
      if (!params.cityCode || !params.checkInDate || !params.checkOutDate) {
        throw new Error("cityCode, checkInDate, and checkOutDate are required for Amadeus hotel search");
      }

      const response = await searchHotelsByCity({
        cityCode: params.cityCode,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        adults: params.adults || 1,
        children: params.children,
        currencyCode: params.currencyCode || "EGP",
      });

      const hotels: Hotel[] = [];
      const data = response.data || [];

      for (const item of data) {
        // Handle both structures: { hotel: {...}, offers: [...] } or direct hotel object
        const hotelData = item.hotel || item;
        const offers = item.offers || [];
        
        const hotel = this.transformAmadeusHotelToUnified(hotelData, offers);
        if (hotel) {
          hotels.push(hotel);
        }
      }

      return {
        hotels,
        total: hotels.length,
        hasMore: response.meta?.count ? response.meta.count > hotels.length : false,
      };
    } catch (error: any) {
      console.error("[AmadeusHotelService] Error searching hotels:", error);
      throw new Error(`Failed to search Amadeus hotels: ${error.message || "Unknown error"}`);
    }
  }

  async getHotelById(
    hotelId: string,
    params?: HotelSearchParams
  ): Promise<Hotel | null> {
    try {
      // Get hotel details
      const detailsResponse = await getHotelDetails(hotelId);
      const hotelData = detailsResponse.data?.[0];

      if (!hotelData) {
        return null;
      }

      // Get hotel offers if dates provided
      let offers: any[] = [];
      if (params?.checkInDate && params?.checkOutDate) {
        try {
          const offersResponse = await getHotelOffers({
            hotelId,
            checkInDate: params.checkInDate,
            checkOutDate: params.checkOutDate,
            adults: params.adults || 1,
            children: params.children,
            currencyCode: params.currencyCode || "EGP",
          });
          offers = offersResponse.data?.offers || [];
        } catch (error) {
          console.warn("[AmadeusHotelService] Failed to get offers:", error);
          // Continue without offers
        }
      }

      // Get hotel photos
      let photos: string[] = [];
      try {
        const photosResponse = await getHotelPhotos(hotelId);
        const mediaData = photosResponse.data || [];
        photos = mediaData
          .filter((item: any) => item.uri)
          .map((item: any) => item.uri);
      } catch (error) {
        console.warn("[AmadeusHotelService] Failed to get photos:", error);
        // Continue without photos
      }

      return this.transformAmadeusHotelDetailsToUnified(hotelData, offers, photos);
    } catch (error: any) {
      console.error("[AmadeusHotelService] Error getting hotel by ID:", error);
      throw new Error(`Failed to get Amadeus hotel: ${error.message || "Unknown error"}`);
    }
  }

  private transformAmadeusHotelToUnified(hotelData: any, offers: any[] = []): Hotel | null {
    try {
      // Handle both structures: direct hotel object or wrapped in { hotel: {...} }
      const hotel = hotelData.hotel || hotelData;
      if (!hotel || !hotel.hotelId) {
        return null;
      }

      const geoCode = hotel.geoCode || {};
      const address = hotel.address || {};
      const amenities = hotel.amenities || [];
      const media = hotel.media || [];

      // Extract images from media array
      const images: string[] = [];
      if (Array.isArray(media)) {
        media.forEach((m: any) => {
          // Handle different media formats
          if (typeof m === 'string') {
            images.push(m);
          } else if (m.uri) {
            images.push(m.uri);
          } else if (m.src) {
            images.push(m.src);
          } else if (m.url) {
            images.push(m.url);
          } else if (m.link) {
            images.push(m.link);
          }
        });
      }
      
      // Debug: Log if we found images
      if (images.length > 0) {
        console.log(`[AmadeusHotelService] Found ${images.length} images for hotel ${hotel.hotelId}`);
      }

      // Extract price range from offers if available
      let priceRange: { min: number; max: number } | null = null;
      if (offers && offers.length > 0) {
        const prices = offers
          .map((offer: any) => {
            const total = parseFloat(offer.price?.total || "0");
            return total > 0 ? total : null;
          })
          .filter((p: number | null) => p !== null) as number[];

        if (prices.length > 0) {
          priceRange = {
            min: Math.min(...prices),
            max: Math.max(...prices),
          };
        }
      }

      return {
        id: hotel.hotelId,
        provider: HotelProvider.AMADEUS,
        hotelId: hotel.hotelId,
        name: hotel.name || "Unknown Hotel",
        description: hotel.description?.text || null,
        address: [
          address.lines?.join(", ") || "",
          address.cityName || "",
          address.countryCode || "",
        ]
          .filter(Boolean)
          .join(", "),
        city: address.cityName || "",
        country: address.countryCode || "",
        latitude: geoCode.latitude ? parseFloat(geoCode.latitude) : null,
        longitude: geoCode.longitude ? parseFloat(geoCode.longitude) : null,
        rating: hotel.rating ? parseFloat(hotel.rating) : null,
        starRating: hotel.hotelDistance?.distance ? null : hotel.rating ? parseFloat(hotel.rating) : null,
        images: images.length > 0 ? images : [], // Return empty array if no images
        amenities: amenities.map((a: any) => a.description || a),
        currency: offers?.[0]?.price?.currency || "EGP",
        priceRange,
      };
    } catch (error) {
      console.error("[AmadeusHotelService] Error transforming hotel:", error);
      return null;
    }
  }

  private transformAmadeusHotelDetailsToUnified(
    hotelData: any,
    offers: any[],
    photos: string[]
  ): Hotel {
    const geoCode = hotelData.geoCode || {};
    const address = hotelData.address || {};
    const amenities = hotelData.amenities || [];

    // Extract price range from offers
    let priceRange: { min: number; max: number } | null = null;
    if (offers.length > 0) {
      const prices = offers
        .map((offer) => {
          const total = parseFloat(offer.price?.total || "0");
          return total > 0 ? total : null;
        })
        .filter((p: number | null) => p !== null) as number[];

      if (prices.length > 0) {
        priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices),
        };
      }
    }

    return {
      id: hotelData.hotelId,
      provider: HotelProvider.AMADEUS,
      hotelId: hotelData.hotelId,
      name: hotelData.name || "Unknown Hotel",
      description: hotelData.description?.text || null,
      address: [
        address.lines?.join(", ") || "",
        address.cityName || "",
        address.countryCode || "",
      ]
        .filter(Boolean)
        .join(", "),
      city: address.cityName || "",
      country: address.countryCode || "",
      latitude: geoCode.latitude ? parseFloat(geoCode.latitude) : null,
      longitude: geoCode.longitude ? parseFloat(geoCode.longitude) : null,
      rating: hotelData.rating ? parseFloat(hotelData.rating) : null,
      starRating: hotelData.rating ? parseFloat(hotelData.rating) : null,
      images: photos.length > 0 ? photos : [],
      amenities: amenities.map((a: any) => a.description || a),
      currency: offers[0]?.price?.currency || "EGP",
      priceRange,
    };
  }
}

