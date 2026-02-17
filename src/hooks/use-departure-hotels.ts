import { useState, useEffect } from "react";

interface RoomTypePricing {
  roomType: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD";
  price: number;
  childPrice: number | null;
  infantPrice: number | null;
  currency: string;
}

interface HotelOption {
  id: string;
  hotel: {
    id: string;
    name: string;
    city: string;
    country: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    placeId: string | null;
  };
  roomTypePricings: RoomTypePricing[];
  currency: string;
  starRating: number | null;
  bookingRating: number | null;
}

interface UseDepartureHotelsResult {
  hotels: HotelOption[];
  loading: boolean;
  error: string | null;
}

export function useDepartureHotels(
  packageId: string | null,
  departureOptionId: string | null
): UseDepartureHotelsResult {
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!packageId || !departureOptionId) {
      setHotels([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(
      `/api/charter-packages/${packageId}/departure-options/${departureOptionId}/hotels`
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch hotels");
        }
        return res.json();
      })
      .then((data) => {
        setHotels(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching hotels:", err);
        setError(err.message || "Failed to fetch hotels");
        setHotels([]);
        setLoading(false);
      });
  }, [packageId, departureOptionId]);

  return { hotels, loading, error };
}

