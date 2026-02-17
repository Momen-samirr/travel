/**
 * Unified hotel types for multiple providers
 */

export enum HotelProvider {
  INTERNAL = "INTERNAL",
  AMADEUS = "AMADEUS",
}

export interface Hotel {
  id: string;
  provider: HotelProvider;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  starRating?: number | null;
  images: string[];
  amenities: string[];
  currency: string;
  priceRange?: {
    min: number;
    max: number;
  } | null;
  // Amadeus-specific fields
  hotelId?: string; // Amadeus hotel ID
  checkInTime?: string | null;
  checkOutTime?: string | null;
  // Internal hotel-specific fields
  slug?: string;
  placeId?: string | null;
}

export interface HotelSearchParams {
  city?: string;
  country?: string;
  cityCode?: string; // For Amadeus
  checkInDate?: string; // For Amadeus
  checkOutDate?: string; // For Amadeus
  adults?: number; // For Amadeus
  children?: number; // For Amadeus
  currencyCode?: string; // For Amadeus
}

export interface HotelOffer {
  id: string;
  hotelId: string;
  roomType: string;
  description?: string;
  price: {
    total: number;
    currency: string;
    base?: number;
    taxes?: number;
  };
  cancellationPolicy?: {
    type: string;
    amount?: number;
  };
  checkInDate: string;
  checkOutDate: string;
  guests: {
    adults: number;
    children?: number;
  };
  amenities?: string[];
}

export interface HotelSearchFilters {
  sources?: HotelProvider[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxRating?: number;
  amenities?: string[];
  searchQuery?: string; // Hotel name search
}

export interface HotelSearchOptions extends HotelSearchParams {
  filters?: HotelSearchFilters;
  sortBy?: 'price' | 'rating' | 'distance';
  page?: number;
  pageSize?: number;
}

export interface HotelSearchResult {
  hotels: Hotel[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasMore?: boolean;
}

export interface IHotelService {
  searchHotels(params: HotelSearchParams): Promise<HotelSearchResult>;
  getHotelById(id: string, params?: HotelSearchParams): Promise<Hotel | null>;
}

