import { prisma } from "@/lib/prisma";
import { HomepageSearchWidget } from "@/components/home/homepage-search-widget";
import { FeaturedPackagesSection } from "@/components/home/featured-packages-section";
import { TrustIndicators } from "@/components/home/trust-indicators";
import { VideoHero } from "@/components/home/video-hero";
import { HeroContent } from "@/components/home/hero-content";
import { ServicesOverview } from "@/components/home/services-overview";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { PackageType } from "@/services/packages/types";

export default async function HomePage() {
  let featuredCharterPackages: any[] = [];
  let featuredInboundPackages: any[] = [];
  let featuredRegularPackages: any[] = [];
  
  try {
    const [charterData, inboundData, regularData] = await Promise.all([
      prisma.charterTravelPackage.findMany({
        where: {
          isActive: true,
          type: PackageType.CHARTER,
        },
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              departureOptions: true,
              hotelOptions: true,
            },
          },
        },
      }),
      prisma.charterTravelPackage.findMany({
        where: {
          isActive: true,
          type: PackageType.INBOUND,
        },
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              departureOptions: true,
              hotelOptions: true,
            },
          },
        },
      }),
      prisma.charterTravelPackage.findMany({
        where: {
          isActive: true,
          type: PackageType.REGULAR,
        },
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              departureOptions: true,
              hotelOptions: true,
            },
          },
        },
      }),
    ]);
    
    featuredCharterPackages = charterData.map((pkg) => ({
      ...pkg,
      type: PackageType.CHARTER,
      basePrice: pkg.basePrice ? Number(pkg.basePrice) : null,
      priceRangeMin: pkg.priceRangeMin ? Number(pkg.priceRangeMin) : null,
      priceRangeMax: pkg.priceRangeMax ? Number(pkg.priceRangeMax) : null,
      discount: pkg.discount ? Number(pkg.discount) : null,
    }));

    featuredInboundPackages = inboundData.map((pkg) => ({
      ...pkg,
      type: PackageType.INBOUND,
      basePrice: pkg.basePrice ? Number(pkg.basePrice) : null,
      priceRangeMin: pkg.priceRangeMin ? Number(pkg.priceRangeMin) : null,
      priceRangeMax: pkg.priceRangeMax ? Number(pkg.priceRangeMax) : null,
      discount: pkg.discount ? Number(pkg.discount) : null,
    }));

    featuredRegularPackages = regularData.map((pkg) => ({
      ...pkg,
      type: PackageType.REGULAR,
      basePrice: pkg.basePrice ? Number(pkg.basePrice) : null,
      priceRangeMin: pkg.priceRangeMin ? Number(pkg.priceRangeMin) : null,
      priceRangeMax: pkg.priceRangeMax ? Number(pkg.priceRangeMax) : null,
      discount: pkg.discount ? Number(pkg.discount) : null,
    }));
  } catch (error) {
    console.error("Error fetching featured packages:", error);
  }

  return (
    <div className="flex flex-col">
      <VideoHero overlayOpacity={0.65}>
        <HeroContent />
      </VideoHero>

      <TrustIndicators />

      {featuredCharterPackages.length > 0 && (
        <FeaturedPackagesSection 
          packages={featuredCharterPackages} 
          title="Featured Charter Packages"
          description="Complete travel bundles with flights, hotels, and more"
          viewAllLink="/charter-packages"
        />
      )}

      {featuredInboundPackages.length > 0 && (
        <FeaturedPackagesSection 
          packages={featuredInboundPackages} 
          title="Featured Inbound Packages"
          description="Local tourism packages without international flights"
          viewAllLink="/inbound-packages"
        />
      )}

      {featuredRegularPackages.length > 0 && (
        <FeaturedPackagesSection 
          packages={featuredRegularPackages} 
          title="Featured Regular Packages"
          description="Explore our regular travel packages"
          viewAllLink="/regular-packages"
        />
      )}

      <ServicesOverview />

      <WhyChooseUs />
    </div>
  );
}
