import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const PAYIN_HASH_TOKEN = process.env.PAYIN_HASH_TOKEN!;

function verifySignature(payload: any, receivedSignature: string) {
  const data = `${payload.invoice_id}${payload.invoice_status}${payload.message || ""}`;

  const generated = crypto
    .createHmac("sha256", PAYIN_HASH_TOKEN)
    .update(data)
    .digest("hex");

  return generated === receivedSignature;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("🔔 PayIn Webhook:", body);

    const { invoice_id, invoice_status, signature } = body;

    if (!invoice_id || !invoice_status || !signature) {
      return NextResponse.json({ success: true });
    }

    const isValid = verifySignature(body, signature);

    if (!isValid) {
      console.error("❌ Invalid PayIn signature");
      return NextResponse.json({ success: true });
    }

    const status = invoice_status?.toUpperCase();

    const booking = await prisma.booking.findFirst({
      where: {
        paymentTransactionId: String(invoice_id),
      },
    });

    if (!booking) {
      console.error("❌ Booking not found:", invoice_id);
      return NextResponse.json({ success: true });
    }

    if (status === "PAID") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      });

      console.log("✅ Booking marked as PAID:", booking.id);
    }

    if (status === "FAILED") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "FAILED",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json({ success: true });
  }
}