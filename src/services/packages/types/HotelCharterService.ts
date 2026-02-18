/**
 * Service for handling Hotel Charter Packages
 * These packages include international flights
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
import { Decimal } from "@prisma/client/runtime/library";

export class HotelCharterService implements IPackageService {
  async searchPackages(params: PackageSearchParams): Promise<PackageSearchResult> {
    try {
      const where: any = {
        type: params.type || PackageType.CHARTER,
        isActive: true,
      };

      if (params.destinationCountry) {
        where.destinationCountry = params.destinationCountry;
      }
      if (params.destinationCity) {
        where.destinationCity = { contains: params.destinationCity, mode: "insensitive" };
      }
      if (params.minPrice !== undefined || params.maxPrice !== undefined) {
        const priceConditions: any[] = [];
        if (params.minPrice !== undefined) {
          priceConditions.push({
            OR: [
              { priceRangeMin: { gte: new Decimal(params.minPrice) } },
              { basePrice: { gte: new Decimal(params.minPrice) } },
            ],
          });
        }
        if (params.maxPrice !== undefined) {
          priceConditions.push({
            OR: [
              { priceRangeMax: { lte: new Decimal(params.maxPrice) } },
              { basePrice: { lte: new Decimal(params.maxPrice) } },
            ],
          });
        }
        if (priceConditions.length > 0) {
          where.AND = [...(where.AND || []), ...priceConditions];
        }
      }
      if (params.minNights !== undefined) {
        where.nights = { gte: params.minNights };
      }
      if (params.maxNights !== undefined) {
        where.nights = { ...(where.nights || {}), lte: params.maxNights };
      }
      if (params.minDays !== undefined) {
        where.days = { gte: params.minDays };
      }
      if (params.maxDays !== undefined) {
        where.days = { ...(where.days || {}), lte: params.maxDays };
      }
      if (params.departureDateFrom || params.departureDateTo) {
        where.departureOptions = {
          some: {
            isActive: true,
            departureDate: {
              gte: params.departureDateFrom ? new Date(params.departureDateFrom) : undefined,
              lte: params.departureDateTo ? new Date(params.departureDateTo) : undefined,
            },
          },
        };
      }
      if (params.hotelRating && params.hotelRating.length > 0) {
        where.hotelOptions = {
          some: {
            isActive: true,
            starRating: { in: params.hotelRating },
          },
        };
      }

      const page = params.page || 1;
      const pageSize = params.pageSize || 12;
      const skip = (page - 1) * pageSize;

      // Note: Sorting would need to be passed as a parameter to the service
      // For now, we'll use default sorting
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
      console.error("[HotelCharterService] Error searching packages:", error);
      throw new Error("Failed to search hotel charter packages");
    }
  }

  async getPackageById(id: string): Promise<TravelPackage | null> {
    try {
      const pkg = await prisma.charterTravelPackage.findUnique({
        where: { id, type: PackageType.CHARTER },
      });

      if (!pkg) {
        return null;
      }

      return this.transformToUnifiedPackage(pkg);
    } catch (error) {
      console.error("[HotelCharterService] Error getting package by ID:", error);
      throw new Error("Failed to get hotel charter package");
    }
  }

  async getPackageBySlug(slug: string): Promise<TravelPackage | null> {
    try {
      const pkg = await prisma.charterTravelPackage.findUnique({
        where: { slug, type: PackageType.CHARTER },
      });

      if (!pkg) {
        return null;
      }

      return this.transformToUnifiedPackage(pkg);
    } catch (error) {
      console.error("[HotelCharterService] Error getting package by slug:", error);
      throw new Error("Failed to get hotel charter package");
    }
  }

  async calculatePrice(
    packageId: string,
    selections: PackageSelections
  ): Promise<PriceCalculation> {
    try {
      if (!selections.departureOptionId || !selections.hotelOptionId || !selections.roomType) {
        throw new Error("Missing required selections for price calculation");
      }

      // Fetch package with pricing data
      const pkg = await prisma.charterTravelPackage.findUnique({
        where: { id: packageId },
        include: {
          departureOptions: {
            where: { id: selections.departureOptionId },
          },
          hotelOptions: {
            where: { id: selections.hotelOptionId },
            include: {
              hotelPricings: {
                where: {
                  departureOptionId: selections.departureOptionId,
                },
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

      // Calculate departure price modifier
      let departureModifier = 0;
      if (pkg.departureOptions[0]) {
        departureModifier = pkg.departureOptions[0].priceModifier
          ? Number(pkg.departureOptions[0].priceModifier)
          : 0;
      }

      // Calculate hotel and room price
      let hotelPrice = 0;
      let roomPrice = 0;
      if (pkg.hotelOptions[0]?.hotelPricings[0]?.roomTypePricings[0]) {
        const roomPricing = pkg.hotelOptions[0].hotelPricings[0].roomTypePricings[0];
        roomPrice = Number(roomPricing.adultPrice);
        
        const adults = selections.numberOfAdults || 1;
        const children6to12 = selections.numberOfChildren6to12 || 0;
        const children2to6 = selections.numberOfChildren2to6 || 0;
        const infants = selections.numberOfInfants || 0;
        
        hotelPrice =
          roomPrice * adults +
          (roomPricing.childPrice6to12 ? Number(roomPricing.childPrice6to12) * children6to12 : 0) +
          (roomPricing.childPrice2to6 ? Number(roomPricing.childPrice2to6) * children2to6 : 0) +
          (roomPricing.infantPrice ? Number(roomPricing.infantPrice) * infants : 0);
      }

      // Calculate addons price
      const totalTravelers =
        (selections.numberOfAdults || 0) +
        (selections.numberOfChildren6to12 || 0) +
        (selections.numberOfChildren2to6 || 0) +
        (selections.numberOfInfants || 0);
      const addonsPrice =
        pkg.addons.reduce(
          (sum, addon) => sum + Number(addon.price),
          0
        ) * totalTravelers;

      const totalPrice = basePrice + departureModifier + hotelPrice + addonsPrice;

      return {
        basePrice,
        hotelPrice,
        roomPrice,
        addonsPrice,
        totalPrice,
        currency: pkg.currency,
        breakdown: [
          { label: "Base Price", amount: basePrice },
          { label: "Departure Modifier", amount: departureModifier },
          { label: "Hotel & Room", amount: hotelPrice },
          { label: "Add-ons", amount: addonsPrice },
          { label: "Total", amount: totalPrice },
        ],
      };
    } catch (error) {
      console.error("[HotelCharterService] Error calculating price:", error);
      throw new Error("Failed to calculate package price");
    }
  }

  async validateBooking(
    packageId: string,
    selections: PackageSelections
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Charter packages require departure option
    if (!selections.departureOptionId) {
      errors.push("Departure option is required for charter packages");
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

    // Check if package exists and is active
    const pkg = await prisma.charterTravelPackage.findUnique({
      where: { id: packageId, type: PackageType.CHARTER },
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

