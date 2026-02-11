"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, Receipt } from "lucide-react";

interface DownloadButtonsProps {
  bookingId: string;
  onDownloadTicket?: () => void;
  onDownloadInvoice?: () => void;
}

export function DownloadButtons({
  bookingId,
  onDownloadTicket,
  onDownloadInvoice,
}: DownloadButtonsProps) {
  const handleDownloadTicket = () => {
    if (onDownloadTicket) {
      onDownloadTicket();
    } else {
      // Default implementation - generate PDF ticket
      window.open(`/api/bookings/${bookingId}/ticket`, "_blank");
    }
  };

  const handleDownloadInvoice = () => {
    if (onDownloadInvoice) {
      onDownloadInvoice();
    } else {
      // Default implementation - generate PDF invoice
      window.open(`/api/bookings/${bookingId}/invoice`, "_blank");
    }
  };

  return (
    <div className="flex gap-4">
      <Button
        variant="outline"
        onClick={handleDownloadTicket}
        className="flex-1"
      >
        <Download className="h-4 w-4 mr-2" />
        Download Ticket
      </Button>
      <Button
        variant="outline"
        onClick={handleDownloadInvoice}
        className="flex-1"
      >
        <Receipt className="h-4 w-4 mr-2" />
        Download Invoice
      </Button>
    </div>
  );
}

