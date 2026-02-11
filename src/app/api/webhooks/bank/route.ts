import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBankWebhookSignature } from "@/lib/bank-payment";
import { sendBookingConfirmationEmail, sendAdminPaymentNotification } from "@/lib/email";
import { logActivity, ActivityActions } from "@/lib/activity-log";

export async function POST(request: NextRequest) {
  const webhookReceivedAt = new Date();
  let bookingId: string | null = null;
  
  try {
    const body = await request.text();
    const signature = request.headers.get("x-signature") || "";

    // Log webhook received
    console.log("[Bank Webhook] Received webhook:", {
      hasSignature: !!signature,
      bodyLength: body.length,
      timestamp: webhookReceivedAt.toISOString(),
    });
    
    // Log webhook event to activity log
    await logActivity({
      action: "WEBHOOK_RECEIVED",
      entityType: "Webhook",
      details: {
        source: "BANK",
        eventType: "payment.webhook",
        timestamp: webhookReceivedAt.toISOString(),
      },
    });

    // Verify webhook signature
    if (!verifyBankWebhookSignature(body, signature)) {
      console.error("[Bank Webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const data = JSON.parse(body);
    const { transaction_id, status, order_id } = data;

    // Validate payload structure
    if (!transaction_id || !status) {
      console.error("[Bank Webhook] Invalid payload structure:", data);
      await logActivity({
        action: "WEBHOOK_ERROR",
        entityType: "Webhook",
        details: {
          source: "BANK",
          error: "Invalid payload structure",
          timestamp: new Date().toISOString(),
        },
      });
      return NextResponse.json(
        { error: "Invalid payload structure" },
        { status: 400 }
      );
    }

    // Find booking by transaction ID
    const booking = await prisma.booking.findFirst({
      where: {
        paymentTransactionId: transaction_id,
      },
      include: {
        user: true,
      },
    });

    if (!booking) {
      console.error("[Bank Webhook] Booking not found for transaction ID:", transaction_id);
      // Log this as an activity for monitoring
      await logActivity({
        action: "WEBHOOK_ERROR",
        entityType: "Webhook",
        details: {
          source: "BANK",
          error: "Booking not found",
          transactionId: transaction_id,
          orderId: order_id,
          timestamp: new Date().toISOString(),
        },
      });
      // Return 200 OK to prevent webhook retries for invalid transactions
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 200 });
    }

    bookingId = booking.id;

    // Check if already processed (idempotency check)
    if (booking.paymentStatus === "PAID" && (status === "success" || status === "completed")) {
      console.log("[Bank Webhook] Booking already paid, skipping update:", booking.id);
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Update booking based on transaction status
    if (status === "success" || status === "completed") {
      // Log activity before updating
      await logActivity({
        action: ActivityActions.PAYMENT_SUCCESS,
        entityType: "Booking",
        entityId: booking.id,
        details: {
          bookingId: booking.id,
          transactionId: transaction_id,
          paymentMethod: "BANK",
          amount: Number(booking.totalAmount),
          currency: booking.currency,
        },
      });

      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          paymentMethod: "BANK",
        },
        include: {
          user: true,
          tour: { select: { title: true, slug: true } },
          hotel: { select: { name: true, slug: true } },
          visa: { select: { country: true, type: true } },
        },
      });

      // Send confirmation email (don't let failures break webhook)
      try {
        await sendBookingConfirmationEmail(updatedBooking);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Continue processing - email failure shouldn't break webhook
      }

      // Send admin notification (don't let failures break webhook)
      try {
        await sendAdminPaymentNotification(updatedBooking);
      } catch (notificationError) {
        console.error("Failed to send admin notification:", notificationError);
        // Continue processing - notification failure shouldn't break webhook
      }
    } else if (status === "failed" || status === "cancelled") {
      // Log failed payment
      await logActivity({
        action: ActivityActions.PAYMENT_FAILED,
        entityType: "Booking",
        entityId: booking.id,
        details: {
          bookingId: booking.id,
          transactionId: transaction_id,
          paymentMethod: "BANK",
          reason: status,
        },
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "FAILED",
        },
      });
    }

    console.log("[Bank Webhook] Successfully processed webhook for booking:", bookingId);
    
    // Log successful webhook processing
    await logActivity({
      action: "WEBHOOK_PROCESSED",
      entityType: "Webhook",
      entityId: bookingId || undefined,
      details: {
        source: "BANK",
        bookingId: bookingId,
        transactionId: transaction_id,
        success: true,
        processingTime: Date.now() - webhookReceivedAt.getTime(),
        timestamp: new Date().toISOString(),
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Bank Webhook] Error processing webhook:", error);
    // Log error activity
    try {
      await logActivity({
        action: "WEBHOOK_ERROR",
        entityType: "Webhook",
        entityId: bookingId || undefined,
        details: {
          source: "BANK",
          error: error instanceof Error ? error.message : "Unknown error",
          bookingId: bookingId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      console.error("[Bank Webhook] Failed to log error activity:", logError);
    }
    // Always return 200 OK to prevent webhook retries
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 200 }
    );
  }
}

