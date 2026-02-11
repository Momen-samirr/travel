import { z } from "zod";

export const passengerTitleSchema = z.enum(["Mr", "Mrs", "Miss", "Ms"]);

export const passengerTypeSchema = z.enum(["adult", "child", "infant"]);

export const genderSchema = z.enum(["male", "female", "other"]).optional();

export const passengerSchema = z.object({
  title: passengerTitleSchema,
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name must be less than 50 characters"),
  dateOfBirth: z.string().refine((date) => {
    const dob = new Date(date);
    const today = new Date();
    return dob <= today;
  }, "Date of birth cannot be in the future"),
  gender: genderSchema,
  passportNumber: z.string().optional(),
  passportExpiryDate: z.string().optional().refine((date) => {
    if (!date) return true; // Optional field
    const expiry = new Date(date);
    const today = new Date();
    return expiry > today;
  }, "Passport must not be expired"),
  nationality: z.string().optional(),
  passengerType: passengerTypeSchema,
  specialRequests: z.string().optional(),
});

export const contactInformationSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  countryCode: z.string().optional(),
});

export type PassengerInput = z.infer<typeof passengerSchema>;
export type ContactInformationInput = z.infer<typeof contactInformationSchema>;

