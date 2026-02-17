import { prisma } from "@/lib/prisma";
import { HomepageSearchWidget } from "@/components/home/homepage-search-widget";
import { PopularToursSection } from "@/components/home/popular-tours-section";
import { TrustIndicators } from "@/components/home/trust-indicators";
import { VideoHero } from "@/components/home/video-hero";
import { HeroContent } from "@/components/home/hero-content";
import { ServicesOverview } from "@/components/home/services-overview";
import { WhyChooseUs } from "@/components/home/why-choose-us";

export default async function HomePage() {
  let featuredPackages: any[] = [];
  try {
    const packagesData = await prisma.charterTravelPackage.findMany({
      where: {
        isActive: true,
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
    });
    
    featuredPackages = packagesData.map((pkg) => ({
      ...pkg,
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

      {featuredPackages.length > 0 && (
        <PopularToursSection packages={featuredPackages} />
      )}

      <ServicesOverview />

      <WhyChooseUs />
    </div>
  );
}
