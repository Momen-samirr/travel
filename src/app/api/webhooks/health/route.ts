import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    // Get recent webhook-related activities
    const recentWebhookActivities = await prisma.activityLog.findMany({
      where: {
        action: {
          in: ["WEBHOOK_RECEIVED", "WEBHOOK_PROCESSED", "WEBHOOK_ERROR", "PAYMENT_SUCCESS", "PAYMENT_FAILED"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    // Calculate statistics
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const stats = {
      last24Hours: {
        received: recentWebhookActivities.filter(
          (a) => a.action === "WEBHOOK_RECEIVED" && a.createdAt >= last24Hours
        ).length,
        processed: recentWebhookActivities.filter(
          (a) => a.action === "WEBHOOK_PROCESSED" && a.createdAt >= last24Hours
        ).length,
        errors: recentWebhookActivities.filter(
          (a) => a.action === "WEBHOOK_ERROR" && a.createdAt >= last24Hours
        ).length,
        paymentsSuccess: recentWebhookActivities.filter(
          (a) => a.action === "PAYMENT_SUCCESS" && a.createdAt >= last24Hours
        ).length,
        paymentsFailed: recentWebhookActivities.filter(
          (a) => a.action === "PAYMENT_FAILED" && a.createdAt >= last24Hours
        ).length,
      },
      recent: recentWebhookActivities.slice(0, 20).map((activity) => ({
        id: activity.id,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        createdAt: activity.createdAt.toISOString(),
        details: activity.details,
      })),
    };

    // Calculate success rate
    const totalProcessed = stats.last24Hours.processed + stats.last24Hours.errors;
    const successRate = totalProcessed > 0 
      ? ((stats.last24Hours.processed / totalProcessed) * 100).toFixed(2)
      : "100.00";

    return NextResponse.json({
      status: "healthy",
      statistics: stats,
      successRate: `${successRate}%`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch webhook health", details: err.message },
      { status: 500 }
    );
  }
}

