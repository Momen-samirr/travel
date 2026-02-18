import { useMemo } from "react";
import { Decimal } from "@prisma/client/runtime/library";

type PriceValue = Decimal | number | null;

interface PackageData {
  basePrice: PriceValue;
  priceRangeMin: PriceValue;
  priceRangeMax: PriceValue;
  currency: string;
  discount: PriceValue;
  hotelOptions: Array<{
    id: string;
    roomTypePricings?: Array<{
      roomType: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD";
      adultPrice: PriceValue;
      childPrice6to12: PriceValue;
      childPrice2to6: PriceValue;
      infantPrice: PriceValue;
      currency: string;
    }>;
    currency?: string;
  }>;
  departureOptions: Array<{
    id: string;
    priceModifier: PriceValue;
    currency: string;
  }>;
  addons: Array<{
    id: string;
    price: PriceValue;
    currency: string;
  }>;
}

interface BookingSelections {
  hotelOptionId: string | null;
  departureOptionId: string | null;
  roomType: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD" | null;
  numberOfAdults: number;
  numberOfChildren6to12: number;
  numberOfChildren2to6: number;
  numberOfInfants: number;
  selectedAddonIds: string[];
}

interface PriceBreakdown {
  basePrice: number;
  departureModifier: number;
  hotelRoomCost: number;
  children6to12Cost: number;
  children2to6Cost: number;
  infantsCost: number;
  addonsCost: number;
  subtotal: number;
  discount: number;
  total: number;
  totalPerPerson: number;
  currency: string;
}

// Helper function to convert Decimal or number to number
const toNumber = (value: PriceValue): number => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value && typeof (value as any).toNumber === 'function') {
    return (value as any).toNumber();
  }
  return Number(value);
};

export function useCharterPackagePricing(
  packageData: PackageData,
  selections: BookingSelections
): PriceBreakdown {
  return useMemo(() => {
    const currency = packageData.currency;
    let basePrice = 0;
    let departureModifier = 0;
    let hotelRoomCost = 0;
    let children6to12Cost = 0;
    let children2to6Cost = 0;
    let infantsCost = 0;
    let addonsCost = 0;

    // Calculate base price
    if (packageData.basePrice) {
      basePrice = toNumber(packageData.basePrice);
    } else if (packageData.priceRangeMin && packageData.priceRangeMax) {
      basePrice =
        (toNumber(packageData.priceRangeMin) + toNumber(packageData.priceRangeMax)) /
        2;
    }

    // Calculate departure modifier
    if (selections.departureOptionId) {
      const departureOption = packageData.departureOptions.find(
        (opt) => opt.id === selections.departureOptionId
      );
      if (departureOption?.priceModifier) {
        departureModifier = toNumber(departureOption.priceModifier);
      }
    }

    // Calculate adult cost from RoomTypePricing (per-adult pricing)
    if (
      selections.hotelOptionId &&
      selections.roomType &&
      selections.numberOfAdults > 0
    ) {
      const hotelOption = packageData.hotelOptions.find(
        (opt) => opt.id === selections.hotelOptionId
      );
      if (hotelOption && hotelOption.roomTypePricings) {
        const roomTypePricing = hotelOption.roomTypePricings.find(
          (rtp) => rtp.roomType === selections.roomType
        );

        if (roomTypePricing) {
          // Validate pricing data exists
          const adultPrice = toNumber(roomTypePricing.adultPrice);
          if (adultPrice <= 0) {
            console.warn(`Invalid adult price for room type ${selections.roomType}: ${adultPrice}`);
          }

          // Adult cost: price per adult × number of adults
          hotelRoomCost = adultPrice * selections.numberOfAdults;

          // Calculate children 6-12 cost from room type pricing (per child)
          if (selections.numberOfChildren6to12 > 0) {
            if (roomTypePricing.childPrice6to12) {
              const childPrice = toNumber(roomTypePricing.childPrice6to12);
              if (childPrice > 0) {
                children6to12Cost = childPrice * selections.numberOfChildren6to12;
              } else {
                console.warn(`Invalid child price (6-12) for room type ${selections.roomType}: ${childPrice}`);
              }
            } else {
              console.warn(`Child price (6-12) not configured for room type ${selections.roomType}`);
            }
          }

          // Calculate children 2-6 cost from room type pricing (per child)
          if (selections.numberOfChildren2to6 > 0) {
            if (roomTypePricing.childPrice2to6) {
              const childPrice = toNumber(roomTypePricing.childPrice2to6);
              if (childPrice > 0) {
                children2to6Cost = childPrice * selections.numberOfChildren2to6;
              } else {
                console.warn(`Invalid child price (2-6) for room type ${selections.roomType}: ${childPrice}`);
              }
            } else {
              console.warn(`Child price (2-6) not configured for room type ${selections.roomType}`);
            }
          }

          // Calculate infants cost from room type pricing (per infant)
          if (selections.numberOfInfants > 0) {
            if (roomTypePricing.infantPrice) {
              const infantPrice = toNumber(roomTypePricing.infantPrice);
              if (infantPrice > 0) {
                infantsCost = infantPrice * selections.numberOfInfants;
              } else {
                console.warn(`Invalid infant price for room type ${selections.roomType}: ${infantPrice}`);
              }
            } else {
              console.warn(`Infant price not configured for room type ${selections.roomType}`);
            }
          }
        } else {
          // If room type pricing not found, use base price as fallback
          console.warn(`Room type pricing not found for ${selections.roomType}, using base price fallback`);
          hotelRoomCost = basePrice * selections.numberOfAdults;
        }
      } else {
        // If no pricing data, use base price as fallback
        hotelRoomCost = basePrice * selections.numberOfAdults;
      }
    } else if (selections.numberOfAdults > 0) {
      // If no hotel selected, use base price
      hotelRoomCost = basePrice * selections.numberOfAdults;
    }

    // Calculate add-ons cost (multiplied by number of travelers)
    const totalTravelers =
      selections.numberOfAdults +
      selections.numberOfChildren6to12 +
      selections.numberOfChildren2to6 +
      selections.numberOfInfants;
    
    if (selections.selectedAddonIds.length > 0) {
      selections.selectedAddonIds.forEach((addonId) => {
        const addon = packageData.addons.find((a) => a.id === addonId);
        if (addon) {
          // Add-on price is per person, so multiply by total travelers
          addonsCost += toNumber(addon.price) * totalTravelers;
        }
      });
    }

    // Calculate total directly: sum of all costs
    // totalTravelers already calculated above for add-ons
    
    // Subtotal = adult cost + children costs + infants cost + addons cost
    // Note: basePrice and departureModifier are not included in the new pricing architecture
    // as pricing is defined per departure option and room type
    const subtotal = hotelRoomCost + children6to12Cost + children2to6Cost + infantsCost + addonsCost;

    // Apply discount to total if configured
    let discount = 0;
    if (packageData.discount && subtotal > 0) {
      discount = (subtotal * toNumber(packageData.discount)) / 100;
    }

    const total = subtotal - discount;
    
    // Calculate per-person price for display purposes only
    const totalPerPerson = totalTravelers > 0 ? total / totalTravelers : 0;

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("Pricing Calculation:", {
        adults: selections.numberOfAdults,
        children6to12: selections.numberOfChildren6to12,
        children2to6: selections.numberOfChildren2to6,
        infants: selections.numberOfInfants,
        adultCost: hotelRoomCost,
        children6to12Cost,
        children2to6Cost,
        infantsCost,
        addonsCost,
        subtotal,
        discount,
        total,
        totalPerPerson,
        currency,
      });
    }

    return {
      basePrice,
      departureModifier,
      hotelRoomCost,
      children6to12Cost,
      children2to6Cost,
      infantsCost,
      addonsCost,
      subtotal,
      discount,
      total,
      totalPerPerson,
      currency,
    };
  }, [packageData, selections]);
}

