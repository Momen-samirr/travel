/**
 * Utility functions for formatting and processing flight data
 */

export interface FlightSegment {
  departure: {
    iataCode: string;
    at: string;
    terminal?: string;
  };
  arrival: {
    iataCode: string;
    at: string;
    terminal?: string;
  };
  carrierCode: string;
  number: string;
  duration: string;
  numberOfStops: number;
}

export interface FlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    duration: string;
    segments: FlightSegment[];
  }>;
  validatingAirlineCodes: string[];
  travelerPricings?: Array<{
    fareDetailsBySegment: Array<{
      cabin: string;
      includedCheckedBags?: {
        quantity: number;
      };
    }>;
  }>;
}

/**
 * Format duration string (PT12H30M) to human-readable format (12h 30m)
 */
export function formatDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;

  if (hours === 0 && minutes === 0) return "0m";
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Format date-time string to time only (HH:MM)
 */
export function formatTime(dateTime: string): string {
  try {
    const date = new Date(dateTime);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return dateTime;
  }
}

/**
 * Format date-time string to date (MMM DD)
 */
export function formatFlightDate(dateTime: string): string {
  try {
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateTime;
  }
}

/**
 * Calculate layover time between two segments
 */
export function calculateLayover(segment1: FlightSegment, segment2: FlightSegment): number {
  try {
    const arrival = new Date(segment1.arrival.at);
    const departure = new Date(segment2.departure.at);
    return Math.floor((departure.getTime() - arrival.getTime()) / (1000 * 60)); // minutes
  } catch {
    return 0;
  }
}

/**
 * Format layover time
 */
export function formatLayover(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Get number of stops for an itinerary
 */
export function getNumberOfStops(itinerary: FlightOffer["itineraries"][0]): number {
  return itinerary.segments.reduce((total, segment) => total + segment.numberOfStops, 0);
}

/**
 * Format stops information
 */
export function formatStops(itinerary: FlightOffer["itineraries"][0]): string {
  const stops = getNumberOfStops(itinerary);
  if (stops === 0) return "Non-stop";
  if (stops === 1) {
    // Find the stop airport
    const stopAirport = itinerary.segments.find((seg) => seg.numberOfStops > 0);
    if (stopAirport) {
      return `1 stop in ${stopAirport.arrival.iataCode}`;
    }
    return "1 stop";
  }
  return `${stops} stops`;
}

/**
 * Get cabin class from flight offer
 */
export function getCabinClass(offer: FlightOffer): string {
  const cabin = offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin;
  if (!cabin) return "Economy";

  const cabinMap: Record<string, string> = {
    ECONOMY: "Economy",
    PREMIUM_ECONOMY: "Premium Economy",
    BUSINESS: "Business",
    FIRST: "First",
  };

  return cabinMap[cabin.toUpperCase()] || cabin;
}

/**
 * Get baggage information
 */
export function getBaggageInfo(offer: FlightOffer): string {
  const checkedBags = offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity || 0;
  if (checkedBags === 0) return "No checked bag included";
  if (checkedBags === 1) return "1 checked bag included";
  return `${checkedBags} checked bags included`;
}

/**
 * Format airport code with city name
 */
export function formatAirport(airportCode: string, cityName?: string): string {
  if (cityName) {
    return `${cityName} (${airportCode})`;
  }
  return airportCode;
}

/**
 * Get airline name from carrier code (basic mapping)
 */
export function getAirlineName(carrierCode: string): string {
  const airlines: Record<string, string> = {
    MS: "Egyptair",
    SU: "Aeroflot",
    TK: "Turkish Airlines",
    LH: "Lufthansa",
    BA: "British Airways",
    AF: "Air France",
    KL: "KLM",
    EK: "Emirates",
    QR: "Qatar Airways",
    EY: "Etihad Airways",
    AA: "American Airlines",
    UA: "United Airlines",
    DL: "Delta Air Lines",
  };

  return airlines[carrierCode] || carrierCode;
}

/**
 * Sort flights by various criteria
 */
export function sortFlights(
  flights: FlightOffer[],
  sortBy: "price" | "duration" | "departure",
  order: "asc" | "desc" = "asc"
): FlightOffer[] {
  const sorted = [...flights];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "price":
        comparison = parseFloat(a.price.total) - parseFloat(b.price.total);
        break;
      case "duration":
        const durationA = parseDurationToMinutes(a.itineraries[0]?.duration || "PT0H0M");
        const durationB = parseDurationToMinutes(b.itineraries[0]?.duration || "PT0H0M");
        comparison = durationA - durationB;
        break;
      case "departure":
        const timeA = new Date(a.itineraries[0]?.segments[0]?.departure.at || 0).getTime();
        const timeB = new Date(b.itineraries[0]?.segments[0]?.departure.at || 0).getTime();
        comparison = timeA - timeB;
        break;
    }

    return order === "asc" ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Parse duration string to minutes
 */
function parseDurationToMinutes(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;

  return hours * 60 + minutes;
}

/**
 * Filter flights by various criteria
 */
export function filterFlights(
  flights: FlightOffer[],
  filters: {
    airlines?: string[];
    maxStops?: number;
    minPrice?: number;
    maxPrice?: number;
    departureTimeRange?: { start: number; end: number };
  }
): FlightOffer[] {
  return flights.filter((flight) => {
    // Filter by airlines
    if (filters.airlines && filters.airlines.length > 0) {
      const flightAirlines = flight.validatingAirlineCodes || [];
      if (!filters.airlines.some((airline) => flightAirlines.includes(airline))) {
        return false;
      }
    }

    // Filter by stops
    if (filters.maxStops !== undefined) {
      const stops = getNumberOfStops(flight.itineraries[0]);
      if (stops > filters.maxStops) {
        return false;
      }
    }

    // Filter by price
    const price = parseFloat(flight.price.total);
    if (filters.minPrice !== undefined && price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && price > filters.maxPrice) {
      return false;
    }

    // Filter by departure time
    if (filters.departureTimeRange) {
      const departureTime = new Date(flight.itineraries[0]?.segments[0]?.departure.at || 0);
      const hour = departureTime.getHours();
      if (hour < filters.departureTimeRange.start || hour >= filters.departureTimeRange.end) {
        return false;
      }
    }

    return true;
  });
}

