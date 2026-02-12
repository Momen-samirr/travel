import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { HomepageSearchWidget } from "@/components/home/homepage-search-widget";
import { PopularToursSection } from "@/components/home/popular-tours-section";
import { TrustIndicators } from "@/components/home/trust-indicators";
import { VideoHero } from "@/components/home/video-hero";
import { HeroContent } from "@/components/home/hero-content";
import { ServicesOverview } from "@/components/home/services-overview";
import { WhyChooseUs } from "@/components/home/why-choose-us";

export default async function HomePage() {
  let featuredTours: any[] = [];
  try {
    const toursData = await prisma.tour.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    });
    
    featuredTours = toursData.map((tour) => ({
      ...tour,
      price: tour.price ? Number(tour.price) : null,
      discountPrice: tour.discountPrice ? Number(tour.discountPrice) : null,
    }));
  } catch (error) {
    console.error("Error fetching featured tours:", error);
  }

  return (
    <div className="flex flex-col">
      <VideoHero overlayOpacity={0.65}>
        <HeroContent />
      </VideoHero>

      <TrustIndicators />

      {featuredTours.length > 0 && (
        <PopularToursSection tours={featuredTours} />
      )}

      <ServicesOverview />

      <WhyChooseUs />
    </div>
  );
}
