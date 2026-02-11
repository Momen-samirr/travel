import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    logger.error("CLERK_WEBHOOK_SECRET is missing", undefined, {
      endpoint: "/api/webhooks/clerk",
    });
    return new Response(
      JSON.stringify({ error: "Webhook secret not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      logger.warn("Missing Svix headers in webhook request", {
        hasSvixId: !!svix_id,
        hasSvixTimestamp: !!svix_timestamp,
        hasSvixSignature: !!svix_signature,
      });
      return new Response(
        JSON.stringify({ error: "Missing required headers" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
      logger.info("Webhook verified successfully", {
        eventType: evt.type,
        eventId: evt.data.id,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("Error verifying webhook signature", error, {
        svixId: svix_id,
      });
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle the webhook
    const eventType = evt.type;
    logger.debug("Processing webhook event", { eventType, data: evt.data });

    if (eventType === "user.created") {
      await handleUserCreated(evt.data);
    } else if (eventType === "user.updated") {
      await handleUserUpdated(evt.data);
    } else if (eventType === "user.deleted") {
      await handleUserDeleted(evt.data);
    } else {
      logger.warn("Unhandled webhook event type", { eventType });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in webhook handler", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function handleUserCreated(data: any) {
  const { id, email_addresses, first_name, last_name, phone_numbers } = data;
  const email = email_addresses[0]?.email_address || "";

  // Validate email
  if (!email) {
    logger.error("Cannot create user: email is missing", undefined, {
      clerkId: id,
      emailAddresses: email_addresses,
    });
    throw new Error("Email is required to create user");
  }

  // Retry logic for transient failures
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if user already exists (race condition handling)
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: id },
      });

      if (existingUser) {
        logger.info("User already exists, skipping creation", {
          clerkId: id,
          userId: existingUser.id,
        });
        return;
      }

      const user = await prisma.user.create({
        data: {
          clerkId: id,
          email,
          name: `${first_name || ""} ${last_name || ""}`.trim() || null,
          phone: phone_numbers[0]?.phone_number || null,
          role: "USER",
        },
      });

      logger.info("User created successfully via webhook", {
        userId: user.id,
        clerkId: id,
        email,
        attempt,
      });
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a unique constraint violation (duplicate)
      if (error && typeof error === "object" && "code" in error) {
        if (error.code === "P2002") {
          logger.warn("User already exists (duplicate key)", {
            clerkId: id,
            email,
            attempt,
          });
          return; // User already exists, that's okay
        }
      }

      logger.warn(`Failed to create user (attempt ${attempt}/${maxRetries})`, {
        clerkId: id,
        email,
        error: lastError.message,
        attempt,
      });

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  // All retries failed
  logger.error("Failed to create user after all retries", lastError!, {
    clerkId: id,
    email,
    maxRetries,
  });
  throw lastError;
}

async function handleUserUpdated(data: any) {
  const { id, email_addresses, first_name, last_name, phone_numbers } = data;
  const email = email_addresses[0]?.email_address || "";

  try {
    const user = await prisma.user.update({
      where: { clerkId: id },
      data: {
        email,
        name: `${first_name || ""} ${last_name || ""}`.trim() || null,
        phone: phone_numbers[0]?.phone_number || null,
      },
    });

    logger.info("User updated successfully via webhook", {
      userId: user.id,
      clerkId: id,
      email,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    // If user doesn't exist, create them (fallback)
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      logger.warn("User not found during update, creating instead", {
        clerkId: id,
        email,
      });
      await handleUserCreated(data);
    } else {
      logger.error("Failed to update user", err, {
        clerkId: id,
        email,
      });
      throw err;
    }
  }
}

async function handleUserDeleted(data: any) {
  const { id } = data;

  try {
    await prisma.user.delete({
      where: { clerkId: id },
    });

    logger.info("User deleted successfully via webhook", {
      clerkId: id,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    // If user doesn't exist, that's okay
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      logger.warn("User not found during deletion (already deleted)", {
        clerkId: id,
      });
    } else {
      logger.error("Failed to delete user", err, {
        clerkId: id,
      });
      throw err;
    }
  }
}

