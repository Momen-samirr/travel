import { z } from "zod";
import { PackageType } from "@/services/packages/types";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const currencySchema = z.enum(SUPPORTED_CURRENCIES, {
  error: "Currency selection is required",
});

const inboundItineraryItemSchema = z.object({
  dayLabel: z.string().max(120).default(""),
  title: z.string().max(200).default(""),
  description: z.string().max(2000).default(""),
});

const inboundTransferOptionSchema = z.object({
  id: z.string().max(120).default(""),
  name: z.string().max(200).default(""),
  price: z.coerce.number().min(0, "Transfer price must be at least 0"),
});

export const inboundTypeConfigSchema = z.object({
  header: z.object({
    campaignTitle: z.string().max(200).default(""),
    subtitle: z.string().max(500).default(""),
    durationText: z.string().max(120).default(""),
  }),
  includes: z.array(z.string().min(1)).default([]),
  excludes: z.array(z.string().min(1)).default([]),
  itinerary: z.array(inboundItineraryItemSchema).default([]),
  offer: z.object({
    currentPrice: z.coerce.number().min(0, "Current price must be at least 0"),
    oldPrice: z.coerce.number().positive().optional().nullable(),
    currency: currencySchema,
    perPersonLabel: z.string().max(120).default("Per Person"),
    validUntilText: z.string().max(200).default(""),
  }),
  contact: z.object({
    phone: z.string().max(60).default(""),
    email: z.union([z.string().email("Valid contact email is required"), z.literal("")]).default(""),
    primaryAddress: z.string().max(500).default(""),
    secondaryAddress: z.string().max(500).optional().nullable(),
  }),
  pickupLocations: z.array(z.string().min(1)).default([]),
  transferOptions: z.array(inboundTransferOptionSchema).default([]),
});

export type InboundTypeConfig = z.infer<typeof inboundTypeConfigSchema>;

export const charterPackageSchema = z.object({
  type: z.nativeEnum(PackageType).default(PackageType.CHARTER),
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().min(1, "Short description is required").max(500),
  destinationCountry: z.string().min(1, "Destination country is required"),
  destinationCity: z.string().min(1, "Destination city is required"),
  nights: z.coerce.number().int().positive("Nights must be positive"),
  days: z.coerce.number().int().positive("Days must be positive"),
  mainImage: z.string().url().optional().nullable(),
  gallery: z.array(z.string().url()).min(0),
  basePrice: z.coerce.number().positive().optional().nullable(),
  priceRangeMin: z.coerce.number().positive().optional().nullable(),
  priceRangeMax: z.coerce.number().positive().optional().nullable(),
  currency: currencySchema,
  discount: z.coerce.number().min(0).max(100).optional().nullable(),
  isActive: z.boolean().default(true),
  includedServices: z.array(z.string()).min(0),
  excludedServices: z.array(z.string()).min(0),
  excursionProgram: z.array(z.string()).min(0),
  requiredDocuments: z.array(z.string()).min(0),
  typeConfig: z.unknown().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.type !== PackageType.INBOUND) {
    return;
  }

  const parsed = inboundTypeConfigSchema.safeParse(data.typeConfig);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue.message,
        path: ["typeConfig", ...issue.path],
      });
    }
  }
});

export type CharterPackageInput = z.infer<typeof charterPackageSchema>;

export const charterPackageHotelOptionSchema = z.object({
  hotelId: z.string().min(1, "Hotel is required"),
  starRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  bookingRating: z.coerce.number().min(0).max(10).optional().nullable(),
  distanceFromCenter: z.coerce.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CharterPackageHotelOptionInput = z.infer<typeof charterPackageHotelOptionSchema>;

export const roomTypePricingSchema = z.object({
  roomType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "QUAD"]),
  adultPrice: z.coerce.number().positive("Adult price must be positive"),
  childPrice6to12: z.coerce.number().positive().optional().nullable(),
  childPrice2to6: z.coerce.number().positive().optional().nullable(),
  infantPrice: z.coerce.number().positive().optional().nullable(),
  currency: currencySchema,
});

export type RoomTypePricingInput = z.infer<typeof roomTypePricingSchema>;

export const departureHotelPricingSchema = z.object({
  hotelOptionId: z.string().min(1, "Hotel option is required"),
  currency: currencySchema,
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
  priceModifier: z.coerce.number().optional().nullable(),
  currency: currencySchema,
  isActive: z.boolean().default(true),
  hotelPricings: z.array(departureHotelPricingSchema).optional().default([]),
});

export type CharterDepartureOptionInput = z.infer<typeof charterDepartureOptionSchema>;

export const charterPackageAddonSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional().nullable(),
  price: z.coerce.number().positive("Price must be positive"),
  currency: currencySchema,
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

