import { z } from "zod";
import { passengerSchema, contactInformationSchema } from "./passenger";

// Legacy guest details schema for backward compatibility
const legacyGuestDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  nationality: z.string().optional(),
  passportNumber: z.string().optional(),
  specialRequests: z.string().optional(),
});

// Flight-specific guest details structure
const flightGuestDetailsSchema = z.object({
  passengers: z.array(passengerSchema).min(1, "At least one passenger is required"),
  contact: contactInformationSchema,
});

export const bookingSchema = z.object({
  bookingType: z.enum(["TOUR", "FLIGHT", "HOTEL", "VISA"]),
  tourId: z.string().optional().nullable(),
  flightId: z.string().optional().nullable(),
  hotelId: z.string().optional().nullable(),
  visaId: z.string().optional().nullable(),
  travelDate: z.union([z.date(), z.string()]).optional().nullable().transform((val) => {
    if (!val) return null;
    if (typeof val === "string") return new Date(val);
    return val;
  }),
  guestDetails: z.union([legacyGuestDetailsSchema, flightGuestDetailsSchema]),
  numberOfGuests: z.number().int().positive("Number of guests must be at least 1"),
  // Flight-specific fields
  flightOfferId: z.string().optional(),
  flightOfferData: z.any().optional(), // Amadeus flight offer data
  addOns: z.any().optional(), // Add-ons like seats, baggage, etc.
  // Optional fields that can be provided for flight bookings
  totalAmount: z.number().positive().optional(), // Total amount (for flight bookings)
  currency: z.string().optional(), // Currency (for flight bookings)
});

export type BookingInput = z.infer<typeof bookingSchema>;

