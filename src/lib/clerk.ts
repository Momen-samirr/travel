import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { logger } from "./logger";
import { logActivity, ActivityActions } from "./activity-log";

export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      logger.debug("No userId found in auth context");
      return null;
    }

    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      logger.warn("Clerk user not found despite having userId", { userId });
      return null;
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || "";
    
    // Validate email before proceeding
    if (!email) {
      logger.error("Cannot sync user: email is missing", undefined, {
        userId,
        clerkId: clerkUser.id,
        emailAddresses: clerkUser.emailAddresses,
      });
      return null;
    }

    // Sync user with database using transaction for safety
    try {
      // First, try to find existing user
      let user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        // User doesn't exist, create them
        // Use upsert to handle race conditions where multiple requests try to create the same user
        user = await prisma.user.upsert({
          where: { clerkId: userId },
          update: {}, // If exists, don't update
          create: {
            clerkId: userId,
            email,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
            phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
            role: "USER",
          },
        });

        logger.info("User created via getCurrentUser fallback", {
          userId: user.id,
          clerkId: userId,
          email,
        });

        // Log activity
        await logActivity({
          userId: user.id,
          action: ActivityActions.USER_CREATED,
          entityType: "User",
          entityId: user.id,
          details: { source: "getCurrentUser_fallback" },
        });
      } else {
        // User exists, check if we need to update
        const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null;
        const phone = clerkUser.phoneNumbers[0]?.phoneNumber || null;

        // Update last login time and check if we need to update other fields
        const needsUpdate = 
          user.email !== email || 
          user.name !== name || 
          user.phone !== phone;

        if (needsUpdate) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              email,
              name,
              phone,
              lastLoginAt: new Date(),
            },
          });

          logger.debug("User updated in getCurrentUser", {
            userId: user.id,
            clerkId: userId,
          });
        } else {
          // Just update last login time
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        }
      }

      return user;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Handle specific Prisma errors
      if (error && typeof error === "object" && "code" in error) {
        if (error.code === "P2002") {
          // Unique constraint violation - user might have been created by another request
          logger.warn("Race condition detected: user already exists", {
            clerkId: userId,
            email,
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
        email,
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
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Forbidden: Admin access required");
  }

  return user;
}

