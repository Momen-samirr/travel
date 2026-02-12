import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const [tours, hotels, blogs] = await Promise.all([
    prisma.tour.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.hotel.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blog.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const routes = [
    "",
    "/tours",
    "/flights",
    "/hotels",
    "/visa",
    "/blogs",
    "/reviews",
    "/about",
    "/contact",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const tourRoutes = tours.map((tour) => ({
    url: `${baseUrl}/tours/${tour.slug}`,
    lastModified: tour.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const hotelRoutes = hotels.map((hotel) => ({
    url: `${baseUrl}/hotels/${hotel.slug}`,
    lastModified: hotel.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const blogRoutes = blogs.map((blog) => ({
    url: `${baseUrl}/blogs/${blog.slug}`,
    lastModified: blog.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...routes, ...tourRoutes, ...hotelRoutes, ...blogRoutes];
}

