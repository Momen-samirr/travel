import { requireAdmin } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { VisaForm } from "@/components/admin/visa-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewVisaPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Visa Service</h1>
        <p className="text-muted-foreground">Add a new visa service to the system</p>
      </div>
      <VisaForm />
    </div>
  );
}

