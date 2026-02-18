/**
 * Unified package service that uses the factory to route to appropriate service
 */
import { packageServiceFactory } from "../PackageServiceFactory";
import {
  PackageType,
  PackageSearchParams,
  PackageSearchResult,
  TravelPackage,
  PackageSelections,
  PriceCalculation,
  ValidationResult,
} from "../types";

export class UnifiedPackageService {
  /**
   * Search packages across all types or filter by type
   */
  async searchPackages(params: PackageSearchParams): Promise<PackageSearchResult> {
    if (params.type) {
      // Use specific service for the type
      const service = packageServiceFactory.getService(params.type);
      return service.searchPackages(params);
    }

    // Search across all types
    const allTypes = [
      PackageType.CHARTER,
      PackageType.INBOUND,
      PackageType.REGULAR,
    ];

    const results = await Promise.all(
      allTypes.map((type) => {
        const service = packageServiceFactory.getService(type);
        return service.searchPackages({ ...params, type });
      })
    );

    // Combine results
    const allPackages: TravelPackage[] = [];
    let total = 0;

    results.forEach((result) => {
      allPackages.push(...result.packages);
      total += result.total;
    });

    // Sort by creation date (newest first)
    allPackages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 12;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPackages = allPackages.slice(startIndex, endIndex);

    return {
      packages: paginatedPackages,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get package by ID (automatically determines type)
   */
  async getPackageById(id: string): Promise<TravelPackage | null> {
    // Try all types until found
    const types = [
      PackageType.CHARTER,
      PackageType.INBOUND,
      PackageType.REGULAR,
    ];

    for (const type of types) {
      const service = packageServiceFactory.getService(type);
      const pkg = await service.getPackageById(id);
      if (pkg) {
        return pkg;
      }
    }

    return null;
  }

  /**
   * Get package by slug (automatically determines type)
   */
  async getPackageBySlug(slug: string): Promise<TravelPackage | null> {
    // Try all types until found
    const types = [
      PackageType.CHARTER,
      PackageType.INBOUND,
      PackageType.REGULAR,
    ];

    for (const type of types) {
      const service = packageServiceFactory.getService(type);
      const pkg = await service.getPackageBySlug(slug);
      if (pkg) {
        return pkg;
      }
    }

    return null;
  }

  /**
   * Calculate price (requires package type to be known)
   */
  async calculatePrice(
    packageId: string,
    selections: PackageSelections,
    type?: PackageType
  ): Promise<PriceCalculation> {
    // If type not provided, try to determine from package
    if (!type) {
      const pkg = await this.getPackageById(packageId);
      if (!pkg) {
        throw new Error("Package not found");
      }
      type = pkg.type;
    }

    const service = packageServiceFactory.getService(type);
    return service.calculatePrice(packageId, selections);
  }

  /**
   * Validate booking (requires package type to be known)
   */
  async validateBooking(
    packageId: string,
    selections: PackageSelections,
    type?: PackageType
  ): Promise<ValidationResult> {
    // If type not provided, try to determine from package
    if (!type) {
      const pkg = await this.getPackageById(packageId);
      if (!pkg) {
        return {
          isValid: false,
          errors: ["Package not found"],
          warnings: [],
        };
      }
      type = pkg.type;
    }

    const service = packageServiceFactory.getService(type);
    return service.validateBooking(packageId, selections);
  }
}

// Export singleton instance
export const unifiedPackageService = new UnifiedPackageService();

