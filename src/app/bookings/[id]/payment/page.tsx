"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Building2 } from "lucide-react";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const bookingId = params.id as string;
  const [paymentMethod, setPaymentMethod] = useState<"paymob" | "bank">("paymob");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const endpoint =
        paymentMethod === "paymob"
          ? "/api/payments/paymob"
          : "/api/payments/bank";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to initiate payment");
      }

      const { paymentUrl } = await response.json();
      toast({
        title: "Redirecting to payment...",
        description: "You will be redirected to complete your payment.",
        variant: "default",
      });
      window.location.href = paymentUrl;
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      toast({
        title: "Failed to initiate payment",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Select Payment Method</h1>

        <Card>
          <CardHeader>
            <CardTitle>Choose how you want to pay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as "paymob" | "bank")
              }
            >
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="paymob" id="paymob" />
                <Label
                  htmlFor="paymob"
                  className="flex-1 cursor-pointer flex items-center gap-3"
                >
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">Paymob</div>
                    <div className="text-sm text-gray-600">
                      Pay with credit/debit card
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="bank" id="bank" />
                <Label
                  htmlFor="bank"
                  className="flex-1 cursor-pointer flex items-center gap-3"
                >
                  <Building2 className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">Bank Transfer</div>
                    <div className="text-sm text-gray-600">
                      Pay through Egyptian banks
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1"
                size="lg"
              >
                {loading ? "Processing..." : "Proceed to Payment"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

