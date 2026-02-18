import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit } from "lucide-react";
import { DeleteButton } from "@/components/admin/delete-button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const branches = await prisma.branch.findMany({
    orderBy: [
      { displayOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Branches</h1>
        <Button asChild>
          <Link href="/admin/branches/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No branches found. Create your first branch to get started.
                </TableCell>
              </TableRow>
            ) : (
              branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>
                    {branch.city}, {branch.country}
                  </TableCell>
                  <TableCell>{branch.phone}</TableCell>
                  <TableCell>{branch.email}</TableCell>
                  <TableCell>{branch.displayOrder}</TableCell>
                  <TableCell>
                    {branch.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/branches/${branch.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteButton
                        id={branch.id}
                        entityType="branch"
                        entityName={branch.name}
                        apiPath="/api/admin/branches"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


