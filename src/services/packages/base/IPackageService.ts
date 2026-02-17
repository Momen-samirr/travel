/**
 * Base interface for all package service implementations
 */
import {
  PackageSearchParams,
  PackageSearchResult,
  TravelPackage,
  PackageSelections,
  PriceCalculation,
  ValidationResult,
} from "../types";

export interface IPackageService {
  /**
   * Search packages based on parameters
   */
  searchPackages(params: PackageSearchParams): Promise<PackageSearchResult>;

  /**
   * Get a single package by ID
   */
  getPackageById(id: string): Promise<TravelPackage | null>;

  /**
   * Get a single package by slug
   */
  getPackageBySlug(slug: string): Promise<TravelPackage | null>;

  /**
   * Calculate price for a package with given selections
   */
  calculatePrice(
    packageId: string,
    selections: PackageSelections
  ): Promise<PriceCalculation>;

  /**
   * Validate booking selections before booking
   */
  validateBooking(
    packageId: string,
    selections: PackageSelections
  ): Promise<ValidationResult>;
}

