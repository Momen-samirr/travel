import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { visaSchema } from "@/lib/validations/visa";
import { requireAdmin } from "@/lib/clerk";
import { logActivity, ActivityActions } from "@/lib/activity-log";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const country = searchParams.get("country");
    const isActive = searchParams.get("isActive") !== "false";

    const where: any = {};
    if (country) where.country = country;
    if (isActive) where.isActive = true;

    const [visas, total] = await Promise.all([
      prisma.visa.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { country: "asc" },
      }),
      prisma.visa.count({ where }),
    ]);

    return NextResponse.json({
      visas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching visas:", error);
    return NextResponse.json(
      { error: "Failed to fetch visas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const data = visaSchema.parse(body);

    const visa = await prisma.visa.create({
      data: {
        ...data,
        requiredDocuments: data.requiredDocuments as any,
      },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.VISA_CREATED,
      entityType: "Visa",
      entityId: visa.id,
    });

    return NextResponse.json(visa, { status: 201 });
  } catch (error: any) {
    console.error("Error creating visa:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create visa" },
      { status: 500 }
    );
  }
}

