import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function PayinConfirmationPage({
  searchParams,
}: {
  searchParams: {
    invoice_id?: string;
    invoice_status?: string;
    success?: string;
  };
}) {
  const invoiceId = String(searchParams.invoice_id ?? "").trim();
  const status = String(searchParams.invoice_status ?? "").toUpperCase();
  const success = String(searchParams.success ?? "");

  console.log("🔥 CONFIRM PAGE HIT");
  console.log("invoiceId:", invoiceId);
  console.log("status:", status);
  console.log("success:", success);

  // ❌ No invoice_id at all → real error
  if (!invoiceId) {
    return (
      <div style={{ padding: 40 }}>
        <h2 style={{ color: "red" }}>
          Invalid payment response (no invoice_id)
        </h2>
      </div>
    );
  }

  // ✅ Find booking
  const booking = await prisma.booking.findFirst({
    where: {
      paymentTransactionId: invoiceId,
    },
  });

  if (!booking) {
    return (
      <div style={{ padding: 40 }}>
        <h2 style={{ color: "red" }}>
          Booking not found for invoice: {invoiceId}
        </h2>
      </div>
    );
  }

  // ✅ SUCCESS CONDITION (THIS IS THE FIX)
  const isSuccess = status === "PAID" || success === "1";

  if (isSuccess) {
    // update booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
      },
    });

    // redirect to final page
    redirect(`/bookings/${booking.id}/confirmation`);
  }

  // ❌ If NOT success
  return (
    <div style={{ padding: 40 }}>
      <h2 style={{ color: "red" }}>Payment not successful</h2>

      <p>invoice_id: {invoiceId}</p>
      <p>status: {status}</p>
      <p>success: {success}</p>
    </div>
  );
}
