import { z } from "zod";
import { PackageType } from "@/services/packages/types";

export const charterPackageFiltersSchema = z.object({
  destinationCountry: z.string().optional(),
  destinationCity: z.string().optional(),
  minPrice: z.string().transform(Number).optional().or(z.number().optional()),
  maxPrice: z.string().transform(Number).optional().or(z.number().optional()),
  minNights: z.string().transform(Number).optional().or(z.number().optional()),
  maxNights: z.string().transform(Number).optional().or(z.number().optional()),
  minDays: z.string().transform(Number).optional().or(z.number().optional()),
  maxDays: z.string().transform(Number).optional().or(z.number().optional()),
  departureDateFrom: z.string().optional(),
  departureDateTo: z.string().optional(),
  hotelRating: z.string().optional().transform((val) => {
    if (!val) return [];
    return val.split(",").map(Number).filter((n) => !isNaN(n));
  }),
  packageType: z.nativeEnum(PackageType).optional(),
  sortBy: z.enum(["price_asc", "price_desc", "duration_asc", "duration_desc", "newest", "popular"]).optional().default("newest"),
  page: z.preprocess(
    (val) => {
      if (typeof val === "string") return parseInt(val, 10);
      if (typeof val === "number") return val;
      return 1;
    },
    z.number().default(1)
  ),
  limit: z.preprocess(
    (val) => {
      if (typeof val === "string") return parseInt(val, 10);
      if (typeof val === "number") return val;
      return 12;
    },
    z.number().default(12)
  ),
});

export type CharterPackageFilters = z.infer<typeof charterPackageFiltersSchema>;

