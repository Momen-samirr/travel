import { requireAdmin } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import { SettingsConfig } from "@/components/admin/settings-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const maskValue = (value: string | undefined) => {
    if (!value) return "Not configured";
    if (value.length <= 8) return "••••••••";
    return `${value.substring(0, 4)}${"•".repeat(value.length - 8)}${value.substring(value.length - 4)}`;
  };

  const configs = [
    {
      title: "Payment Gateways",
      items: [
        { label: "Paymob API Key", value: process.env.PAYMOB_API_KEY },
        { label: "Paymob Integration ID", value: process.env.PAYMOB_INTEGRATION_ID },
        { label: "Paymob HMAC Secret", value: process.env.PAYMOB_HMAC_SECRET },
        { label: "Bank API Key", value: process.env.BANK_API_KEY },
        { label: "Bank Merchant ID", value: process.env.BANK_MERCHANT_ID },
      ],
    },
    {
      title: "External Services",
      items: [
        { label: "Amadeus Client ID", value: process.env.AMADEUS_CLIENT_ID },
        { label: "Amadeus Client Secret", value: process.env.AMADEUS_CLIENT_SECRET },
        { label: "Resend API Key", value: process.env.RESEND_API_KEY },
        { label: "Resend From Email", value: process.env.RESEND_FROM_EMAIL },
      ],
    },
    {
      title: "Application",
      items: [
        { label: "App URL", value: process.env.NEXT_PUBLIC_APP_URL },
        { label: "Database", value: process.env.DATABASE_URL ? "Connected" : "Not configured" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          View and manage application configuration
        </p>
      </div>

      <SettingsConfig />

      {configs.map((config) => (
        <Card key={config.title}>
          <CardHeader>
            <CardTitle>{config.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {config.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="flex items-center gap-2">
                    {item.value ? (
                      <>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {maskValue(item.value)}
                        </code>
                        <Badge variant="outline" className="text-xs">
                          Configured
                        </Badge>
                      </>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Not configured
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

