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
import { Plus, Edit, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DeleteButton } from "@/components/admin/delete-button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminCharterPackagesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const packages = await prisma.charterTravelPackage.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          departureOptions: true,
          hotelOptions: true,
          addons: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Charter Travel Packages</h1>
        <Button asChild>
          <Link href="/admin/charter-packages/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Price Range</TableHead>
              <TableHead>Options</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="font-medium">{pkg.name}</TableCell>
                <TableCell>
                  {pkg.destinationCity}, {pkg.destinationCountry}
                </TableCell>
                <TableCell>
                  {pkg.nights} nights / {pkg.days} days
                </TableCell>
                <TableCell>
                  {pkg.priceRangeMin && pkg.priceRangeMax
                    ? `${formatCurrency(Number(pkg.priceRangeMin), pkg.currency)} - ${formatCurrency(Number(pkg.priceRangeMax), pkg.currency)}`
                    : pkg.basePrice
                    ? formatCurrency(Number(pkg.basePrice), pkg.currency)
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 text-sm">
                    <Badge variant="outline">
                      {pkg._count.departureOptions} Departures
                    </Badge>
                    <Badge variant="outline">
                      {pkg._count.hotelOptions} Hotels
                    </Badge>
                    <Badge variant="outline">{pkg._count.addons} Add-ons</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {pkg.isActive ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/charter-packages/${pkg.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/charter-packages/${pkg.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteButton
                      id={pkg.id}
                      entityType="charter-package"
                      entityName={pkg.name}
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

