import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

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
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Eye } from "lucide-react";

export default async function AdminComplaintsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const complaints = await prisma.complaint.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      booking: {
        select: {
          id: true,
          bookingType: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      case "RESOLVED":
        return "default";
      case "CLOSED":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "default";
      case "MEDIUM":
        return "secondary";
      case "LOW":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Complaints</h1>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map((complaint) => (
              <TableRow key={complaint.id}>
                <TableCell>{complaint.user.name || complaint.user.email}</TableCell>
                <TableCell className="max-w-xs truncate">{complaint.subject}</TableCell>
                <TableCell>{complaint.category}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(complaint.status)}>
                    {complaint.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityColor(complaint.priority)}>
                    {complaint.priority}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(complaint.createdAt)}</TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/complaints/${complaint.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

