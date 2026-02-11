import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { logActivity, ActivityActions } from "@/lib/activity-log";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const { isApproved } = body;

    const review = await prisma.review.update({
      where: { id },
      data: { isApproved: !!isApproved },
    });

    await logActivity({
      userId: admin.id,
      action: isApproved ? ActivityActions.REVIEW_APPROVED : ActivityActions.REVIEW_REJECTED,
      entityType: "Review",
      entityId: id,
    });

    return NextResponse.json(review);
  } catch (error: any) {
    console.error("Error updating review:", error);
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to update review" },
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

    await prisma.review.delete({
      where: { id },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.REVIEW_REJECTED,
      entityType: "Review",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting review:", error);
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}

