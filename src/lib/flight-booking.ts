/**
 * Utility functions for flight booking flow
 */

import type { FlightOffer } from "./flight-utils";

export interface FlightBookingData {
  offerId: string;
  flightOffer: FlightOffer;
  returnOffer?: FlightOffer;
  searchParams: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children: number;
    infants: number;
    travelClass?: string;
  };
  passengers?: any[];
  contact?: {
    email: string;
    phone: string;
    countryCode?: string;
  };
  addOns?: any;
  timestamp: number; // For expiry checking
}

const STORAGE_PREFIX = "flightBooking_";
const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

/**
 * Store flight booking data in sessionStorage
 */
export function storeFlightBookingData(offerId: string, data: FlightBookingData): void {
  if (typeof window === "undefined") return;
  
  try {
    const storageData = {
      ...data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(`${STORAGE_PREFIX}${offerId}`, JSON.stringify(storageData));
  } catch (error) {
    console.error("Error storing flight booking data:", error);
  }
}

/**
 * Get flight booking data from sessionStorage
 */
export function getFlightBookingData(offerId: string): FlightBookingData | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${offerId}`);
    if (!stored) return null;
    
    const data = JSON.parse(stored) as FlightBookingData;
    
    // Check expiry
    if (Date.now() - data.timestamp > EXPIRY_TIME) {
      sessionStorage.removeItem(`${STORAGE_PREFIX}${offerId}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error getting flight booking data:", error);
    return null;
  }
}

/**
 * Check if flight booking data is expired
 */
export function isFlightBookingExpired(offerId: string): boolean {
  if (typeof window === "undefined") return true;
  
  try {
    const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${offerId}`);
    if (!stored) return true;
    
    const data = JSON.parse(stored) as FlightBookingData;
    return Date.now() - data.timestamp > EXPIRY_TIME;
  } catch {
    return true;
  }
}

/**
 * Get time until expiry in minutes
 */
export function getTimeUntilExpiry(offerId: string): number {
  if (typeof window === "undefined") return 0;
  
  try {
    const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${offerId}`);
    if (!stored) return 0;
    
    const data = JSON.parse(stored) as FlightBookingData;
    const elapsed = Date.now() - data.timestamp;
    const remaining = EXPIRY_TIME - elapsed;
    
    return Math.max(0, Math.floor(remaining / 60000)); // Convert to minutes
  } catch {
    return 0;
  }
}

/**
 * Clear flight booking data
 */
export function clearFlightBookingData(offerId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${offerId}`);
  } catch (error) {
    console.error("Error clearing flight booking data:", error);
  }
}

/**
 * Update passengers in stored booking data
 */
export function updatePassengers(offerId: string, passengers: any[], contact: any): void {
  if (typeof window === "undefined") return;
  
  try {
    const data = getFlightBookingData(offerId);
    if (data) {
      data.passengers = passengers;
      data.contact = contact;
      storeFlightBookingData(offerId, data);
    }
  } catch (error) {
    console.error("Error updating passengers:", error);
  }
}

/**
 * Update add-ons in stored booking data
 */
export function updateAddOns(offerId: string, addOns: any): void {
  if (typeof window === "undefined") return;
  
  try {
    const data = getFlightBookingData(offerId);
    if (data) {
      data.addOns = addOns;
      storeFlightBookingData(offerId, data);
    }
  } catch (error) {
    console.error("Error updating add-ons:", error);
  }
}

