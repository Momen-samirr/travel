"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Building2, Copy, Check } from "lucide-react";

interface BankDetails {
  accountName: string;
  iban: string;
  bankName: string;
  referenceFormat: string;
  amount: number;
  currency: string;
  bookingReference: string;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const bookingId = params.id as string;
  const [paymentMethod, setPaymentMethod] = useState<"paymob" | "bank">("paymob");
  const [loading, setLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const cancelled = searchParams.get("cancelled");
    if (cancelled === "1") {
      toast({
        title: "Payment cancelled",
        description: "You can try again or choose another payment method.",
        variant: "default",
      });
      router.replace(`/bookings/${bookingId}/payment`, { scroll: false });
    }
  }, [searchParams, bookingId, router, toast]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({ title: "Copied to clipboard", variant: "default" });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setBankDetails(null);
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate payment");
      }

      if (paymentMethod === "paymob" && data.paymentUrl) {
        toast({
          title: "Redirecting to payment...",
          description: "You will be redirected to complete your payment.",
          variant: "default",
        });
        window.location.href = data.paymentUrl;
        return;
      }

      if (paymentMethod === "bank" && data.bankDetails) {
        setBankDetails(data.bankDetails);
        toast({
          title: "Bank transfer instructions",
          description: data.message || "Please transfer the amount to the account below.",
          variant: "default",
        });
      }
    } catch (error: unknown) {
      console.error("Error initiating payment:", error);
      toast({
        title: "Failed to initiate payment",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
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
              onValueChange={(value) => {
                setPaymentMethod(value as "paymob" | "bank");
                setBankDetails(null);
              }}
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
                      Transfer to our bank account; we confirm after receipt
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {bankDetails ? (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Transfer the amount below and use the reference when paying. Your booking will be confirmed once we receive and verify the payment.
                </p>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground">Account name</span>
                    <span className="font-mono flex items-center gap-1">
                      {bankDetails.accountName}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(bankDetails.accountName, "accountName")}
                      >
                        {copiedField === "accountName" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground">IBAN</span>
                    <span className="font-mono flex items-center gap-1">
                      {bankDetails.iban}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(bankDetails.iban, "iban")}
                      >
                        {copiedField === "iban" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-mono">{bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-mono font-semibold">
                      {bankDetails.amount} {bankDetails.currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono flex items-center gap-1">
                      {bankDetails.referenceFormat}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(bankDetails.referenceFormat, "reference")}
                      >
                        {copiedField === "reference" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1"
                size="lg"
              >
                {loading ? "Processing..." : bankDetails ? "Show instructions again" : "Proceed to Payment"}
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
