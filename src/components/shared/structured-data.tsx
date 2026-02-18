import { Tour, Blog } from "@prisma/client";

interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string;
}

interface StructuredDataProps {
  type: "organization" | "tour" | "blog" | "branches";
  data?: Tour | Blog | Branch[] | null;
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

      case "branches":
        if (!data || !Array.isArray(data)) return null;
        const branches = data as Branch[];
        return branches.map((branch) => ({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: branch.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: branch.address.split("\n")[0],
            addressLocality: branch.city,
            addressCountry: branch.country,
          },
          telephone: branch.phone,
          email: branch.email,
          ...(branch.latitude && branch.longitude
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: branch.latitude,
                  longitude: branch.longitude,
                },
              }
            : {}),
        }));

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

  // Handle array of structured data (branches)
  if (Array.isArray(structuredData)) {
    return (
      <>
        {structuredData.map((item, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
            suppressHydrationWarning
          />
        ))}
      </>
    );
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      suppressHydrationWarning
    />
  );
}

