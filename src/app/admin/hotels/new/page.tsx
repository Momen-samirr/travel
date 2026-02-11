import { requireAdmin } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { HotelForm } from "@/components/admin/hotel-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewHotelPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Hotel</h1>
        <p className="text-muted-foreground">Add a new hotel to the system</p>
      </div>
      <HotelForm />
    </div>
  );
}

