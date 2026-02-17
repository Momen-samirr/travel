import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get all active packages to calculate filter ranges
    const packages = await prisma.charterTravelPackage.findMany({
      where: { isActive: true },
      select: {
        destinationCountry: true,
        destinationCity: true,
        priceRangeMin: true,
        priceRangeMax: true,
        basePrice: true,
        nights: true,
        days: true,
        type: true,
        hotelOptions: {
          where: { isActive: true },
          select: {
            starRating: true,
          },
        },
      },
    });

    // Extract unique countries
    const countries = Array.from(
      new Set(packages.map((pkg) => pkg.destinationCountry))
    ).sort();

    // Group cities by country
    const citiesByCountry: Record<string, string[]> = {};
    packages.forEach((pkg) => {
      if (!citiesByCountry[pkg.destinationCountry]) {
        citiesByCountry[pkg.destinationCountry] = [];
      }
      if (
        !citiesByCountry[pkg.destinationCountry].includes(pkg.destinationCity)
      ) {
        citiesByCountry[pkg.destinationCountry].push(pkg.destinationCity);
      }
    });

    // Sort cities within each country
    Object.keys(citiesByCountry).forEach((country) => {
      citiesByCountry[country].sort();
    });

    // Calculate price range
    const prices = packages
      .map((pkg) => [
        pkg.priceRangeMin ? Number(pkg.priceRangeMin) : null,
        pkg.priceRangeMax ? Number(pkg.priceRangeMax) : null,
        pkg.basePrice ? Number(pkg.basePrice) : null,
      ])
      .flat()
      .filter((price): price is number => price !== null);

    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 100000,
      currency: "EGP",
    };

    // Calculate duration range
    const nights = packages.map((pkg) => pkg.nights);
    const days = packages.map((pkg) => pkg.days);

    const durationRange = {
      minNights: nights.length > 0 ? Math.min(...nights) : 3,
      maxNights: nights.length > 0 ? Math.max(...nights) : 21,
      minDays: days.length > 0 ? Math.min(...days) : 4,
      maxDays: days.length > 0 ? Math.max(...days) : 22,
    };

    // Get unique hotel ratings
    const hotelRatings = Array.from(
      new Set(
        packages
          .flatMap((pkg) =>
            pkg.hotelOptions
              .map((opt) => opt.starRating)
              .filter((rating): rating is number => rating !== null)
          )
      )
    ).sort();

    // Get unique package types
    const packageTypes = Array.from(
      new Set(packages.map((pkg) => pkg.type))
    );

    return NextResponse.json({
      countries,
      cities: citiesByCountry,
      priceRange,
      durationRange,
      hotelRatings,
      packageTypes,
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    );
  }
}

