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
      price: PriceValue;
      childPrice: PriceValue;
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
  numberOfChildren: number;
  numberOfInfants: number;
  selectedAddonIds: string[];
}

interface PriceBreakdown {
  basePrice: number;
  departureModifier: number;
  hotelRoomCost: number;
  childrenCost: number;
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
    let childrenCost = 0;
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

    // Calculate hotel room cost from RoomTypePricing
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
          // Calculate number of rooms based on room type
          let numberOfRooms = 1;
          if (selections.roomType === "SINGLE") {
            numberOfRooms = selections.numberOfAdults;
          } else if (selections.roomType === "DOUBLE") {
            numberOfRooms = Math.ceil(selections.numberOfAdults / 2);
          } else if (selections.roomType === "TRIPLE") {
            numberOfRooms = Math.ceil(selections.numberOfAdults / 3);
          } else if (selections.roomType === "QUAD") {
            numberOfRooms = Math.ceil(selections.numberOfAdults / 4);
          }

          hotelRoomCost = toNumber(roomTypePricing.price) * numberOfRooms;

          // Calculate children cost from room type pricing
          if (selections.numberOfChildren > 0 && roomTypePricing.childPrice) {
            childrenCost = toNumber(roomTypePricing.childPrice) * selections.numberOfChildren;
          }

          // Calculate infants cost from room type pricing
          if (selections.numberOfInfants > 0 && roomTypePricing.infantPrice) {
            infantsCost = toNumber(roomTypePricing.infantPrice) * selections.numberOfInfants;
          }
        } else {
          // If room type pricing not found, use base price as fallback
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

    // Calculate add-ons cost
    if (selections.selectedAddonIds.length > 0) {
      selections.selectedAddonIds.forEach((addonId) => {
        const addon = packageData.addons.find((a) => a.id === addonId);
        if (addon) {
          addonsCost += toNumber(addon.price);
        }
      });
    }

    // Calculate subtotal per person
    const subtotalPerPerson =
      basePrice +
      departureModifier +
      (hotelRoomCost / Math.max(selections.numberOfAdults, 1)) +
      (childrenCost / Math.max(selections.numberOfAdults, 1)) +
      (infantsCost / Math.max(selections.numberOfAdults, 1)) +
      (addonsCost / Math.max(selections.numberOfAdults, 1));

    // Apply discount
    let discount = 0;
    if (packageData.discount) {
      discount = (subtotalPerPerson * toNumber(packageData.discount)) / 100;
    }

    const totalPerPerson = subtotalPerPerson - discount;
    const totalTravelers =
      selections.numberOfAdults +
      selections.numberOfChildren +
      selections.numberOfInfants;
    const total = totalPerPerson * totalTravelers;

    return {
      basePrice,
      departureModifier,
      hotelRoomCost,
      childrenCost,
      infantsCost,
      addonsCost,
      subtotal: subtotalPerPerson * totalTravelers,
      discount: discount * totalTravelers,
      total,
      totalPerPerson,
      currency,
    };
  }, [packageData, selections]);
}

