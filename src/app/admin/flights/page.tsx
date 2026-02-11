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
import { Plus, Edit, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminFlightsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const flights = await prisma.flight.findMany({
    orderBy: { departureDate: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Flights</h1>
        <Button asChild>
          <Link href="/admin/flights/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Flight
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flight Number</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Available Seats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flights.map((flight) => (
              <TableRow key={flight.id}>
                <TableCell className="font-medium">
                  {flight.flightNumber}
                </TableCell>
                <TableCell>
                  {flight.origin} → {flight.destination}
                </TableCell>
                <TableCell>{formatDate(flight.departureDate)}</TableCell>
                <TableCell>
                  {formatCurrency(Number(flight.price), flight.currency)}
                </TableCell>
                <TableCell>{flight.availableSeats}</TableCell>
                <TableCell>
                  {flight.isActive ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/flights/${flight.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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

