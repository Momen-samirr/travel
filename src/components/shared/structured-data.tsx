import { Tour, Blog } from "@prisma/client";

interface StructuredDataProps {
  type: "organization" | "tour" | "blog";
  data?: Tour | Blog | null;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const getStructuredData = () => {
    switch (type) {
      case "organization":
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Tourism Co",
          url: baseUrl,
          logo: `${baseUrl}/logo.png`,
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+1-234-567-8900",
            contactType: "customer service",
          },
          sameAs: [
            // Add social media links
          ],
        };

      case "tour":
        if (!data || !("title" in data)) return null;
        const tour = data as Tour;
        const images = tour.images as string[];
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          name: tour.title,
          description: tour.shortDescription,
          image: images[0] || "",
          offers: {
            "@type": "Offer",
            price: Number(tour.discountPrice || tour.price),
            priceCurrency: tour.currency,
            availability: tour.isActive
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.5", // This should be calculated from reviews
            reviewCount: "10", // This should be from reviews count
          },
        };

      case "blog":
        if (!data || !("title" in data)) return null;
        const blog = data as Blog;
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: blog.title,
          description: blog.excerpt || blog.seoDescription,
          image: blog.featuredImage || "",
          datePublished: blog.publishedAt?.toISOString(),
          dateModified: blog.updatedAt.toISOString(),
          author: {
            "@type": "Person",
            name: "Admin", // Should get from author relation
          },
        };

      default:
        return null;
    }
  };

  const structuredData = getStructuredData();

  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      suppressHydrationWarning
    />
  );
}

