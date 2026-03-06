import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { logger } from "./logger";
import { logActivity, ActivityActions } from "./activity-log";

async function getAuthedUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) {
    logger.debug("No userId found in auth context");
    return null;
  }
  return userId;
}

export async function getCurrentUserReadOnly() {
  try {
    const userId = await getAuthedUserId();
    if (!userId) return null;

    return await prisma.user.findUnique({
      where: { clerkId: userId },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in getCurrentUserReadOnly", err);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const userId = await getAuthedUserId();
    if (!userId) return null;

    // Keep request-path auth checks read-only whenever possible.
    try {
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (existingUser) {
        return existingUser;
      }

      const clerkUser = await currentUser();
      if (!clerkUser) {
        logger.warn("Clerk user not found despite having userId", { userId });
        return null;
      }

      const email = clerkUser.emailAddresses[0]?.emailAddress || "";
      if (!email) {
        logger.error("Cannot sync user: email is missing", undefined, {
          userId,
          clerkId: clerkUser.id,
          emailAddresses: clerkUser.emailAddresses,
        });
        return null;
      }

      const createdUser = await prisma.user.upsert({
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

      logger.info("User created via getCurrentUser fallback", {
        userId: createdUser.id,
        clerkId: userId,
        email,
      });

      await logActivity({
        userId: createdUser.id,
        action: ActivityActions.USER_CREATED,
        entityType: "User",
        entityId: createdUser.id,
        details: { source: "getCurrentUser_fallback" },
      });

      return createdUser;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Handle specific Prisma errors
      if (error && typeof error === "object" && "code" in error) {
        if (error.code === "P2002") {
          // Unique constraint violation - user might have been created by another request
          logger.warn("Race condition detected: user already exists", {
            clerkId: userId,
          });
          
          // Try to fetch the user that was just created
          const existingUser = await prisma.user.findUnique({
            where: { clerkId: userId },
          });
          
          if (existingUser) {
            return existingUser;
          }
        }
      }

      logger.error("Failed to sync user in getCurrentUser", err, {
        userId,
        clerkId: userId,
      });
      
      // Don't throw - return null to allow the request to continue
      // The user can try again on the next request
      return null;
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in getCurrentUser", err);
    return null;
  }
}

export async function requireAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

export async function requireAdmin() {
  const user = await getCurrentUserReadOnly();
  
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Forbidden: Admin access required");
  }

  return user;
}

