import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { BranchForm } from "@/components/admin/branch-form";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditBranchPage({
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
  const branch = await prisma.branch.findUnique({
    where: { id },
  });

  if (!branch) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Branch</h1>
        <p className="text-muted-foreground mt-2">
          Update branch information and location.
        </p>
      </div>

      <BranchForm
        initialData={{
          id: branch.id,
          name: branch.name,
          slug: branch.slug,
          address: branch.address,
          city: branch.city,
          country: branch.country,
          latitude: branch.latitude,
          longitude: branch.longitude,
          placeId: branch.placeId,
          phone: branch.phone,
          phoneAlt: branch.phoneAlt,
          email: branch.email,
          emailAlt: branch.emailAlt,
          workingHours: branch.workingHours as Record<string, string>,
          isActive: branch.isActive,
          displayOrder: branch.displayOrder,
        }}
      />
    </div>
  );
}


