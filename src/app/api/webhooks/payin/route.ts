import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendAdminAmadeusOrderFailureNotification,
  sendAdminPaymentFailureNotification,
  sendAdminPaymentNotification,
  sendBookingConfirmationEmail,
  sendPaymentFailureEmail,
} from "@/lib/email";
import { logActivity, ActivityActions } from "@/lib/activity-log";
import { createAmadeusOrderForBooking } from "@/lib/post-payment-flight-order";
import { PayinWebhookPayload, verifyPayinWebhook } from "@/lib/payin";

async function ensurePayinWebhookIdempotency(eventId: string, bookingId?: string) {
  try {
    await prisma.webhookIdempotency.create({
      data: {
        source: "PAYIN",
        eventId,
        bookingId: bookingId ?? null,
      },
    });
    return "processed" as const;
  } catch (error: unknown) {
    const maybeError = error as { code?: string };
    if (maybeError?.code === "P2002") {
      return "duplicate" as const;
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.PAYIN_HASH_TOKEN) {
    return NextResponse.json({ error: "PayIn webhook not configured" }, { status: 501 });
  }

  const webhookReceivedAt = new Date();
  let bookingId: string | null = null;

  try {
    const body = (await request.json()) as Partial<PayinWebhookPayload>;

    if (
      typeof body.success !== "boolean" ||
      (!body.invoice_id && body.invoice_id !== 0) ||
      !body.invoice_status ||
      !body.signature
    ) {
      return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 });
    }

    const payload: PayinWebhookPayload = {
      success: body.success,
      invoice_id: body.invoice_id,
      invoice_status: body.invoice_status,
      message: body.message || "",
      signature: body.signature,
    };

    if (!verifyPayinWebhook(payload)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const invoiceId = String(payload.invoice_id);
    const booking = await prisma.booking.findFirst({
      where: { paymentTransactionId: invoiceId },
      include: { user: true },
    });

    if (!booking) {
      await logActivity({
        action: "WEBHOOK_ERROR",
        entityType: "Webhook",
        details: {
          source: "PAYIN",
          error: "Booking not found",
          invoiceId,
          timestamp: new Date().toISOString(),
        },
      });
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 200 });
    }

    bookingId = booking.id;
    const eventId = `payin:${invoiceId}:${payload.invoice_status}:${payload.success}`;
    const idem = await ensurePayinWebhookIdempotency(eventId, booking.id);
    if (idem === "duplicate") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    const isPaid = payload.success === true && payload.invoice_status === "PAID";

    if (isPaid) {
      await logActivity({
        action: ActivityActions.PAYMENT_SUCCESS,
        entityType: "Booking",
        entityId: booking.id,
        details: {
          bookingId: booking.id,
          transactionId: invoiceId,
          paymentMethod: "PAYIN",
          amount: Number(booking.totalAmount),
          currency: booking.currency,
        },
      });

      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          paymentMethod: "PAYIN",
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
          console.error("[PayIn Webhook] Amadeus order creation failed:", amadeusError);
          try {
            await sendAdminAmadeusOrderFailureNotification(
              updatedBooking,
              amadeusError instanceof Error ? amadeusError.message : String(amadeusError)
            );
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
          transactionId: invoiceId,
          paymentMethod: "PAYIN",
          reason: payload.message || payload.invoice_status,
        },
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: "FAILED", paymentMethod: "PAYIN" },
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

    await logActivity({
      action: "WEBHOOK_PROCESSED",
      entityType: "Webhook",
      entityId: bookingId || undefined,
      details: {
        source: "PAYIN",
        bookingId,
        invoiceId: String(payload.invoice_id),
        success: true,
        processingTime: Date.now() - webhookReceivedAt.getTime(),
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PayIn Webhook] Error processing webhook:", error);
    try {
      await logActivity({
        action: "WEBHOOK_ERROR",
        entityType: "Webhook",
        entityId: bookingId || undefined,
        details: {
          source: "PAYIN",
          error: error instanceof Error ? error.message : "Unknown error",
          bookingId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      console.error("[PayIn Webhook] Failed to log error activity:", logError);
    }
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 200 });
  }
}
