import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Plane, MapPin, Hotel, FileText, DollarSign, Users, CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    toursCount,
    flightsCount,
    hotelsCount,
    visasCount,
    bookingsCount,
    usersCount,
    pendingPayments,
    paidPayments,
    failedPayments,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    recentPayments,
  ] = await Promise.all([
    prisma.tour.count(),
    prisma.flight.count(),
    prisma.hotel.count(),
    prisma.visa.count(),
    prisma.booking.count(),
    prisma.user.count(),
    prisma.booking.count({ where: { paymentStatus: "PENDING" } }),
    prisma.booking.count({ where: { paymentStatus: "PAID" } }),
    prisma.booking.count({ where: { paymentStatus: "FAILED" } }),
    prisma.booking.aggregate({
      where: {
        paymentStatus: "PAID",
        bookingDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.booking.aggregate({
      where: {
        paymentStatus: "PAID",
        bookingDate: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.booking.aggregate({
      where: {
        paymentStatus: "PAID",
        bookingDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        paymentStatus: "PAID",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Tours", value: toursCount, icon: MapPin },
    { label: "Flights", value: flightsCount, icon: Plane },
    { label: "Hotels", value: hotelsCount, icon: Hotel },
    { label: "Visas", value: visasCount, icon: FileText },
    { label: "Bookings", value: bookingsCount, icon: DollarSign },
    { label: "Users", value: usersCount, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <Button variant="link" className="p-0 h-auto mt-2" asChild>
              <Link href="/admin/bookings?paymentStatus=PENDING">View all →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidPayments}</div>
            <Button variant="link" className="p-0 h-auto mt-2" asChild>
              <Link href="/admin/bookings?paymentStatus=PAID">View all →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedPayments}</div>
            <Button variant="link" className="p-0 h-auto mt-2" asChild>
              <Link href="/admin/bookings?paymentStatus=FAILED">View all →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(todayRevenue._sum.totalAmount || 0), "EGP")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Week: {formatCurrency(Number(weekRevenue._sum.totalAmount || 0), "EGP")}
            </p>
            <p className="text-xs text-muted-foreground">
              Month: {formatCurrency(Number(monthRevenue._sum.totalAmount || 0), "EGP")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest successful payments</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/bookings?paymentStatus=PAID">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent payments
            </p>
          ) : (
            <div className="space-y-4">
              {recentPayments.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {booking.user.name || booking.user.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Booking ID: {booking.id.slice(0, 8)}... • {booking.bookingType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {formatCurrency(Number(booking.totalAmount), booking.currency)}
                    </div>
                    <Badge variant="default" className="mt-1">PAID</Badge>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="ml-4">
                    <Link href={`/admin/bookings/${booking.id}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

