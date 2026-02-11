import { z } from "zod";

export const hotelSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  pricePerNight: z.number().positive("Price per night must be positive"),
  currency: z.string().default("EGP"),
  rating: z.number().min(0).max(5).optional().nullable(),
  amenities: z.array(z.string()).min(1, "At least one amenity is required"),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  checkInTime: z.string().optional().nullable(),
  checkOutTime: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type HotelInput = z.infer<typeof hotelSchema>;

