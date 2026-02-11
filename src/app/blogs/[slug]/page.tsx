import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { Calendar, User, Clock } from "lucide-react";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await prisma.blog.findUnique({
    where: { slug },
  });

  if (!blog || !blog.isPublished) {
    return { title: "Blog Post Not Found" };
  }

  return {
    title: blog.seoTitle || blog.title,
    description: blog.seoDescription || blog.excerpt || blog.title,
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await prisma.blog.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!blog || !blog.isPublished) {
    notFound();
  }

  const tags = blog.tags as string[] | null;

  return (
    <article className="container mx-auto px-4 py-12 max-w-4xl">
      {blog.featuredImage && (
        <div className="relative h-96 w-full mb-8 rounded-lg overflow-hidden">
          <Image
            src={blog.featuredImage}
            alt={blog.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
        <div className="flex items-center gap-6 text-gray-600 mb-4">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {blog.publishedAt ? formatDate(blog.publishedAt) : "Draft"}
          </span>
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {blog.author.name || "Admin"}
          </span>
          {blog.readingTime && (
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {blog.readingTime} min read
            </span>
          )}
        </div>
        {blog.category && (
          <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm mb-4">
            {blog.category}
          </div>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </article>
  );
}

