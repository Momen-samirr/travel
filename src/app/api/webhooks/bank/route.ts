import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBankWebhookSignature } from "@/lib/bank-payment";
import { sendBookingConfirmationEmail, sendAdminPaymentNotification, sendPaymentFailureEmail, sendAdminPaymentFailureNotification, sendAdminAmadeusOrderFailureNotification } from "@/lib/email";
import { logActivity, ActivityActions } from "@/lib/activity-log";
import { ensureWebhookIdempotency, createAmadeusOrderForBooking } from "@/lib/post-payment-flight-order";

export async function POST(request: NextRequest) {
  if (!process.env.BANK_SECRET_KEY) {
    return NextResponse.json(
      { error: "Bank webhook not configured" },
      { status: 501 }
    );
  }

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

    const eventId = `bank:${transaction_id}`;
    const idem = await ensureWebhookIdempotency("BANK", eventId, booking.id);
    if (idem === "duplicate") {
      console.log("[Bank Webhook] Already processed (idempotency):", eventId);
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    if (booking.paymentStatus === "PAID" && (status === "success" || status === "completed")) {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Update booking based on transaction status
    if (status === "success" || status === "completed") {
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

      if (updatedBooking.bookingType === "FLIGHT") {
        try {
          const amadeusResult = await createAmadeusOrderForBooking({
            id: updatedBooking.id,
            bookingType: updatedBooking.bookingType,
            flightOfferData: updatedBooking.flightOfferData,
            guestDetails: updatedBooking.guestDetails,
            amadeusOrderId: updatedBooking.amadeusOrderId,
            amadeusStatus: updatedBooking.amadeusStatus,
            amadeusRetryCount: updatedBooking.amadeusRetryCount,
          });
          if (!amadeusResult.success) {
            try {
              await sendAdminAmadeusOrderFailureNotification(updatedBooking, amadeusResult.error);
            } catch (e) {
              console.error("Failed to send admin Amadeus failure notification:", e);
            }
          }
        } catch (amadeusError) {
          console.error("[Bank Webhook] Amadeus order creation failed:", amadeusError);
          try {
            await sendAdminAmadeusOrderFailureNotification(updatedBooking, amadeusError instanceof Error ? amadeusError.message : String(amadeusError));
          } catch (e) {
            console.error("Failed to send admin Amadeus failure notification:", e);
          }
        }
      }

      const forEmail = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          user: true,
          tour: { select: { title: true, slug: true } },
          hotel: { select: { name: true, slug: true } },
          visa: { select: { country: true, type: true } },
        },
      });
      if (forEmail) {
        try {
          await sendBookingConfirmationEmail(forEmail);
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
        }
        try {
          await sendAdminPaymentNotification(forEmail);
        } catch (notificationError) {
          console.error("Failed to send admin notification:", notificationError);
        }
      }
    } else if (status === "failed" || status === "cancelled") {
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
        data: { paymentStatus: "FAILED" },
      });

      const failedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { user: true },
      });
      if (failedBooking) {
        try {
          await sendPaymentFailureEmail(failedBooking);
        } catch (e) {
          console.error("Failed to send payment failure email:", e);
        }
        try {
          await sendAdminPaymentFailureNotification(failedBooking);
        } catch (e) {
          console.error("Failed to send admin payment failure notification:", e);
        }
      }
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

