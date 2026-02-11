import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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
import { formatCurrency } from "@/lib/utils";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function AdminVisasPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const visas = await prisma.visa.findMany({
    orderBy: { country: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Visas</h1>
        <Button asChild>
          <Link href="/admin/visas/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Visa Service
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Processing Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visas.map((visa) => (
              <TableRow key={visa.id}>
                <TableCell className="font-medium">{visa.country}</TableCell>
                <TableCell>{visa.type}</TableCell>
                <TableCell>
                  {formatCurrency(Number(visa.price), visa.currency)}
                </TableCell>
                <TableCell>{visa.processingTime}</TableCell>
                <TableCell>
                  {visa.isActive ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/visas/${visa.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteButton
                      id={visa.id}
                      entityType="visa"
                      entityName={`${visa.country} - ${visa.type}`}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

