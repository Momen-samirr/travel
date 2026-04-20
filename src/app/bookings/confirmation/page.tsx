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
  const invoiceId = String(searchParams.invoice_id || "").trim();

  console.log("🔍 searchParams:", searchParams);
  console.log("🔍 invoiceId:", invoiceId);

  // ❌ Missing invoice_id
  if (!invoiceId) {
    return <div>Invalid payment response</div>;
  }

  // ✅ Find booking
  const booking = await prisma.booking.findFirst({
    where: {
      paymentTransactionId: invoiceId,
    },
  });

  console.log("🔍 booking:", booking);

  if (!booking) {
    return <div>Booking not found</div>;
  }

  // ✅ Check success
  const isSuccess =
    String(searchParams.invoice_status || "").toUpperCase() === "PAID" ||
    searchParams.success === "1";

  // ✅ Update booking if paid
  if (isSuccess) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
      },
    });
  }

  // ✅ Redirect to final confirmation page
  redirect(`/bookings/${booking.id}/confirmation`);
}
