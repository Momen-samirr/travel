/**
 * Utility functions to normalize hotel data from different sources
 */

import { Hotel } from "./types";

/**
 * Extract normalized price from hotel (min price from priceRange or offers)
 */
export function normalizePrice(hotel: Hotel): number | null {
  if (hotel.priceRange?.min) {
    return hotel.priceRange.min;
  }
  // If no priceRange, return null (price not available)
  return null;
}

/**
 * Normalize rating to consistent format (0-5 stars)
 */
export function normalizeRating(hotel: Hotel): number | null {
  // Prefer starRating, fallback to rating
  if (hotel.starRating !== null && hotel.starRating !== undefined) {
    return hotel.starRating;
  }
  if (hotel.rating !== null && hotel.rating !== undefined) {
    return hotel.rating;
  }
  return null;
}

/**
 * Normalize images array format
 */
export function normalizeImages(hotel: Hotel): string[] {
  if (Array.isArray(hotel.images)) {
    return hotel.images.filter((img) => img && typeof img === "string");
  }
  return [];
}

/**
 * Normalize amenities array format
 */
export function normalizeAmenities(hotel: Hotel): string[] {
  if (Array.isArray(hotel.amenities)) {
    return hotel.amenities.filter((amenity) => amenity && typeof amenity === "string");
  }
  return [];
}

/**
 * Calculate distance from city center (in km)
 * Uses Haversine formula
 */
export function calculateDistance(
  hotelLat: number | null,
  hotelLng: number | null,
  centerLat: number,
  centerLng: number
): number | null {
  if (!hotelLat || !hotelLng) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = toRad(centerLat - hotelLat);
  const dLng = toRad(centerLng - hotelLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(hotelLat)) *
      Math.cos(toRad(centerLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Get city center coordinates (default fallback)
 * In production, this could be fetched from a geocoding service
 */
export function getCityCenter(city: string, country: string): { lat: number; lng: number } | null {
  // Common city centers (can be expanded or fetched from API)
  const cityCenters: Record<string, { lat: number; lng: number }> = {
    "Cairo": { lat: 30.0444, lng: 31.2357 },
    "Alexandria": { lat: 31.2001, lng: 29.9187 },
    "Hurghada": { lat: 27.2574, lng: 33.8129 },
    "Sharm El Sheikh": { lat: 27.9158, lng: 34.3299 },
    "Luxor": { lat: 25.6872, lng: 32.6396 },
    "New York": { lat: 40.7128, lng: -74.006 },
    "London": { lat: 51.5074, lng: -0.1278 },
    "Paris": { lat: 48.8566, lng: 2.3522 },
    "Dubai": { lat: 25.2048, lng: 55.2708 },
  };

  const key = `${city}, ${country}`;
  return cityCenters[city] || cityCenters[key] || null;
}

