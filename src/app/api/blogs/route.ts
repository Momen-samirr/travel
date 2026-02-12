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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const isPublished = searchParams.get("isPublished") !== "false";

    const where: any = {};
    if (category) where.category = category;
    if (isPublished) where.isPublished = true;

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
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

    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = blogSchema.parse(body);

    const wordCount = data.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const blog = await prisma.blog.create({
      data: {
        ...data,
        authorId: user.id,
        tags: data.tags as any,
        readingTime,
      },
    });

    await logActivity({
      userId: user.id,
      action: ActivityActions.BLOG_CREATED,
      entityType: "Blog",
      entityId: blog.id,
    });

    if (data.isPublished) {
      await logActivity({
        userId: user.id,
        action: ActivityActions.BLOG_PUBLISHED,
        entityType: "Blog",
        entityId: blog.id,
      });
    }

    return NextResponse.json(blog, { status: 201 });
  } catch (error: any) {
    console.error("Error creating blog:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 }
    );
  }
}

