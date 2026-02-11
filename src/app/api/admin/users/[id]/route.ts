import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { logActivity, ActivityActions } from "@/lib/activity-log";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            bookingType: true,
            status: true,
            totalAmount: true,
            currency: true,
            bookingDate: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            rating: true,
            title: true,
            createdAt: true,
          },
        },
        complaints: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            subject: true,
            status: true,
            createdAt: true,
          },
        },
        activityLogs: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
            complaints: true,
            activityLogs: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch user", details: err.message },
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

    const { name, phone, role, isActive } = body;

    // Get current user to track changes
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, isActive: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    const changes: string[] = [];
    if (role && role !== currentUser.role) {
      changes.push(`role: ${currentUser.role} → ${role}`);
      await logActivity({
        userId: admin.id,
        action: ActivityActions.USER_ROLE_CHANGED,
        entityType: "User",
        entityId: id,
        details: { oldRole: currentUser.role, newRole: role },
      });
    }

    if (isActive !== undefined && isActive !== currentUser.isActive) {
      changes.push(`isActive: ${currentUser.isActive} → ${isActive}`);
      await logActivity({
        userId: admin.id,
        action: isActive ? ActivityActions.USER_ACTIVATED : ActivityActions.USER_DEACTIVATED,
        entityType: "User",
        entityId: id,
      });
    }

    if (changes.length > 0) {
      await logActivity({
        userId: admin.id,
        action: ActivityActions.USER_UPDATED,
        entityType: "User",
        entityId: id,
        details: { changes },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update user", details: err.message },
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

    // Don't allow deleting yourself
    if (admin.id === id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    await logActivity({
      userId: admin.id,
      action: ActivityActions.USER_DELETED,
      entityType: "User",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete user", details: err.message },
      { status: 500 }
    );
  }
}

