import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Guarding happens in admin layout.
  redirect("/admin/dashboard");
}

