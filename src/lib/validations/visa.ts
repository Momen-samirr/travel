import { z } from "zod";

export const visaSchema = z.object({
  country: z.string().min(1, "Country is required"),
  type: z.string().min(1, "Visa type is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be positive"),
  currency: z.string().default("EGP"),
  processingTime: z.string().min(1, "Processing time is required"),
  requiredDocuments: z.array(z.string()).min(1, "At least one required document is needed"),
  isActive: z.boolean().default(true),
});

export type VisaInput = z.infer<typeof visaSchema>;

