import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { ActivityList } from "@/components/admin/activity-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    action?: string;
    entityType?: string;
    userId?: string;
  }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 50;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.action) {
    where.action = params.action;
  }

  if (params.entityType) {
    where.entityType = params.entityType;
  }

  if (params.userId) {
    where.userId = params.userId;
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Activity Logs</h1>
      </div>
      <ActivityList
        initialLogs={logs}
        total={total}
        page={page}
        limit={limit}
        action={params.action}
        entityType={params.entityType}
        userId={params.userId}
      />
    </div>
  );
}

