import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { logActivity, ActivityActions } from "@/lib/activity-log";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || "";
    
    if (!email) {
      logger.error("Cannot sync user: email is missing", undefined, {
        userId,
        clerkId: clerkUser.id,
      });
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      user = await prisma.user.upsert({
        where: { clerkId: userId },
        update: {},
        create: {
          clerkId: userId,
          email,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
          phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
          role: "USER",
        },
      });

      logger.info("User created via sync-user API", {
        userId: user.id,
        clerkId: userId,
        email,
      });

      await logActivity({
        userId: user.id,
        action: ActivityActions.USER_CREATED,
        entityType: "User",
        entityId: user.id,
        details: { source: "sync-user_api" },
      });

      return NextResponse.json({
        success: true,
        message: "User created",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: "User already exists",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error in sync-user API", err);
    
    return NextResponse.json(
      { error: "Failed to sync user", details: err.message },
      { status: 500 }
    );
  }
}

