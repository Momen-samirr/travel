import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/clerk";
import { z } from "zod";
import { sendComplaintStatusUpdateEmail } from "@/lib/email";

const complaintSchema = z.object({
  bookingId: z.string().optional().nullable(),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  attachments: z.array(z.string().url()).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: any = { userId: user.id };
    if (status) where.status = status;

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            bookingType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ complaints });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaints" },
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
    const data = complaintSchema.parse(body);

    const complaint = await prisma.complaint.create({
      data: {
        userId: user.id,
        bookingId: data.bookingId,
        subject: data.subject,
        description: data.description,
        category: data.category,
        attachments: data.attachments as any,
        status: "OPEN",
        priority: "MEDIUM",
      },
    });

    // Notify admins
    const { sendAdminNotification } = await import("@/lib/email");
    await sendAdminNotification(
      "NEW_COMPLAINT",
      "New Complaint Received",
      `A new complaint has been submitted: ${data.subject}`
    );

    return NextResponse.json(complaint, { status: 201 });
  } catch (error: any) {
    console.error("Error creating complaint:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create complaint" },
      { status: 500 }
    );
  }
}

