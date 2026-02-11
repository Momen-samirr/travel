import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { BlogForm } from "@/components/admin/blog-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const { id } = await params;

  const blog = await prisma.blog.findUnique({
    where: { id },
  });

  if (!blog) {
    notFound();
  }

  const tags = blog.tags as string[] | null;

  const initialData = {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    excerpt: blog.excerpt || "",
    featuredImage: blog.featuredImage || "",
    category: blog.category || "",
    tags: tags ? tags.join(", ") : "",
    isPublished: blog.isPublished,
    seoTitle: blog.seoTitle || "",
    seoDescription: blog.seoDescription || "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Blog Post</h1>
        <p className="text-muted-foreground">Update blog post information</p>
      </div>
      <BlogForm initialData={initialData} />
    </div>
  );
}

