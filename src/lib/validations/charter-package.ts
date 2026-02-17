import { z } from "zod";

export const charterPackageSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().min(1, "Short description is required").max(500),
  destinationCountry: z.string().min(1, "Destination country is required"),
  destinationCity: z.string().min(1, "Destination city is required"),
  nights: z.number().int().positive("Nights must be positive"),
  days: z.number().int().positive("Days must be positive"),
  mainImage: z.string().url().optional().nullable(),
  gallery: z.array(z.string().url()).min(0),
  basePrice: z.number().positive().optional().nullable(),
  priceRangeMin: z.number().positive().optional().nullable(),
  priceRangeMax: z.number().positive().optional().nullable(),
  currency: z.string().min(1, "Currency is required"),
  discount: z.number().min(0).max(100).optional().nullable(),
  isActive: z.boolean().default(true),
  includedServices: z.array(z.string()).min(0),
  excludedServices: z.array(z.string()).min(0),
  excursionProgram: z.array(z.string()).min(0),
  requiredDocuments: z.array(z.string()).min(0),
});

export type CharterPackageInput = z.infer<typeof charterPackageSchema>;

export const charterPackageHotelOptionSchema = z.object({
  hotelId: z.string().min(1, "Hotel is required"),
  starRating: z.number().int().min(1).max(5).optional().nullable(),
  bookingRating: z.number().min(0).max(10).optional().nullable(),
  distanceFromCenter: z.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CharterPackageHotelOptionInput = z.infer<typeof charterPackageHotelOptionSchema>;

export const roomTypePricingSchema = z.object({
  roomType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "QUAD"]),
  price: z.number().positive("Price must be positive"),
  childPrice: z.number().positive().optional().nullable(),
  infantPrice: z.number().positive().optional().nullable(),
  currency: z.string().default("EGP"),
});

export type RoomTypePricingInput = z.infer<typeof roomTypePricingSchema>;

export const departureHotelPricingSchema = z.object({
  hotelOptionId: z.string().min(1, "Hotel option is required"),
  currency: z.string().default("EGP"),
  roomTypePricings: z.array(roomTypePricingSchema).min(1, "At least one room type pricing is required"),
});

export type DepartureHotelPricingInput = z.infer<typeof departureHotelPricingSchema>;

export const charterDepartureOptionSchema = z.object({
  departureAirport: z.string().min(1, "Departure airport is required"),
  arrivalAirport: z.string().min(1, "Arrival airport is required"),
  departureDate: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === "string") return new Date(val);
    return val;
  }),
  returnDate: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === "string") return new Date(val);
    return val;
  }),
  flightInfo: z.string().optional().nullable(),
  priceModifier: z.number().optional().nullable(),
  currency: z.string().default("EGP"),
  isActive: z.boolean().default(true),
  hotelPricings: z.array(departureHotelPricingSchema).optional().default([]),
});

export type CharterDepartureOptionInput = z.infer<typeof charterDepartureOptionSchema>;

export const charterPackageAddonSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional().nullable(),
  price: z.number().positive("Price must be positive"),
  currency: z.string().default("EGP"),
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type CharterPackageAddonInput = z.infer<typeof charterPackageAddonSchema>;

export const charterPackageReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  images: z.array(z.string().url()).optional().nullable(),
});

export type CharterPackageReviewInput = z.infer<typeof charterPackageReviewSchema>;

