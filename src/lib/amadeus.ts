const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
  console.warn("[Amadeus] Warning: AMADEUS_CLIENT_ID or AMADEUS_CLIENT_SECRET not set in environment variables");
}

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    throw new Error("Amadeus API credentials not configured. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables.");
  }

  // Check if we have a valid token
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: AMADEUS_CLIENT_ID,
      client_secret: AMADEUS_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    console.error("[Amadeus] Token request failed:", response.status, errorText);
    throw new Error(`Failed to get Amadeus access token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  if (!accessToken) {
    throw new Error("Failed to get access token from Amadeus: No token in response");
  }
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute before expiry

  return accessToken;
}

export type TravelClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

export async function searchFlightOffers(params: {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  currencyCode?: string;
  travelClass?: TravelClass;
}): Promise<any> {
  const token = await getAccessToken();

  const queryParams = new URLSearchParams({
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    adults: params.adults.toString(),
  });

  if (params.returnDate) {
    queryParams.append("returnDate", params.returnDate);
  }
  if (params.children) {
    queryParams.append("children", params.children.toString());
  }
  if (params.infants) {
    queryParams.append("infants", params.infants.toString());
  }
  if (params.currencyCode) {
    queryParams.append("currencyCode", params.currencyCode);
  }
  if (params.travelClass) {
    queryParams.append("travelClass", params.travelClass);
  }

  const apiUrl = `https://test.api.amadeus.com/v2/shopping/flight-offers?${queryParams.toString()}`;
  console.log("[Amadeus] Making request to:", apiUrl);
  console.log("[Amadeus] Request params:", Object.fromEntries(queryParams.entries()));

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("[Amadeus] Response status:", response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Amadeus] Error response text:", errorText);
    let errorMessage = "Failed to search flights";
    try {
      const errorJson = JSON.parse(errorText);
      console.error("[Amadeus] Parsed error JSON:", errorJson);
      errorMessage = errorJson.errors?.[0]?.detail || errorJson.error_description || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(`Amadeus API error: ${errorMessage}`);
  }

  const responseData = await response.json();
  console.log("[Amadeus] Response data structure:", {
    hasData: !!responseData.data,
    dataType: typeof responseData.data,
    dataIsArray: Array.isArray(responseData.data),
    dataLength: Array.isArray(responseData.data) ? responseData.data.length : "N/A",
    responseKeys: Object.keys(responseData),
  });

  if (Array.isArray(responseData.data) && responseData.data.length > 0) {
    console.log("[Amadeus] Sample flight offer keys:", Object.keys(responseData.data[0]));
  }

  return responseData;
}

export async function confirmFlightPrice(
  offerIdOrOffer: string | any
): Promise<any> {
  const token = await getAccessToken();

  // If offerIdOrOffer is a string, it's just an ID. Otherwise, it's the full offer.
  const flightOffers = typeof offerIdOrOffer === "string"
    ? [{ id: offerIdOrOffer }]
    : Array.isArray(offerIdOrOffer)
    ? offerIdOrOffer
    : [offerIdOrOffer];

  console.log("[Amadeus] Confirming flight price with:", {
    offerCount: flightOffers.length,
    isIdOnly: typeof offerIdOrOffer === "string",
  });

  const response = await fetch(
    "https://test.api.amadeus.com/v1/shopping/flight-offers/pricing",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "flight-offers-pricing",
          flightOffers,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Failed to confirm flight price";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.errors?.[0]?.detail || errorJson.error_description || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(`Amadeus API error: ${errorMessage}`);
  }

  const result = await response.json();
  console.log("[Amadeus] Price confirmation result:", {
    hasData: !!result.data,
    offerCount: result.data?.flightOffers?.length || 0,
  });

  return result;
}

export async function getAirportCityCodes(query: string): Promise<any> {
  const token = await getAccessToken();

  const response = await fetch(
    // Note: Amadeus uses page[limit] for pagination, not max
    `https://test.api.amadeus.com/v1/reference-data/locations?subType=AIRPORT,CITY&keyword=${encodeURIComponent(
      query
    )}&page[limit]=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Failed to search airport/city codes";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.errors?.[0]?.detail || errorJson.error_description || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Hotel API Functions

export async function searchHotelsByCity(params: {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children?: number;
  currencyCode?: string;
  hotelIds?: string[];
  amenities?: string[];
  ratings?: number[];
  priceRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}): Promise<any> {
  const token = await getAccessToken();

  // Step 1: Get hotel IDs by city using reference data API
  const hotelsByCityUrl = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${encodeURIComponent(params.cityCode)}`;
  console.log("[Amadeus Hotels] Step 1 - Getting hotels by city:", hotelsByCityUrl);

  const hotelsResponse = await fetch(hotelsByCityUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!hotelsResponse.ok) {
    const errorText = await hotelsResponse.text();
    console.error("[Amadeus Hotels] Error getting hotels by city:", errorText);
    let errorMessage = "Failed to get hotels by city";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.errors?.[0]?.detail || errorJson.error_description || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(`Amadeus API error: ${errorMessage}`);
  }

  const hotelsData = await hotelsResponse.json();
  const hotelsList = hotelsData.data || [];

  if (hotelsList.length === 0) {
    console.warn("[Amadeus Hotels] No hotels found for city:", params.cityCode);
    return { data: [], meta: { count: 0 } };
  }

  // Step 2: Get full hotel details and try to get offers
  // Limit to first 10 hotels for performance
  const limitedHotels = hotelsList.slice(0, 10);
  const results: any[] = [];

  console.log("[Amadeus Hotels] Step 2 - Processing", limitedHotels.length, "hotels");

  // Process each hotel - get details and try offers
  for (const hotelRef of limitedHotels) {
    const hotelId = hotelRef.hotelId;
    if (!hotelId) continue;

    let hotelDetails: any = hotelRef; // Start with reference data
    let offers: any[] = [];

    // Try to get full hotel details from reference API
    try {
      const detailsUrl = `https://test.api.amadeus.com/v3/reference-data/locations/hotels/${hotelId}`;
      const detailsResponse = await fetch(detailsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        if (detailsData.data && detailsData.data.length > 0) {
          hotelDetails = detailsData.data[0]; // Use full details if available
          
          // Check if hotel details already include media/images
          // The API might return media directly in the hotel object
          if (hotelDetails.media && Array.isArray(hotelDetails.media) && hotelDetails.media.length > 0) {
            console.log(`[Amadeus Hotels] Hotel ${hotelId} has ${hotelDetails.media.length} media items in details response`);
          } else {
            // Log structure for debugging
            console.log(`[Amadeus Hotels] Hotel ${hotelId} details structure:`, {
              hasMedia: !!hotelDetails.media,
              mediaType: typeof hotelDetails.media,
              keys: Object.keys(hotelDetails).slice(0, 10), // First 10 keys
            });
          }
        }
      }
    } catch (error) {
      // Continue with reference data if details fetch fails
      console.log(`[Amadeus Hotels] Could not fetch details for hotel ${hotelId}, using reference data`);
    }

    // Try to get hotel photos from media API (only if hotel details don't already have media)
    // Skip if hotel details already include media to avoid unnecessary API calls
    if (!hotelDetails?.media || !Array.isArray(hotelDetails.media) || hotelDetails.media.length === 0) {
      try {
        const photosData = await getHotelPhotos(hotelId);
        // The API returns data in format: { data: [{ uri: "...", category: "HOTEL" }] }
        // getHotelPhotos now returns { data: [] } for 404 instead of throwing
        if (photosData?.data && Array.isArray(photosData.data) && photosData.data.length > 0) {
          const photos = photosData.data
            .filter((photo: any) => photo.uri && photo.category === "HOTEL")
            .map((photo: any) => photo.uri)
            .slice(0, 5); // Limit to 5 photos per hotel
          
          // Add photos to hotel details if available
          if (photos.length > 0 && hotelDetails) {
            if (!hotelDetails.media) {
              hotelDetails.media = [];
            }
            // Merge photos with existing media, avoiding duplicates
            photos.forEach((photoUrl: string) => {
              const exists = hotelDetails.media.some((m: any) => m.uri === photoUrl);
              if (!exists) {
                hotelDetails.media.push({ uri: photoUrl });
              }
            });
          }
        }
        // Silently continue if no photos (404 is expected in test environment)
      } catch (error: any) {
        // Only log unexpected errors (not 404s)
        // getHotelPhotos now handles 404 gracefully, so this catch is for other errors
        if (error.message && !error.message.includes("404") && !error.message.includes("Resource not found")) {
          console.log(`[Amadeus Hotels] Unexpected error fetching photos for hotel ${hotelId}: ${error.message}`);
        }
      }
    }

    // Try to get offers (optional - hotel info is still valuable without offers)
    try {
      const queryParams = new URLSearchParams({
        hotelIds: hotelId,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        adults: params.adults.toString(),
      });

      if (params.children) {
        queryParams.append("children", params.children.toString());
      }
      if (params.currencyCode) {
        queryParams.append("currency", params.currencyCode);
      }

      const apiUrl = `https://test.api.amadeus.com/v2/shopping/hotel-offers/by-hotel?${queryParams.toString()}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const hotelOffersData = await response.json();
        if (hotelOffersData.data?.offers && Array.isArray(hotelOffersData.data.offers)) {
          offers = hotelOffersData.data.offers;
        }
      } else {
        // Offers not available - this is OK, we'll still return the hotel
        console.log(`[Amadeus Hotels] Offers not available for hotel ${hotelId} (this is normal in test environment)`);
      }
    } catch (error) {
      // Offers endpoint failed - continue without offers
      console.log(`[Amadeus Hotels] Could not fetch offers for hotel ${hotelId}, returning hotel info only`);
    }

    // Include hotel in results even if offers aren't available
    results.push({
      hotel: hotelDetails,
      offers: offers,
    });
  }

  console.log("[Amadeus Hotels] Successfully processed", results.length, "hotels (", results.filter(r => r.offers.length > 0).length, "with offers)");

  return {
    data: results,
    meta: {
      count: results.length,
    },
  };
}

export async function getHotelOffers(params: {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children?: number;
  currencyCode?: string;
}): Promise<any> {
  const token = await getAccessToken();

  const queryParams = new URLSearchParams({
    hotelIds: params.hotelId,
    checkInDate: params.checkInDate,
    checkOutDate: params.checkOutDate,
    adults: params.adults.toString(),
  });

  if (params.children) {
    queryParams.append("children", params.children.toString());
  }
  if (params.currencyCode) {
    queryParams.append("currency", params.currencyCode);
  }

  const apiUrl = `https://test.api.amadeus.com/v2/shopping/hotel-offers/by-hotel?${queryParams.toString()}`;
  console.log("[Amadeus Hotels] Making request to:", apiUrl);

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("[Amadeus Hotels] Response status:", response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Amadeus Hotels] Error response text:", errorText);
    let errorMessage = "Failed to get hotel offers";
    try {
      const errorJson = JSON.parse(errorText);
      console.error("[Amadeus Hotels] Parsed error JSON:", errorJson);
      errorMessage = errorJson.errors?.[0]?.detail || errorJson.error_description || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(`Amadeus API error: ${errorMessage}`);
  }

  const responseData = await response.json();
  return responseData;
}

export async function getHotelDetails(hotelId: string): Promise<any> {
  const token = await getAccessToken();

  const apiUrl = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-hotels?hotelIds=${encodeURIComponent(hotelId)}`;
  console.log("[Amadeus Hotels] Making request to:", apiUrl);

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("[Amadeus Hotels] Response status:", response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Amadeus Hotels] Error response text:", errorText);
    let errorMessage = "Failed to get hotel details";
    try {
      const errorJson = JSON.parse(errorText);
      console.error("[Amadeus Hotels] Parsed error JSON:", errorJson);
      errorMessage = errorJson.errors?.[0]?.detail || errorJson.error_description || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(`Amadeus API error: ${errorMessage}`);
  }

  const responseData = await response.json();
  return responseData;
}

export async function getHotelPhotos(hotelId: string): Promise<any> {
  const token = await getAccessToken();

  const apiUrl = `https://test.api.amadeus.com/v2/media/files?category=HOTEL&hotelIds=${encodeURIComponent(hotelId)}`;

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // 404 is expected in test environment - photos are not available
  if (response.status === 404) {
    return { data: [] }; // Return empty data instead of throwing
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Failed to get hotel photos";
    try {
      // Trim whitespace and parse JSON
      const trimmedText = errorText.trim();
      const errorJson = JSON.parse(trimmedText);
      errorMessage = errorJson.errors?.[0]?.detail || errorJson.error_description || errorMessage;
    } catch {
      errorMessage = errorText.trim() || errorMessage;
    }
    throw new Error(`Amadeus API error: ${errorMessage}`);
  }

  const responseData = await response.json();
  return responseData;
}

