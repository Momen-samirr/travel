/**
 * Unified package types for multiple package types
 */

export enum PackageType {
  CHARTER = "CHARTER",
  INBOUND = "INBOUND",
  REGULAR = "REGULAR",
}

export interface TravelPackage {
  id: string;
  type: PackageType;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  destinationCountry: string;
  destinationCity: string;
  nights: number;
  days: number;
  mainImage: string | null;
  gallery: any;
  basePrice: number | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  currency: string;
  discount: number | null;
  typeConfig: any | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageSearchParams {
  type?: PackageType;
  destinationCountry?: string;
  destinationCity?: string;
  minPrice?: number;
  maxPrice?: number;
  minNights?: number;
  maxNights?: number;
  minDays?: number;
  maxDays?: number;
  departureDateFrom?: string;
  departureDateTo?: string;
  hotelRating?: number[];
  page?: number;
  pageSize?: number;
}

export interface PackageSelections {
  packageId: string;
  departureOptionId?: string; // For HOTEL_CHARTER
  hotelOptionId?: string;
  roomType?: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD";
  numberOfAdults?: number;
  numberOfChildren6to12?: number;
  numberOfChildren2to6?: number;
  numberOfInfants?: number;
  selectedAddonIds?: string[];
  pickupLocation?: string; // For INBOUND
  transferOptions?: string[]; // For INBOUND
  // Legacy field for backward compatibility
  numberOfChildren?: number;
}

export interface PriceCalculation {
  basePrice: number;
  hotelPrice: number;
  roomPrice: number;
  addonsPrice: number;
  totalPrice: number;
  currency: string;
  breakdown: {
    label: string;
    amount: number;
  }[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PackageSearchResult {
  packages: TravelPackage[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

