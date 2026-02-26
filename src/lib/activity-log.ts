import { prisma } from "./prisma";
import { headers } from "next/headers";

interface LogActivityParams {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
}

export async function logActivity(params: LogActivityParams) {
  try {
    // Get request metadata
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details || {},
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Don't throw - logging failures shouldn't break the application
    console.error("Failed to log activity:", error);
  }
}

// Helper functions for common actions
export const ActivityActions = {
  // User actions
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
  USER_ACTIVATED: "USER_ACTIVATED",
  USER_DEACTIVATED: "USER_DEACTIVATED",
  USER_LOGIN: "USER_LOGIN",

  // Booking actions
  BOOKING_CREATED: "BOOKING_CREATED",
  BOOKING_UPDATED: "BOOKING_UPDATED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  BOOKING_CONFIRMED: "BOOKING_CONFIRMED",
  BOOKING_REFUNDED: "BOOKING_REFUNDED",

  // Payment actions
  PAYMENT_INITIATED: "PAYMENT_INITIATED",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_REFUNDED: "PAYMENT_REFUNDED",

  // Content actions
  TOUR_CREATED: "TOUR_CREATED",
  TOUR_UPDATED: "TOUR_UPDATED",
  TOUR_DELETED: "TOUR_DELETED",
  FLIGHT_CREATED: "FLIGHT_CREATED",
  FLIGHT_UPDATED: "FLIGHT_UPDATED",
  HOTEL_CREATED: "HOTEL_CREATED",
  HOTEL_UPDATED: "HOTEL_UPDATED",
  VISA_CREATED: "VISA_CREATED",
  VISA_UPDATED: "VISA_UPDATED",
  BLOG_CREATED: "BLOG_CREATED",
  BLOG_UPDATED: "BLOG_UPDATED",
  BLOG_PUBLISHED: "BLOG_PUBLISHED",

  // Review actions
  REVIEW_CREATED: "REVIEW_CREATED",
  REVIEW_APPROVED: "REVIEW_APPROVED",
  REVIEW_REJECTED: "REVIEW_REJECTED",

  // Complaint actions
  COMPLAINT_CREATED: "COMPLAINT_CREATED",
  COMPLAINT_UPDATED: "COMPLAINT_UPDATED",
  COMPLAINT_RESOLVED: "COMPLAINT_RESOLVED",

  // Branch actions
  BRANCH_CREATED: "BRANCH_CREATED",
  BRANCH_UPDATED: "BRANCH_UPDATED",
  BRANCH_DELETED: "BRANCH_DELETED",

  // Admin actions
  ADMIN_ACTION: "ADMIN_ACTION",
  SETTINGS_UPDATED: "SETTINGS_UPDATED",

  // Amadeus flight order
  AMADEUS_ORDER_CREATED: "AMADEUS_ORDER_CREATED",
  AMADEUS_ORDER_FAILED: "AMADEUS_ORDER_FAILED",
} as const;

