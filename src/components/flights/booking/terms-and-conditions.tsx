"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface TermsAndConditionsProps {
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

export function TermsAndConditions({
  accepted,
  onAcceptChange,
}: TermsAndConditionsProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={accepted}
            onCheckedChange={(checked) => onAcceptChange(checked === true)}
            className="mt-1"
          />
          <label
            htmlFor="terms"
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            I agree to the{" "}
            <Link href="/terms" className="text-primary underline" target="_blank">
              Terms and Conditions
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-primary underline" target="_blank">
              Privacy Policy
            </Link>
            . I understand the cancellation and refund policy.
          </label>
        </div>
        <div className="mt-3 text-xs text-gray-600 pl-7">
          <p className="mb-1">
            <strong>Cancellation Policy:</strong> Cancellations made 24+ hours before departure are eligible for a refund minus processing fees. 
            Cancellations within 24 hours are non-refundable.
          </p>
          <p>
            <strong>Refund Policy:</strong> Refunds will be processed within 5-10 business days to the original payment method.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

