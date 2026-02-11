import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminPage() {
  // Redirect to dashboard
  redirect("/admin/dashboard");
}

