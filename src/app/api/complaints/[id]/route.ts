import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin } from "@/lib/clerk";
import { z } from "zod";
import { sendComplaintStatusUpdateEmail } from "@/lib/email";

const updateComplaintSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  adminResponse: z.string().optional().nullable(),
});

export async function GET(
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
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            bookingType: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!complaint || (complaint.userId !== user.id && user.role === "USER")) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(complaint);
  } catch (error) {
    console.error("Error fetching complaint:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaint" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const data = updateComplaintSchema.parse(body);

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.adminResponse !== undefined) updateData.adminResponse = data.adminResponse;
    if (data.status === "RESOLVED") updateData.resolvedAt = new Date();

    const complaint = await prisma.complaint.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
      },
    });

    // Send email notification to user
    await sendComplaintStatusUpdateEmail(complaint);

    return NextResponse.json(complaint);
  } catch (error: any) {
    console.error("Error updating complaint:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update complaint" },
      { status: 500 }
    );
  }
}

