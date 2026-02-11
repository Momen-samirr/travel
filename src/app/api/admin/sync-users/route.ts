import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const body = await request.json();
    const { clerkId, email, force } = body;

    // If specific user provided, sync that user
    if (clerkId || email) {
      return await syncSingleUser(clerkId, email, force);
    }

    // Otherwise, sync all users from Clerk
    return await syncAllUsers();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    logger.error("Error in sync-users endpoint", err);
    return NextResponse.json(
      { error: "Failed to sync users", details: err.message },
      { status: 500 }
    );
  }
}

async function syncSingleUser(clerkId?: string, email?: string, force = false) {
  try {
    const clerk = await clerkClient();
    let clerkUser;

    if (clerkId) {
      clerkUser = await clerk.users.getUser(clerkId);
    } else if (email) {
      const users = await clerk.users.getUserList({ emailAddress: [email] });
      if (users.data.length === 0) {
        return NextResponse.json(
          { error: "User not found in Clerk" },
          { status: 404 }
        );
      }
      clerkUser = users.data[0];
    } else {
      return NextResponse.json(
        { error: "Either clerkId or email is required" },
        { status: 400 }
      );
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress || "";
    if (!userEmail) {
      return NextResponse.json(
        { error: "User has no email address" },
        { status: 400 }
      );
    }

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (existingUser && !force) {
      return NextResponse.json({
        success: true,
        message: "User already exists in database",
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
        },
      });
    }

    // Create or update user
    const user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email: userEmail,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
        phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
      },
      create: {
        clerkId: clerkUser.id,
        email: userEmail,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
        phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
        role: "USER",
      },
    });

    logger.info("User synced manually", {
      userId: user.id,
      clerkId: clerkUser.id,
      email: userEmail,
      force,
    });

    return NextResponse.json({
      success: true,
      message: existingUser ? "User updated" : "User created",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error syncing single user", err, { clerkId, email });
    
    return NextResponse.json(
      { error: "Failed to sync user", details: err.message },
      { status: 500 }
    );
  }
}

async function syncAllUsers() {
  try {
    const clerk = await clerkClient();
    let allUsers: any[] = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;

    // Fetch all users from Clerk (paginated)
    while (hasMore) {
      const response = await clerk.users.getUserList({
        limit,
        offset,
      });

      allUsers = allUsers.concat(response.data);
      hasMore = response.data.length === limit;
      offset += limit;
    }

    logger.info("Starting bulk user sync", {
      totalUsers: allUsers.length,
    });

    const results = {
      total: allUsers.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Sync each user
    for (const clerkUser of allUsers) {
      try {
        const email = clerkUser.emailAddresses[0]?.emailAddress || "";
        
        if (!email) {
          results.skipped++;
          results.errors.push(`User ${clerkUser.id} has no email`);
          continue;
        }

        const existingUser = await prisma.user.findUnique({
          where: { clerkId: clerkUser.id },
        });

        await prisma.user.upsert({
          where: { clerkId: clerkUser.id },
          update: {
            email,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
            phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
          },
          create: {
            clerkId: clerkUser.id,
            email,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
            phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
            role: "USER",
          },
        });

        if (existingUser) {
          results.updated++;
        } else {
          results.created++;
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        results.skipped++;
        results.errors.push(`User ${clerkUser.id}: ${err.message}`);
        logger.error("Error syncing user in bulk", err, {
          clerkId: clerkUser.id,
        });
      }
    }

    logger.info("Bulk user sync completed", results);

    return NextResponse.json({
      success: true,
      message: "Bulk sync completed",
      results,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error in bulk user sync", err);
    
    return NextResponse.json(
      { error: "Failed to sync users", details: err.message },
      { status: 500 }
    );
  }
}

