import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  let debug: any = {};

  try {
    const invoiceIdRaw = searchParams?.invoice_id;
    const invoiceId = Array.isArray(invoiceIdRaw)
      ? invoiceIdRaw[0]
      : invoiceIdRaw || "";

    const statusRaw = searchParams?.invoice_status;
    const status = Array.isArray(statusRaw)
      ? statusRaw[0]
      : (statusRaw || "").toUpperCase();

    const successRaw = searchParams?.success;
    const success = Array.isArray(successRaw)
      ? successRaw[0]
      : successRaw || "";

    debug = {
      searchParams,
      parsed: {
        invoiceId,
        status,
        success,
      },
    };

    // ❌ no invoice id
    if (!invoiceId) {
      return (
        <pre style={{ color: "red", fontSize: "18px" }}>
          {JSON.stringify({ error: "NO_INVOICE_ID", debug }, null, 2)}
        </pre>
      );
    }

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

      return (
        <pre style={{ color: "green", fontSize: "18px" }}>
          {JSON.stringify(
            {
              success: true,
              redirectingTo: `/bookings/${booking.id}/confirmation`,
              debug,
            },
            null,
            2,
          )}
        </pre>
      );

      // comment redirect temporarily
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
          { error: "CRASH", message: err?.message, stack: err?.stack },
          null,
          2,
        )}
      </pre>
    );
  }
}
