/**
 * Service for handling Inbound Packages
 * These packages are for foreigners coming into the country (no international flights)
 */
import { prisma } from "@/lib/prisma";
import { IPackageService } from "../base/IPackageService";
import {
  PackageType,
  PackageSearchParams,
  PackageSearchResult,
  TravelPackage,
  PackageSelections,
  PriceCalculation,
  ValidationResult,
} from "../types";

export class InboundPackageService implements IPackageService {
  async searchPackages(params: PackageSearchParams): Promise<PackageSearchResult> {
    try {
      const where: any = {
        type: PackageType.INBOUND,
        isActive: true,
      };

      if (params.destinationCountry) {
        where.destinationCountry = params.destinationCountry;
      }
      if (params.destinationCity) {
        where.destinationCity = params.destinationCity;
      }
      if (params.minPrice !== undefined) {
        where.priceRangeMin = { gte: params.minPrice };
      }
      if (params.maxPrice !== undefined) {
        where.priceRangeMax = { lte: params.maxPrice };
      }
      if (params.minNights !== undefined) {
        where.nights = { gte: params.minNights };
      }
      if (params.maxNights !== undefined) {
        where.nights = { ...where.nights, lte: params.maxNights };
      }

      const page = params.page || 1;
      const pageSize = params.pageSize || 12;
      const skip = (page - 1) * pageSize;

      const [packagesData, total] = await Promise.all([
        prisma.charterTravelPackage.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
        prisma.charterTravelPackage.count({ where }),
      ]);

      const packages: TravelPackage[] = packagesData.map((pkg) =>
        this.transformToUnifiedPackage(pkg)
      );

      return {
        packages,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error("[InboundPackageService] Error searching packages:", error);
      throw new Error("Failed to search inbound packages");
    }
  }

  async getPackageById(id: string): Promise<TravelPackage | null> {
    try {
      const pkg = await prisma.charterTravelPackage.findUnique({
        where: { id, type: PackageType.INBOUND },
      });

      if (!pkg) {
        return null;
      }

      return this.transformToUnifiedPackage(pkg);
    } catch (error) {
      console.error("[InboundPackageService] Error getting package by ID:", error);
      throw new Error("Failed to get inbound package");
    }
  }

  async getPackageBySlug(slug: string): Promise<TravelPackage | null> {
    try {
      const pkg = await prisma.charterTravelPackage.findUnique({
        where: { slug, type: PackageType.INBOUND },
      });

      if (!pkg) {
        return null;
      }

      return this.transformToUnifiedPackage(pkg);
    } catch (error) {
      console.error("[InboundPackageService] Error getting package by slug:", error);
      throw new Error("Failed to get inbound package");
    }
  }

  async calculatePrice(
    packageId: string,
    selections: PackageSelections
  ): Promise<PriceCalculation> {
    try {
      if (!selections.hotelOptionId || !selections.roomType) {
        throw new Error("Missing required selections for price calculation");
      }

      // For inbound packages, we need to get pricing from a default departure or direct hotel pricing
      // Since inbound doesn't have departures, we'll use a simplified pricing model
      // In a real implementation, you might have a separate pricing structure for inbound packages
      
      const pkg = await prisma.charterTravelPackage.findUnique({
        where: { id: packageId },
        include: {
          hotelOptions: {
            where: { id: selections.hotelOptionId },
            include: {
              hotelPricings: {
                take: 1, // Get first pricing (inbound might have a default pricing)
                include: {
                  roomTypePricings: {
                    where: {
                      roomType: selections.roomType,
                    },
                  },
                },
              },
            },
          },
          addons: {
            where: {
              id: { in: selections.selectedAddonIds || [] },
            },
          },
        },
      });

      if (!pkg) {
        throw new Error("Package not found");
      }

      // Calculate base price
      const basePrice = pkg.basePrice ? Number(pkg.basePrice) : 0;

      // Calculate hotel and room price (NO departure modifier for inbound)
      let hotelPrice = 0;
      let roomPrice = 0;
      if (pkg.hotelOptions[0]?.hotelPricings[0]?.roomTypePricings[0]) {
        const roomPricing = pkg.hotelOptions[0].hotelPricings[0].roomTypePricings[0];
        roomPrice = Number(roomPricing.price);
        
        const adults = selections.numberOfAdults || 1;
        const children = selections.numberOfChildren || 0;
        const infants = selections.numberOfInfants || 0;
        
        hotelPrice =
          roomPrice * adults +
          (roomPricing.childPrice ? Number(roomPricing.childPrice) * children : 0) +
          (roomPricing.infantPrice ? Number(roomPricing.infantPrice) * infants : 0);
      }

      // Calculate addons price
      const totalTravelers =
        (selections.numberOfAdults || 0) +
        (selections.numberOfChildren || 0) +
        (selections.numberOfInfants || 0);
      const addonsPrice =
        pkg.addons.reduce(
          (sum, addon) => sum + Number(addon.price),
          0
        ) * totalTravelers;

      // Inbound packages may have transfer costs (from typeConfig)
      let transferCost = 0;
      if (pkg.typeConfig && typeof pkg.typeConfig === 'object') {
        const config = pkg.typeConfig as any;
        if (config.transferOptions && Array.isArray(selections.transferOptions)) {
          // Calculate transfer costs based on selected options
          transferCost = selections.transferOptions.reduce((sum, optionId) => {
            const option = config.transferOptions.find((opt: any) => opt.id === optionId);
            return sum + (option?.price || 0);
          }, 0);
        }
      }

      const totalPrice = basePrice + hotelPrice + addonsPrice + transferCost;

      return {
        basePrice,
        hotelPrice,
        roomPrice,
        addonsPrice: addonsPrice + transferCost,
        totalPrice,
        currency: pkg.currency,
        breakdown: [
          { label: "Base Price", amount: basePrice },
          { label: "Hotel & Room", amount: hotelPrice },
          { label: "Add-ons & Transfers", amount: addonsPrice + transferCost },
          { label: "Total", amount: totalPrice },
        ],
      };
    } catch (error) {
      console.error("[InboundPackageService] Error calculating price:", error);
      throw new Error("Failed to calculate package price");
    }
  }

  async validateBooking(
    packageId: string,
    selections: PackageSelections
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Inbound packages do NOT require departure option
    if (selections.departureOptionId) {
      warnings.push("Departure option is not applicable for inbound packages");
    }

    // Hotel selection required
    if (!selections.hotelOptionId) {
      errors.push("Hotel selection is required");
    }

    // Room type required
    if (!selections.roomType) {
      errors.push("Room type is required");
    }

    // Travelers required
    if (!selections.numberOfAdults || selections.numberOfAdults < 1) {
      errors.push("At least one adult traveler is required");
    }

    // Pickup location recommended for inbound
    if (!selections.pickupLocation) {
      warnings.push("Pickup location is recommended for inbound packages");
    }

    // Check if package exists and is active
    const pkg = await prisma.charterTravelPackage.findUnique({
      where: { id: packageId, type: PackageType.INBOUND },
    });

    if (!pkg) {
      errors.push("Package not found");
    } else if (!pkg.isActive) {
      errors.push("Package is not available");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private transformToUnifiedPackage(pkg: any): TravelPackage {
    return {
      id: pkg.id,
      type: pkg.type as PackageType,
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description,
      shortDescription: pkg.shortDescription,
      destinationCountry: pkg.destinationCountry,
      destinationCity: pkg.destinationCity,
      nights: pkg.nights,
      days: pkg.days,
      mainImage: pkg.mainImage,
      gallery: pkg.gallery,
      basePrice: pkg.basePrice ? Number(pkg.basePrice) : null,
      priceRangeMin: pkg.priceRangeMin ? Number(pkg.priceRangeMin) : null,
      priceRangeMax: pkg.priceRangeMax ? Number(pkg.priceRangeMax) : null,
      currency: pkg.currency,
      discount: pkg.discount ? Number(pkg.discount) : null,
      typeConfig: pkg.typeConfig,
      isActive: pkg.isActive,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    };
  }
}

