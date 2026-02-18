"use client";

import { PackageType, TravelPackage } from "@/services/packages/types";
import { CharterBookingForm } from "./CharterBookingForm";
import { InboundBookingForm } from "./InboundBookingForm";

interface BookingFormFactoryProps {
  package: TravelPackage;
  packageData: any; // Full package data with relations
}

export function BookingFormFactory({
  package: pkg,
  packageData,
}: BookingFormFactoryProps) {
  switch (pkg.type) {
    case PackageType.CHARTER:
      return <CharterBookingForm packageData={packageData} />;
    case PackageType.INBOUND:
      return <InboundBookingForm packageData={packageData} />;
    case PackageType.REGULAR:
      // Regular packages use charter form for now
      return <CharterBookingForm packageData={packageData} />;
    default:
      // Fallback to charter form for backward compatibility
      return <CharterBookingForm packageData={packageData} />;
  }
}

