"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BookingReferenceProps {
  bookingId: string;
  status?: string;
}

export function BookingReference({ bookingId, status = "Confirmed" }: BookingReferenceProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingId);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Booking reference copied to clipboard",
      variant: "default",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Reference</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">Booking ID</div>
            <div className="text-2xl font-mono font-bold">{bookingId}</div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {status}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              title="Copy booking reference"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

