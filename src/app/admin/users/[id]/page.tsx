import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { UserDetail } from "@/components/admin/user-detail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      bookings: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          bookingType: true,
          status: true,
          totalAmount: true,
          currency: true,
          bookingDate: true,
          paymentStatus: true,
        },
      },
      reviews: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          title: true,
          isApproved: true,
          createdAt: true,
        },
      },
      complaints: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      },
      activityLogs: {
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          entityType: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
          complaints: true,
          activityLogs: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div>
      <UserDetail user={user} />
    </div>
  );
}

