/**
 * Unified search service that combines internal and Amadeus hotels
 */

import { Hotel, HotelSearchOptions, HotelSearchResult, HotelProvider, HotelSearchFilters } from "./types";
import { InternalHotelService } from "./internalHotelService";
import { AmadeusHotelService } from "./amadeusHotelService";
import {
  normalizePrice,
  normalizeRating,
  normalizeImages,
  normalizeAmenities,
  calculateDistance,
  getCityCenter,
} from "./hotelNormalizer";

export class UnifiedSearchService {
  private internalService: InternalHotelService;
  private amadeusService: AmadeusHotelService;

  constructor() {
    this.internalService = new InternalHotelService();
    this.amadeusService = new AmadeusHotelService();
  }

  /**
   * Main search method that combines results from both sources
   */
  async searchHotels(options: HotelSearchOptions): Promise<HotelSearchResult> {
    const {
      filters = {},
      sortBy = "price",
      page = 1,
      pageSize = 20,
      ...searchParams
    } = options;

    const sources = filters.sources || [HotelProvider.INTERNAL, HotelProvider.AMADEUS];
    const allHotels: Hotel[] = [];

    // Fetch from internal hotels if requested
    if (sources.includes(HotelProvider.INTERNAL)) {
      try {
        const internalResult = await this.internalService.searchHotels({
          city: searchParams.city,
          country: searchParams.country,
        });
        allHotels.push(...internalResult.hotels);
      } catch (error) {
        console.error("[UnifiedSearchService] Error fetching internal hotels:", error);
      }
    }

    // Fetch from Amadeus if requested and required params are present
    if (
      sources.includes(HotelProvider.AMADEUS) &&
      searchParams.cityCode &&
      searchParams.checkInDate &&
      searchParams.checkOutDate
    ) {
      try {
        const amadeusResult = await this.amadeusService.searchHotels({
          cityCode: searchParams.cityCode,
          checkInDate: searchParams.checkInDate,
          checkOutDate: searchParams.checkOutDate,
          adults: searchParams.adults || 1,
          children: searchParams.children,
          currencyCode: searchParams.currencyCode || "EGP",
        });
        allHotels.push(...amadeusResult.hotels);
      } catch (error) {
        console.error("[UnifiedSearchService] Error fetching Amadeus hotels:", error);
      }
    }

    // Normalize all hotels
    const normalizedHotels = allHotels.map((hotel) => this.normalizeHotel(hotel, searchParams.city || ""));

    // Apply filters
    const filteredHotels = this.applyFilters(normalizedHotels, filters);

    // Sort hotels
    const sortedHotels = this.sortHotels(filteredHotels, sortBy, searchParams.city || "");

    // Calculate pagination
    const total = sortedHotels.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedHotels = sortedHotels.slice(startIndex, endIndex);

    return {
      hotels: paginatedHotels,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Normalize hotel data for consistent display
   */
  private normalizeHotel(hotel: Hotel, city: string): Hotel {
    return {
      ...hotel,
      images: normalizeImages(hotel),
      amenities: normalizeAmenities(hotel),
      // Ensure price is normalized
      priceRange: hotel.priceRange || (normalizePrice(hotel) ? { min: normalizePrice(hotel)!, max: normalizePrice(hotel)! } : null),
    };
  }

  /**
   * Apply filters to hotel list
   */
  private applyFilters(hotels: Hotel[], filters: HotelSearchFilters): Hotel[] {
    let filtered = [...hotels];

    // Filter by source (already handled in search, but double-check)
    if (filters.sources && filters.sources.length > 0) {
      filtered = filtered.filter((hotel) => filters.sources!.includes(hotel.provider));
    }

    // Filter by price range
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filtered = filtered.filter((hotel) => {
        const price = normalizePrice(hotel);
        if (price === null) return false;
        if (filters.minPrice !== undefined && price < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;
        return true;
      });
    }

    // Filter by rating range
    if (filters.minRating !== undefined || filters.maxRating !== undefined) {
      filtered = filtered.filter((hotel) => {
        const rating = normalizeRating(hotel);
        if (rating === null) return false;
        if (filters.minRating !== undefined && rating < filters.minRating) return false;
        if (filters.maxRating !== undefined && rating > filters.maxRating) return false;
        return true;
      });
    }

    // Filter by amenities
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter((hotel) => {
        const hotelAmenities = normalizeAmenities(hotel).map((a) => a.toLowerCase());
        return filters.amenities!.some((amenity) =>
          hotelAmenities.some((h) => h.includes(amenity.toLowerCase()))
        );
      });
    }

    // Filter by hotel name search query
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter((hotel) => hotel.name.toLowerCase().includes(query));
    }

    return filtered;
  }

  /**
   * Sort hotels by specified criteria
   */
  private sortHotels(hotels: Hotel[], sortBy: string, city: string): Hotel[] {
    const sorted = [...hotels];

    switch (sortBy) {
      case "price":
        sorted.sort((a, b) => {
          const priceA = normalizePrice(a) ?? Infinity;
          const priceB = normalizePrice(b) ?? Infinity;
          return priceA - priceB;
        });
        break;

      case "rating":
        sorted.sort((a, b) => {
          const ratingA = normalizeRating(a) ?? 0;
          const ratingB = normalizeRating(b) ?? 0;
          return ratingB - ratingA; // Descending (highest first)
        });
        break;

      case "distance":
        const cityCenter = getCityCenter(city, "");
        if (cityCenter) {
          sorted.sort((a, b) => {
            const distA = calculateDistance(a.latitude, a.longitude, cityCenter.lat, cityCenter.lng) ?? Infinity;
            const distB = calculateDistance(b.latitude, b.longitude, cityCenter.lat, cityCenter.lng) ?? Infinity;
            return distA - distB;
          });
        }
        break;

      default:
        // Default: sort by price
        sorted.sort((a, b) => {
          const priceA = normalizePrice(a) ?? Infinity;
          const priceB = normalizePrice(b) ?? Infinity;
          return priceA - priceB;
        });
    }

    return sorted;
  }

  /**
   * Merge results from multiple sources (legacy method, kept for compatibility)
   */
  mergeResults(internalHotels: Hotel[], amadeusHotels: Hotel[]): Hotel[] {
    return [...internalHotels, ...amadeusHotels];
  }
}

