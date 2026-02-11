import { prisma } from "@/lib/prisma";
import { Calendar } from "lucide-react";
import { StaggerList } from "@/components/motion/stagger-list";
import { BlogCard } from "@/components/blogs/blog-card";

export const metadata = {
  title: "Blog",
  description: "Read our latest travel tips, guides, and stories",
};

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 12;

  const where: any = { isPublished: true };
  if (params.category) where.category = params.category;

  const [blogs, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { publishedAt: "desc" },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.blog.count({ where }),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-16 md:py-20">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/600')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <Calendar className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-shadow-lg">
              Travel Blog
            </h1>
            <p className="text-xl text-white/90 text-shadow-md">
              Read our latest travel tips, guides, and stories
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="container mx-auto px-4 py-12 flex-1">
        {blogs.length > 0 ? (
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </StaggerList>
        ) : (
          <div className="text-center py-20">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No Blog Posts Found</h2>
            <p className="text-muted-foreground">
              Check back soon for new travel stories and guides!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

