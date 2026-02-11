"use client";

import { useState, useEffect, useRef } from "react";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { MoreVertical, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Booking {
  id: string;
  bookingType: string;
  status: string;
  totalAmount: number | string;
  currency: string;
  paymentStatus: string;
  bookingDate: Date;
  travelDate: Date | null;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  tour: {
    id: string;
    title: string;
    slug: string;
  } | null;
  flight: {
    id: string;
    flightNumber: string;
    origin: string;
    destination: string;
  } | null;
  hotel: {
    id: string;
    name: string;
    slug: string;
  } | null;
  visa: {
    id: string;
    country: string;
    type: string;
  } | null;
}

interface BookingsListProps {
  initialBookings: Booking[];
  total: number;
  page: number;
  limit: number;
  status?: string;
  paymentStatus?: string;
  bookingType?: string;
}

export function BookingsList({
  initialBookings,
  total,
  page,
  limit,
  status: initialStatus,
  paymentStatus: initialPaymentStatus,
  bookingType: initialBookingType,
}: BookingsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState(initialStatus || "all");
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus || "all");
  const [bookingType, setBookingType] = useState(initialBookingType || "all");
  const [bookings, setBookings] = useState(initialBookings);
  const [refreshing, setRefreshing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalPages = Math.ceil(total / limit);

  // Set up polling when component mounts and page is visible
  useEffect(() => {
    const checkBookingStatuses = async () => {
      if (bookings.length === 0) return;

      try {
        const bookingIds = bookings.map((b) => b.id).join(",");
        const response = await fetch(`/api/admin/bookings/status?ids=${bookingIds}`);
        
        if (!response.ok) return;

        const data = await response.json();
        const statusMap = data.bookings;

        // Update bookings with new statuses
        setBookings((prevBookings) =>
          prevBookings.map((booking) => {
            const updated = statusMap[booking.id];
            if (updated && (updated.status !== booking.status || updated.paymentStatus !== booking.paymentStatus)) {
              // Show toast for payment status changes
              if (updated.paymentStatus !== booking.paymentStatus && updated.paymentStatus === "PAID") {
                toast({
                  title: "Payment Received",
                  description: `Booking ${booking.id.slice(0, 8)}... payment status updated to PAID`,
                  variant: "default",
                });
              }
              return {
                ...booking,
                status: updated.status,
                paymentStatus: updated.paymentStatus,
              };
            }
            return booking;
          })
        );
      } catch {
        // Silently handle errors
      }
    };

    const startPolling = () => {
      // Poll every 30 seconds
      pollingIntervalRef.current = setInterval(() => {
        // Only poll if page is visible
        if (document.visibilityState === "visible") {
          checkBookingStatuses();
        }
      }, 30000);
    };

    startPolling();

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Immediately check when page becomes visible
        checkBookingStatuses();
        startPolling();
      } else {
        // Stop polling when page is hidden
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [bookings, toast]); // Re-run if bookings change

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Re-fetch all bookings
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
      if (bookingType !== "all") params.set("bookingType", bookingType);
      params.set("page", page.toString());

      const response = await fetch(`/api/admin/bookings?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
        toast({
          title: "Refreshed",
          description: "Booking list has been updated",
          variant: "default",
        });
      }
    } catch {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh booking list",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
    if (bookingType !== "all") params.set("bookingType", bookingType);
    params.set("page", "1");
    router.push(`/admin/bookings?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/bookings?${params.toString()}`);
  };

  const getBookingTitle = (booking: Booking) => {
    if (booking.tour) return booking.tour.title;
    if (booking.flight) return `${booking.flight.origin} → ${booking.flight.destination}`;
    if (booking.hotel) return booking.hotel.name;
    if (booking.visa) return `${booking.visa.country} - ${booking.visa.type}`;
    return "Unknown";
  };

  return (
    <div className="space-y-4">
      {/* Refresh Button */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <Select value={status} onValueChange={(value) => {
          setStatus(value);
          handleFilterChange();
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentStatus} onValueChange={(value) => {
          setPaymentStatus(value);
          handleFilterChange();
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={bookingType} onValueChange={(value) => {
          setBookingType(value);
          handleFilterChange();
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Booking Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="TOUR">Tour</SelectItem>
            <SelectItem value="FLIGHT">Flight</SelectItem>
            <SelectItem value="HOTEL">Hotel</SelectItem>
            <SelectItem value="VISA">Visa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-sm">{booking.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <Badge variant="outline">{booking.bookingType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.user.name || booking.user.email}</div>
                      <div className="text-sm text-muted-foreground">{booking.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getBookingTitle(booking)}</TableCell>
                  <TableCell>
                    {formatCurrency(Number(booking.totalAmount), booking.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{booking.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={booking.paymentStatus === "PAID" ? "default" : booking.paymentStatus === "FAILED" ? "destructive" : "secondary"}
                      className="transition-colors"
                    >
                      {booking.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(booking.bookingDate)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/bookings/${booking.id}`}>View Details</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} bookings
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

