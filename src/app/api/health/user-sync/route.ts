import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      checks: {
        database: false,
        clerk: false,
        userSync: false,
      },
      details: {} as Record<string, any>,
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.checks.database = true;
      health.details.database = "Connected";
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      health.details.database = `Error: ${err.message}`;
      logger.error("Database health check failed", err);
    }

    // Check Clerk integration
    try {
      const { userId } = await auth();
      if (userId) {
        const clerkUser = await currentUser();
        health.checks.clerk = !!clerkUser;
        health.details.clerk = clerkUser
          ? {
              userId,
              email: clerkUser.emailAddresses[0]?.emailAddress || "No email",
            }
          : "No authenticated user";
      } else {
        health.details.clerk = "No authenticated user";
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      health.details.clerk = `Error: ${err.message}`;
      logger.error("Clerk health check failed", err);
    }

    // Test user sync functionality
    try {
      const { userId } = await auth();
      if (userId) {
        const clerkUser = await currentUser();
        if (clerkUser) {
          const email = clerkUser.emailAddresses[0]?.emailAddress || "";
          
          // Check if user exists in database
          const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
          });

          if (dbUser) {
            health.checks.userSync = true;
            health.details.userSync = {
              status: "synced",
              userId: dbUser.id,
              email: dbUser.email,
              role: dbUser.role,
            };
          } else {
            health.details.userSync = {
              status: "not_synced",
              message: "User exists in Clerk but not in database",
              clerkId: userId,
              email,
            };
          }
        } else {
          health.details.userSync = "No Clerk user found";
        }
      } else {
        health.details.userSync = "No authenticated user";
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      health.details.userSync = `Error: ${err.message}`;
      logger.error("User sync health check failed", err);
    }

    // Overall status
    const allChecksPassed = Object.values(health.checks).every((check) => check === true);
    health.status = allChecksPassed ? "ok" : "degraded";

    return NextResponse.json(health, {
      status: allChecksPassed ? 200 : 503,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Health check endpoint error", err);
    
    return NextResponse.json(
      {
        status: "error",
        error: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

