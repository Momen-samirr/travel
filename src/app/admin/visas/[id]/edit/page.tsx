import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { VisaForm } from "@/components/admin/visa-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditVisaPage({
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

  const visa = await prisma.visa.findUnique({
    where: { id },
  });

  if (!visa) {
    notFound();
  }

  const initialData = {
    id: visa.id,
    country: visa.country,
    type: visa.type,
    description: visa.description,
    price: Number(visa.price),
    currency: visa.currency,
    processingTime: visa.processingTime,
    requiredDocuments: visa.requiredDocuments as string[],
    isActive: visa.isActive,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Visa Service</h1>
        <p className="text-muted-foreground">Update visa service information</p>
      </div>
      <VisaForm initialData={initialData} />
    </div>
  );
}

