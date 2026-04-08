import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const PAYIN_HASH_TOKEN = process.env.PAYIN_HASH_TOKEN!;

function verifySignature(payload: any, receivedSignature: string) {
  const data = [
    payload.invoice_id,
    payload.invoice_status,
    payload.message || "",
  ];

  const generated = crypto
    .createHmac("sha256", PAYIN_HASH_TOKEN)
    .update(data.join(""))
    .digest("hex");

  return generated === receivedSignature;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("🔔 PayIn Webhook:", body);

    const {
      invoice_id,
      invoice_status,
      signature,
    } = body;

    if (!invoice_id || !invoice_status || !signature) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // ✅ Verify signature
    const isValid = verifySignature(body, signature);

    if (!isValid) {
      console.error("❌ Invalid PayIn signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    // ✅ Find booking
    const booking = await prisma.booking.findFirst({
      where: {
        paymentTransactionId: String(invoice_id),
      },
    });

    if (!booking) {
      console.error("❌ Booking not found for invoice:", invoice_id);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // ✅ Handle payment status
    if (invoice_status === "PAID") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      });

      console.log("✅ Booking marked as PAID:", booking.id);
    }

    if (invoice_status === "FAILED") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "FAILED",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ PayIn webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}