"use client";

import { DynamicBookingForm } from "@/components/charter-packages/dynamic-booking-form";

interface CharterBookingFormProps {
  packageData: any;
}

/**
 * Charter Booking Form - Wraps the existing DynamicBookingForm
 * This form includes departure selection, hotel selection, and room type
 */
export function CharterBookingForm({ packageData }: CharterBookingFormProps) {
  return <DynamicBookingForm packageData={packageData} />;
}

