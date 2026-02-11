"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft, Edit, Mail, Phone, Calendar, Users, FileText, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserDetailProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: UserRole;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    bookings: Array<{
      id: string;
      bookingType: string;
      status: string;
      totalAmount: any;
      currency: string;
      bookingDate: Date;
      paymentStatus: string;
    }>;
    reviews: Array<{
      id: string;
      rating: number;
      title: string | null;
      isApproved: boolean;
      createdAt: Date;
    }>;
    complaints: Array<{
      id: string;
      subject: string;
      status: string;
      priority: string;
      createdAt: Date;
    }>;
    activityLogs: Array<{
      id: string;
      action: string;
      entityType: string | null;
      createdAt: Date;
    }>;
    _count: {
      bookings: number;
      reviews: number;
      complaints: number;
      activityLogs: number;
    };
  };
}

export function UserDetail({ user }: UserDetailProps) {
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "destructive";
      case "ADMIN":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{user.name || user.email}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/admin/users/${user.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role}
              </Badge>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined: {formatDate(user.createdAt)}</span>
            </div>
            {user.lastLoginAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Last login: {formatDate(user.lastLoginAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Bookings</span>
              </div>
              <span className="font-semibold">{user._count.bookings}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Reviews</span>
              </div>
              <span className="font-semibold">{user._count.reviews}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Complaints</span>
              </div>
              <span className="font-semibold">{user._count.complaints}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Activities</span>
              </div>
              <span className="font-semibold">{user._count.activityLogs}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      {user.bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.bookingType}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {Number(booking.totalAmount).toFixed(2)} {booking.currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant={booking.paymentStatus === "PAID" ? "default" : "secondary"}>
                        {booking.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(booking.bookingDate)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/bookings/${booking.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {user._count.bookings > 10 && (
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <Link href={`/admin/bookings?userId=${user.id}`}>
                    View All {user._count.bookings} Bookings
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {user.activityLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.activityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="font-medium">{log.action}</div>
                    {log.entityType && (
                      <div className="text-sm text-muted-foreground">{log.entityType}</div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </div>
                </div>
              ))}
            </div>
            {user._count.activityLogs > 20 && (
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <Link href={`/admin/activity?userId=${user.id}`}>
                    View All {user._count.activityLogs} Activities
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

