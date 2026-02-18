import { requireAdmin } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { BranchForm } from "@/components/admin/branch-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewBranchPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Branch</h1>
        <p className="text-muted-foreground mt-2">
          Add a new branch location to your contact page.
        </p>
      </div>

      <BranchForm />
    </div>
  );
}


