import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaymobWebhook } from "@/lib/paymob";
import { sendBookingConfirmationEmail, sendAdminPaymentNotification, sendPaymentFailureEmail, sendAdminPaymentFailureNotification, sendAdminAmadeusOrderFailureNotification } from "@/lib/email";
import { logActivity, ActivityActions } from "@/lib/activity-log";
import { ensureWebhookIdempotency, createAmadeusOrderForBooking } from "@/lib/post-payment-flight-order";

export async function POST(request: NextRequest) {
  const webhookReceivedAt = new Date();
  let bookingId: string | null = null;
  
  try {
    const body = await request.json();
    const hmac = request.headers.get("hmac") || "";

    // Log webhook received
    console.log("[Paymob Webhook] Received webhook:", {
      hasObj: !!body.obj,
      orderId: body.obj?.order?.id,
      transactionSuccess: body.obj?.transaction?.success,
      timestamp: webhookReceivedAt.toISOString(),
    });

    // Verify webhook signature
    if (!verifyPaymobWebhook(body.obj, hmac)) {
      console.error("[Paymob Webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const { order, transaction } = body.obj;

    // Validate payload structure
    if (!order || !transaction) {
      console.error("[Paymob Webhook] Invalid payload structure:", body);
      await logActivity({
        action: "WEBHOOK_ERROR",
        entityType: "Webhook",
        details: {
          source: "PAYMOB",
          error: "Invalid payload structure",
          timestamp: new Date().toISOString(),
        },
      });
      return NextResponse.json(
        { error: "Invalid payload structure" },
        { status: 400 }
      );
    }

    // Find booking by order ID (stored in paymentTransactionId)
    const booking = await prisma.booking.findFirst({
      where: {
        paymentTransactionId: order.id.toString(),
      },
      include: {
        user: true,
      },
    });

    if (!booking) {
      console.error("[Paymob Webhook] Booking not found for order ID:", order.id);
      // Log this as an activity for monitoring
      await logActivity({
        action: "WEBHOOK_ERROR",
        entityType: "Webhook",
        details: {
          source: "PAYMOB",
          error: "Booking not found",
          orderId: order.id.toString(),
          transactionId: transaction.id?.toString(),
          timestamp: new Date().toISOString(),
        },
      });
      // Return 200 OK to prevent webhook retries for invalid orders
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 200 });
    }

    bookingId = booking.id;

    const eventId = `paymob:${order.id}:${transaction.id ?? order.id}`;
    const idem = await ensureWebhookIdempotency("PAYMOB", eventId, booking.id);
    if (idem === "duplicate") {
      console.log("[Paymob Webhook] Already processed (idempotency):", eventId);
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Update booking based on transaction status
    if (transaction.success === true) {
      // Log activity before updating
      await logActivity({
        action: ActivityActions.PAYMENT_SUCCESS,
        entityType: "Booking",
        entityId: booking.id,
        details: {
          bookingId: booking.id,
          transactionId: order.id.toString(),
          paymentMethod: "PAYMOB",
          amount: Number(booking.totalAmount),
          currency: booking.currency,
        },
      });

      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          paymentMethod: "PAYMOB",
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
          console.error("[Paymob Webhook] Amadeus order creation failed:", amadeusError);
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
    } else {
      await logActivity({
        action: ActivityActions.PAYMENT_FAILED,
        entityType: "Booking",
        entityId: booking.id,
        details: {
          bookingId: booking.id,
          transactionId: order.id.toString(),
          paymentMethod: "PAYMOB",
          reason: transaction.failure_reason || "Unknown",
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

    console.log("[Paymob Webhook] Successfully processed webhook for booking:", bookingId);
    
    // Log successful webhook processing
    await logActivity({
      action: "WEBHOOK_PROCESSED",
      entityType: "Webhook",
      entityId: bookingId || undefined,
      details: {
        source: "PAYMOB",
        bookingId: bookingId,
        orderId: order.id.toString(),
        success: true,
        processingTime: Date.now() - webhookReceivedAt.getTime(),
        timestamp: new Date().toISOString(),
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Paymob Webhook] Error processing webhook:", error);
    // Log error activity
    try {
      await logActivity({
        action: "WEBHOOK_ERROR",
        entityType: "Webhook",
        entityId: bookingId || undefined,
        details: {
          source: "PAYMOB",
          error: error instanceof Error ? error.message : "Unknown error",
          bookingId: bookingId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      console.error("[Paymob Webhook] Failed to log error activity:", logError);
    }
    // Always return 200 OK to prevent webhook retries
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 200 }
    );
  }
}

