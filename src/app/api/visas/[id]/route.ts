import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { visaSchema } from "@/lib/validations/visa";
import { requireAdmin } from "@/lib/clerk";
import { logActivity, ActivityActions } from "@/lib/activity-log";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visa = await prisma.visa.findUnique({
      where: { id },
    });

    if (!visa) {
      return NextResponse.json(
        { error: "Visa not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(visa);
  } catch (error) {
    console.error("Error fetching visa:", error);
    return NextResponse.json(
      { error: "Failed to fetch visa" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const data = visaSchema.parse(body);

    const visa = await prisma.visa.update({
      where: { id },
      data: {
        ...data,
        requiredDocuments: data.requiredDocuments as any,
      },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.VISA_UPDATED,
      entityType: "Visa",
      entityId: id,
    });

    return NextResponse.json(visa);
  } catch (error: any) {
    console.error("Error updating visa:", error);
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
      { error: "Failed to update visa" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    await prisma.visa.delete({
      where: { id },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.VISA_UPDATED,
      entityType: "Visa",
      entityId: id,
      details: { deleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting visa:", error);
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete visa" },
      { status: 500 }
    );
  }
}

