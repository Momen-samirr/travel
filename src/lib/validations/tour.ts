import { z } from "zod";

export const tourSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().min(1, "Short description is required").max(500),
  price: z.number().positive("Price must be positive"),
  discountPrice: z.number().positive().optional().nullable(),
  currency: z.string(),
  duration: z.number().int().positive("Duration must be positive"),
  maxGroupSize: z.number().int().positive().optional().nullable(),
  minGroupSize: z.number().int().positive(),
  destination: z.string().min(1, "Destination is required"),
  category: z.string().min(1, "Category is required"),
  difficulty: z.string().optional().nullable(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  availableSpots: z.number().int().positive().optional().nullable(),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  itinerary: z.array(z.object({
    day: z.number(),
    title: z.string(),
    description: z.string(),
  })).optional().nullable(),
});

export type TourInput = z.infer<typeof tourSchema>;

