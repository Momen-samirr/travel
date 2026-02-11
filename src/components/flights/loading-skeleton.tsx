"use client";

import { Card, CardContent } from "@/components/ui/card";

export function FlightLoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-12 bg-gray-200 rounded w-20"></div>
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className="h-12 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

