"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { BranchMap } from "./branch-map";

interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  phone: string;
  phoneAlt: string | null;
  email: string;
  emailAlt: string | null;
  workingHours: Record<string, string>;
  isActive: boolean;
  displayOrder: number;
}

interface BranchCardProps {
  branch: Branch;
}

const dayNames: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function BranchCard({ branch }: BranchCardProps) {
  const workingHoursEntries = Object.entries(branch.workingHours)
    .filter(([_, hours]) => hours && hours.trim() !== "")
    .map(([day, hours]) => [dayNames[day] || day, hours]);

  return (
    <div className="space-y-6">
      {/* Branch Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{branch.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Address */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Address</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {branch.address}
                {"\n"}
                {branch.city}, {branch.country}
              </p>
            </div>
          </div>

          {/* Phone Numbers */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Phone</h3>
              <p className="text-sm text-muted-foreground">{branch.phone}</p>
              {branch.phoneAlt && (
                <p className="text-sm text-muted-foreground mt-1">
                  {branch.phoneAlt}
                </p>
              )}
            </div>
          </div>

          {/* Email Addresses */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Email</h3>
              <a
                href={`mailto:${branch.email}`}
                className="text-sm text-primary hover:underline block"
              >
                {branch.email}
              </a>
              {branch.emailAlt && (
                <a
                  href={`mailto:${branch.emailAlt}`}
                  className="text-sm text-primary hover:underline block mt-1"
                >
                  {branch.emailAlt}
                </a>
              )}
            </div>
          </div>

          {/* Working Hours */}
          {workingHoursEntries.length > 0 && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Working Hours</h3>
                <div className="space-y-1">
                  {workingHoursEntries.map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">
                        {day}:
                      </span>
                      <span className="text-muted-foreground">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <BranchMap
        latitude={branch.latitude}
        longitude={branch.longitude}
        branchName={branch.name}
        address={branch.address}
      />
    </div>
  );
}


