import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/clerk";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

// Ensure this runs in Node.js runtime (not Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getCurrentUser will create the user if they don't exist (fallback)
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}

