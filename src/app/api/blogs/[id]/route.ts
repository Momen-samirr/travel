import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/clerk";
import { logActivity, ActivityActions } from "@/lib/activity-log";
import { z } from "zod";

const blogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  featuredImage: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  isPublished: z.boolean(),
  publishedAt: z.date().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = blogSchema.parse(body);

    const wordCount = data.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const oldBlog = await prisma.blog.findUnique({
      where: { id },
      select: { isPublished: true },
    });

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        ...data,
        tags: data.tags as any,
        readingTime,
      },
    });

    await logActivity({
      userId: user.id,
      action: ActivityActions.BLOG_UPDATED,
      entityType: "Blog",
      entityId: id,
    });

    if (data.isPublished && !oldBlog?.isPublished) {
      await logActivity({
        userId: user.id,
        action: ActivityActions.BLOG_PUBLISHED,
        entityType: "Blog",
        entityId: id,
      });
    }

    return NextResponse.json(blog);
  } catch (error: any) {
    console.error("Error updating blog:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    await prisma.blog.delete({
      where: { id },
    });

    await logActivity({
      userId: user.id,
      action: ActivityActions.BLOG_UPDATED, // We can add BLOG_DELETED if needed
      entityType: "Blog",
      entityId: id,
      details: { deleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    );
  }
}

