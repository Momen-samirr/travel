/**
 * Amadeus Online Suite (AOS) – redirect-only flight search.
 * No Amadeus API calls; no credentials. Builds the AOS flight search URL from form inputs.
 * Parameter names and date format (DD-MMM-YYYY) match the AOS URL format (e.g. tishoury.amadeusonlinesuite.com).
 */

const AOS_FLIGHT_SEARCH_PATH = "/flight/search";

const MONTHS: string[] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Convert YYYY-MM-DD (form value) to DD-MMM-YYYY (e.g. 2026-03-10 → 10-Mar-2026). */
function formatAosDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return isoDate;
  const day = String(d).padStart(2, "0");
  const month = MONTHS[m - 1] ?? "Jan";
  return `${day}-${month}-${y}`;
}

/** Map travelClass to AOS cabin code: Y/W/C/F; default Y. */
function toAosCabinCode(travelClass?: string): string {
  const map: Record<string, string> = {
    ECONOMY: "Y",
    PREMIUM_ECONOMY: "W",
    BUSINESS: "C",
    FIRST: "F",
  };
  return (travelClass && map[travelClass.toUpperCase()]) || "Y";
}

export interface AosFlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  tripType: "oneway" | "round";
  travelClass?: string;
  adults: number;
  children?: number;
  infants?: number;
  language?: string;
  currency?: string;
}

/**
 * Build the Amadeus Online Suite flight search URL.
 * Base URL: https://{agency}.amadeusonlinesuite.com/flight/search
 * Uses NEXT_PUBLIC_AOS_AGENCY for the agency subdomain.
 */
export function buildAosFlightSearchUrl(params: AosFlightSearchParams): string {
  const agency = process.env.NEXT_PUBLIC_AOS_AGENCY || "agency";
  const base = `https://${agency}.amadeusonlinesuite.com${AOS_FLIGHT_SEARCH_PATH}`;
  const searchParams = new URLSearchParams();

  const origin = params.origin.trim().toUpperCase();
  const destination = params.destination.trim().toUpperCase();
  const cabin = toAosCabinCode(params.travelClass);
  const isRound = params.tripType === "round" && params.returnDate;

  // Leg 1 (outbound)
  searchParams.set("dep1", origin);
  searchParams.set("ret1", destination);
  searchParams.set("dtt1", formatAosDate(params.departureDate));
  searchParams.set("cl1", cabin);

  // Leg 2 (return) – only for round trip
  if (isRound && params.returnDate) {
    searchParams.set("dep2", destination);
    searchParams.set("ret2", origin);
    searchParams.set("dtt2", formatAosDate(params.returnDate));
    searchParams.set("cl2", cabin);
  }

  searchParams.set("triptype", isRound ? "2" : "1");
  searchParams.set("adult", String(params.adults));
  searchParams.set("child", String(params.children ?? 0));
  searchParams.set("infant", String(params.infants ?? 0));

  // Fixed params (per client URL)
  searchParams.set("direct", "false");
  searchParams.set("baggage", "false");
  searchParams.set("pft", "");
  searchParams.set("key", "IRT");
  searchParams.set("airlines", "");
  searchParams.set("ref", "false");
  searchParams.set("ipc", "false");

  searchParams.set("lc", params.language || "EN");
  searchParams.set("curr", params.currency || "EGP");
  searchParams.set("currtime", String(Date.now()));

  return `${base}?${searchParams.toString()}`;
}
