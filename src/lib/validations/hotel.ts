import { z } from "zod";

export const hotelSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().min(1, "Description is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  placeId: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  amenities: z.array(z.string()).optional().default([]),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  isActive: z.boolean().default(true),
});

export type HotelInput = z.infer<typeof hotelSchema>;

