/**
 * Factory for getting the appropriate package service based on package type
 */
import { PackageType } from "./types";
import { IPackageService } from "./base/IPackageService";
import { HotelCharterService } from "./types/HotelCharterService";
import { InboundPackageService } from "./types/InboundPackageService";

export class PackageServiceFactory {
  private services: Map<PackageType, IPackageService> = new Map();

  constructor() {
    // Register default services
    this.services.set(PackageType.CHARTER, new HotelCharterService());
    this.services.set(PackageType.INBOUND, new InboundPackageService());
    // REGULAR packages can use HotelCharterService for now (same structure)
    this.services.set(PackageType.REGULAR, new HotelCharterService());
  }

  /**
   * Get the appropriate service for a package type
   */
  getService(type?: PackageType | null): IPackageService {
    if (!type) {
      // Default to Charter for backward compatibility
      return this.services.get(PackageType.CHARTER)!;
    }

    const service = this.services.get(type);
    if (!service) {
      throw new Error(`No service found for package type: ${type}`);
    }

    return service;
  }

  /**
   * Register a new service for a package type
   */
  register(type: PackageType, service: IPackageService): void {
    this.services.set(type, service);
  }
}

// Export singleton instance
export const packageServiceFactory = new PackageServiceFactory();

