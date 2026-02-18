import { z } from "zod";

// Working hours schema - JSON object with days of week
export const workingHoursSchema = z.object({
  monday: z.string().optional(),
  tuesday: z.string().optional(),
  wednesday: z.string().optional(),
  thursday: z.string().optional(),
  friday: z.string().optional(),
  saturday: z.string().optional(),
  sunday: z.string().optional(),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  {
    message: "At least one day must have working hours",
  }
);

// Branch schema for create/update
export const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required").max(200, "Branch name is too long"),
  slug: z.string().min(1, "Slug is required").max(200, "Slug is too long").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  address: z.string().min(1, "Address is required").max(500, "Address is too long"),
  city: z.string().min(1, "City is required").max(100, "City name is too long"),
  country: z.string().min(1, "Country is required").max(100, "Country name is too long"),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  placeId: z.string().nullable().optional(),
  phone: z.string().min(1, "Phone number is required").max(50, "Phone number is too long"),
  phoneAlt: z.string().max(50, "Alternative phone number is too long").nullable().optional(),
  email: z.string().email("Invalid email address").max(200, "Email is too long"),
  emailAlt: z.string().email("Invalid alternative email address").max(200, "Alternative email is too long").nullable().optional(),
  workingHours: workingHoursSchema,
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0),
});

export type BranchInput = z.infer<typeof branchSchema>;
export type WorkingHours = z.infer<typeof workingHoursSchema>;


