export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Page() {
  let debug: any = {};

  try {
    // 🔥 FORCE READ FULL URL FROM HEADERS
    const headersList = headers();
    const fullUrl =
      headersList.get("x-url") || headersList.get("referer") || "";

    const parsedUrl = fullUrl ? new URL(fullUrl) : null;

    const invoiceId = parsedUrl?.searchParams.get("invoice_id") || "";
    const status = (
      parsedUrl?.searchParams.get("invoice_status") || ""
    ).toUpperCase();
    const success = parsedUrl?.searchParams.get("success") || "";

    debug = {
      fullUrl,
      parsed: {
        invoiceId,
        status,
        success,
      },
    };

    // ❌ NO INVOICE ID
    if (!invoiceId) {
      return (
        <pre style={{ color: "red", fontSize: "18px" }}>
          {JSON.stringify({ error: "NO_INVOICE_ID", debug }, null, 2)}
        </pre>
      );
    }

    // ✅ FIND BOOKING
    const booking = await prisma.booking.findFirst({
      where: {
        paymentTransactionId: invoiceId,
      },
    });

    debug.booking = booking;

    if (!booking) {
      return (
        <pre style={{ color: "red", fontSize: "18px" }}>
          {JSON.stringify({ error: "BOOKING_NOT_FOUND", debug }, null, 2)}
        </pre>
      );
    }

    // ✅ SUCCESS CHECK
    const isSuccess = status === "PAID" || success === "1";

    debug.isSuccess = isSuccess;

    if (isSuccess) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      });

      // 🔁 TEMP: show debug instead of redirect
      return (
        <pre style={{ color: "green", fontSize: "18px" }}>
          {JSON.stringify(
            {
              success: true,
              redirectTo: `/bookings/${booking.id}/confirmation`,
              debug,
            },
            null,
            2,
          )}
        </pre>
      );

      // 👉 AFTER CONFIRMING IT WORKS, UNCOMMENT:
      // redirect(`/bookings/${booking.id}/confirmation`);
    }

    return (
      <pre style={{ color: "red", fontSize: "18px" }}>
        {JSON.stringify({ error: "PAYMENT_FAILED", debug }, null, 2)}
      </pre>
    );
  } catch (err: any) {
    return (
      <pre style={{ color: "red", fontSize: "18px" }}>
        {JSON.stringify(
          {
            error: "CRASH",
            message: err?.message,
            stack: err?.stack,
          },
          null,
          2,
        )}
      </pre>
    );
  }
}
