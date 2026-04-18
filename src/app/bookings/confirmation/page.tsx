import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PayinConfirmationPage({
  searchParams,
}: {
  searchParams: { invoice_id?: string; invoice_status?: string };
}) {
  const invoiceId = searchParams.invoice_id;

  // ❌ Missing invoice_id
  if (!invoiceId) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Invalid payment response.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Find booking using invoice_id
  const booking = await prisma.booking.findFirst({
    where: {
      paymentTransactionId: invoiceId,
    },
  });
  const invoiceId = searchParams.invoice_id;

  console.log("🔍 invoiceId from URL:", invoiceId); // 👈 HERE

  const booking = await prisma.booking.findFirst({
    where: {
      paymentTransactionId: invoiceId,
    },
  });

  console.log("🔍 booking from DB:", booking); // 👈 AND HERE

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Booking not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Correct status handling
  if (booking.paymentStatus === "PAID") {
    redirect(`/bookings/${booking.id}/confirmation`);
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-green-800">
              Payment Successful 🎉
            </h2>
            <p className="text-green-700 mt-2">
              Your payment is being processed. You will be redirected shortly.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href={`/bookings/${booking.id}/confirmation`}>
              View Booking
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
