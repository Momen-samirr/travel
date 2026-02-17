"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MapPin,
  Plane,
  Hotel,
  FileText,
  BookOpen,
  MessageSquare,
  AlertCircle,
  Settings,
  Users,
  ShoppingCart,
  Activity,
  Package,
} from "lucide-react";

const menuItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: ShoppingCart },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/tours", label: "Tours", icon: MapPin },
  { href: "/admin/charter-packages", label: "Charter Packages", icon: Package },
  { href: "/admin/flights", label: "Flights", icon: Plane },
  { href: "/admin/hotels", label: "Hotels", icon: Hotel },
  { href: "/admin/visas", label: "Visas", icon: FileText },
  { href: "/admin/blogs", label: "Blogs", icon: BookOpen },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/complaints", label: "Complaints", icon: AlertCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r">
      <div className="p-6">
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>
      <nav className="px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-gray-100"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

