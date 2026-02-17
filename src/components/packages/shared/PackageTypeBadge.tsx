"use client";

import { Badge } from "@/components/ui/badge";
import { PackageType } from "@/services/packages/types";
import { Plane, MapPin, Globe, Home, Settings } from "lucide-react";

interface PackageTypeBadgeProps {
  type: PackageType;
  className?: string;
}

const typeConfig = {
  [PackageType.HOTEL_CHARTER]: {
    label: "Charter",
    icon: Plane,
    className: "bg-blue-500/90 text-white",
  },
  [PackageType.INBOUND]: {
    label: "Inbound",
    icon: MapPin,
    className: "bg-green-500/90 text-white",
  },
  [PackageType.OUTBOUND]: {
    label: "Outbound",
    icon: Globe,
    className: "bg-purple-500/90 text-white",
  },
  [PackageType.DOMESTIC]: {
    label: "Domestic",
    icon: Home,
    className: "bg-orange-500/90 text-white",
  },
  [PackageType.CUSTOM]: {
    label: "Custom",
    icon: Settings,
    className: "bg-gray-500/90 text-white",
  },
};

export function PackageTypeBadge({ type, className }: PackageTypeBadgeProps) {
  const config = typeConfig[type] || typeConfig[PackageType.CUSTOM];
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} ${className || ""}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

