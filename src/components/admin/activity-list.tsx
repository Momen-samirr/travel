"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface ActivityLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface ActivityListProps {
  initialLogs: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  action?: string;
  entityType?: string;
  userId?: string;
}

export function ActivityList({
  initialLogs,
  total,
  page,
  limit,
  action: initialAction,
  entityType: initialEntityType,
}: ActivityListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [action, setAction] = useState(initialAction || "all");
  const [entityType, setEntityType] = useState(initialEntityType || "all");

  const totalPages = Math.ceil(total / limit);

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (action !== "all") params.set("action", action);
    if (entityType !== "all") params.set("entityType", entityType);
    params.set("page", "1");
    router.push(`/admin/activity?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/activity?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-end">
        <Select value={action} onValueChange={(value) => {
          setAction(value);
          handleFilterChange();
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="USER_CREATED">User Created</SelectItem>
            <SelectItem value="USER_UPDATED">User Updated</SelectItem>
            <SelectItem value="BOOKING_CREATED">Booking Created</SelectItem>
            <SelectItem value="BOOKING_UPDATED">Booking Updated</SelectItem>
            <SelectItem value="ADMIN_ACTION">Admin Action</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityType} onValueChange={(value) => {
          setEntityType(value);
          handleFilterChange();
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Entity Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entity Types</SelectItem>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="Booking">Booking</SelectItem>
            <SelectItem value="Tour">Tour</SelectItem>
            <SelectItem value="Flight">Flight</SelectItem>
            <SelectItem value="Hotel">Hotel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No activity logs found
                </TableCell>
              </TableRow>
            ) : (
              initialLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.createdAt)}</TableCell>
                  <TableCell>
                    {log.user ? (
                      <Link href={`/admin/users/${log.user.id}`} className="hover:underline">
                        {log.user.name || log.user.email}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.entityType && log.entityId ? (
                      <div>
                        <div className="font-medium">{log.entityType}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {log.entityId.slice(0, 8)}...
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {log.details && typeof log.details === "object" ? (
                      <div className="text-sm">
                        {Object.entries(log.details).slice(0, 2).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {log.ipAddress || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} logs
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

