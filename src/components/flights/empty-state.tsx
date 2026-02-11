"use client";

import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  message?: string;
  onRetry?: () => void;
}

export function EmptyState({
  message = "No flights found. Try adjusting your search criteria.",
  onRetry,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Plane className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Flights Found</h3>
        <p className="text-gray-600 text-center mb-4 max-w-md">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

